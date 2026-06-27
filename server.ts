import express from "express";
import path from "path";
import Stripe from "stripe";
import cors from "cors";
import { Connection, Keypair, PublicKey, VersionedTransaction, Transaction, SystemProgram, TransactionMessage, AddressLookupTableAccount, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";

// It's safe to not throw error here if not set, as it allows frontend to boot.
const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parser for all non-webhook routes
  app.use(express.json());
  app.use(cors());

  // Health check endpoint for Cloud Run/container checks
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Solana RPC Proxy to bypass browser CORS and keep key safe
  app.post("/api/solana-rpc", async (req, res) => {
    try {
      const response = await fetch("https://mainnet.helius-rpc.com/?api-key=3d18e988-fdce-4070-86a3-f5c2dd98c15c", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("RPC proxy error, falling back:", error.message);
      // Fallback to public node
      try {
        const responseFallback = await fetch("https://solana-rpc.publicnode.com", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        });
        const dataFallback = await responseFallback.json();
        res.json(dataFallback);
      } catch (fallbackError: any) {
        res.status(500).json({ error: fallbackError.message });
      }
    }
  });

  // Helius Transactions Proxy to bypass browser CORS
  app.get("/api/helius-transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const response = await fetch(`https://mainnet.helius-rpc.com/v0/addresses/${address}/transactions/?api-key=3d18e988-fdce-4070-86a3-f5c2dd98c15c`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching transactions from Helius:", error);
      res.json([]); // Return empty list rather than breaking
    }
  });

  // Backend Trade Execution Pipeline (100% CORS-free and resilient)
  app.post("/api/execute-swap", async (req, res) => {
    try {
      const { walletSecretKey, amount, outputMint } = req.body;
      
      if (!walletSecretKey || !amount || !outputMint) {
        return res.status(400).json({ error: "Missing required parameters: walletSecretKey, amount, outputMint" });
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: "Invalid swap amount." });
      }

      // Initialize Solana connection with dedicated RPC
      const rpcConnection = new Connection("https://mainnet.helius-rpc.com/?api-key=3d18e988-fdce-4070-86a3-f5c2dd98c15c", 'confirmed');

      const keypair = Keypair.fromSecretKey(bs58.decode(walletSecretKey));
      const publicKey = keypair.publicKey;

      // 1. Check user's balance
      const balanceLamports = await rpcConnection.getBalance(publicKey);
      const balanceSol = balanceLamports / 1e9;
      const networkFee = 0.001; // Approximate dynamic priority fee
      const ataRent = 0.00204;  // ATA creation rent
      const feePercent = 0.045; // 4.5% platform fee
      
      const totalRequired = amountNum + (amountNum * feePercent) + networkFee + ataRent;

      if (totalRequired > balanceSol) {
        return res.status(400).json({ 
          error: `Insufficient SOL balance to cover trade + fees. You need at least ${totalRequired.toFixed(5)} SOL.` 
        });
      }

      console.log(`Starting swap for user ${publicKey.toBase58()}. Balance: ${balanceSol} SOL. Amount: ${amountNum} SOL.`);

      // 2. Fee Extraction Logic: Calculate exactly 4.5% of the user's SOL input amount
      const feeAmountLamports = Math.floor(amountNum * feePercent * 1e9);
      const feeRecipient = new PublicKey('6RhMyWHqq6dhsPanwh3J3hNLzUrQ4fQV1SZvtu4csUG5');
      
      // Swap the FULL input amount, fee is charged on top
      const lamportsToSwap = Math.floor(amountNum * 1e9);
      if (lamportsToSwap <= 0) {
        return res.status(400).json({ error: "Swap amount too small." });
      }

      const SOL_MINT = "So11111111111111111111111111111111111111112";

      // 3. Derive destination token account for the user to avoid IncorrectTokenProgramID (0x177e)
      const outputMintPubkey = new PublicKey(outputMint);
      const mintInfo = await rpcConnection.getAccountInfo(outputMintPubkey);
      const tokenProgramId = mintInfo?.owner || TOKEN_PROGRAM_ID;
      const destinationTokenAccount = getAssociatedTokenAddressSync(
        outputMintPubkey,
        publicKey,
        true, // allowOwnerOffCurve (true is safer for PDAs, false is fine for standard users, but true avoids edge cases)
        tokenProgramId
      );

      // 4. Request swap route using Jupiter /quote
      console.log(`Attempting Jupiter routing for ${outputMint}...`);
      // Increase slippage tolerance to 1500 bps (15%) for micro-cap meme coins
      const quoteUrl = `https://public.jupiterapi.com/quote?inputMint=${SOL_MINT}&outputMint=${outputMint}&amount=${lamportsToSwap}&slippageBps=1500`;
      const quoteRes = await fetch(quoteUrl);
      const quoteData = await quoteRes.json();
      
      if (!quoteData || !quoteData.outAmount) {
         if (quoteData && quoteData.errorCode === 'TOKEN_NOT_TRADABLE') {
           throw new Error("TOKEN_NOT_TRADABLE: This token cannot be traded currently.");
         }
         if (quoteData && quoteData.error && quoteData.error.includes("Route not found")) {
           throw new Error("NO_ROUTES_FOUND: No liquidity routes available for this token. It may be too new or lack a liquidity pool.");
         }
         throw new Error(`Jupiter quote failed: ${quoteData?.error || "Unknown error"}`);
      }
      
      console.log("Jupiter quote found. Requesting swap transaction...");
      
      // 4. Send fee transfer transaction first
      const feeInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: feeRecipient,
        lamports: feeAmountLamports,
      });
      
      try {
        const feeTx = new Transaction().add(feeInstruction);
        feeTx.feePayer = publicKey;
        feeTx.recentBlockhash = (await rpcConnection.getLatestBlockhash('confirmed')).blockhash;
        feeTx.sign(keypair);
        const feeSig = await rpcConnection.sendRawTransaction(feeTx.serialize(), { skipPreflight: true });
        console.log(`Platform fee transaction sent. Sig: ${feeSig}`);
      } catch (feeErr: any) {
        console.warn("Platform fee warning (continuing with swap):", feeErr.message);
      }

      // 5. Request and Execute Jupiter /swap transaction
      const swapRes = await fetch('https://public.jupiterapi.com/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quoteData,
          userPublicKey: publicKey.toBase58(),
          destinationTokenAccount: destinationTokenAccount.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto"
        })
      });
      
      const swapData = await swapRes.json();
      if (!swapData || !swapData.swapTransaction) {
         throw new Error(`Jupiter swap generation failed: ${swapData?.error || "Unknown error"}`);
      }

      console.log("Successfully retrieved swap transaction from Jupiter. Serializing and signing...");
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      transaction.sign([keypair]);
      
      try {
        const swapTxSignature = await rpcConnection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: false,
          maxRetries: 3
        });
        console.log(`Jupiter Swap transaction broadcasted. Sig: ${swapTxSignature}`);

        res.json({
          success: true,
          swapTxId: swapTxSignature,
          outputMint: outputMint,
          swappedAmount: amountNum
        });
      } catch (sendErr: any) {
        console.error("Jupiter sendRawTransaction failed:", sendErr);
        throw new Error("Transaction simulation or execution failed. Try again or increase slippage: " + sendErr.message);
      }
    } catch (e: any) {
      console.error("Backend execution pipeline error:", e);
      res.status(500).json({ 
        error: e.message || "An error occurred during trade execution."
      });
    }
  });

  // API Route to create checkout session
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY not configured on server." });
    }

    try {
      const { uid, username } = req.body;
      let appUrl = process.env.APP_URL || req.headers.origin || req.protocol + '://' + req.get('host');
      if (appUrl.endsWith('/')) {
        appUrl = appUrl.slice(0, -1);
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Premium Access (1 Week)",
                description: "Unlock all the best coins on the market.",
              },
              unit_amount: 499, // $4.99
              recurring: {
                interval: "week",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${appUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}?payment=cancel`,
        client_reference_id: uid, // Use this for webhook or manual success handling
      });

      res.json({ url: session.url });
    } catch (e: any) {
      console.error("Stripe error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/verify-session", async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
    try {
      const { sessionId } = req.body;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        res.json({ isPremium: true });
      } else {
        res.json({ isPremium: false });
      }
    } catch (e: any) {
      console.error("Session verification error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e: any) {
      console.warn("Failed to load Vite. Falling back to static production serving.", e);
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
