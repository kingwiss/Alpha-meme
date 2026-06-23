import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import cors from "cors";

// It's safe to not throw error here if not set, as it allows frontend to boot.
const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parser for all non-webhook routes
  app.use(express.json());
  app.use(cors());

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

  // Proxy for Jupiter Quote
  app.get("/api/jup/quote", async (req, res) => {
    try {
      const qs = new URLSearchParams(req.query as Record<string, string>).toString();
      const response = await fetch(`https://quote-api.jup.ag/v6/quote?${qs}`);
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      console.error("Jupiter Quote Proxy error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Proxy for Jupiter Swap
  app.post("/api/jup/swap", async (req, res) => {
    try {
      const response = await fetch(`https://quote-api.jup.ag/v6/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      console.error("Jupiter Swap Proxy error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
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
