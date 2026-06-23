import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction, PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { useAuth } from '../contexts/AuthContext';
import bs58 from 'bs58';

const FEE_ACCOUNT_ADDRESS = "6RhMyWHqq6dhsPanwh3J3hNLzUrQ4fQV1SZvtu4csUG5"; // Paste your Solana referral fee account public key here

export const TerminalModal = ({ onClose, initialMint }: { onClose: () => void, initialMint: string }) => {
  const { connection } = useConnection();
  const { profile } = useAuth();
  
  const walletPubkeyString = profile?.walletPublicKey;
  const walletSecretKeyBase58 = profile?.walletSecretKey;
  const publicKey = walletPubkeyString ? new PublicKey(walletPubkeyString) : null;
  
  const [activeTab, setActiveTab] = useState<'trade' | 'funding'>(initialMint === '' ? 'funding' : 'trade');
  
  const [solAmount, setSolAmount] = useState('0.1');
  const [isSwapping, setIsSwapping] = useState(false);
  const [status, setStatus] = useState('');
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  
  useEffect(() => {
    let active = true;
    if (publicKey) {
      connection.getBalance(publicKey)
        .then(bal => { if (active) setSolBalance(bal / 1e9); })
        .catch(console.error);
    } else {
      setTimeout(() => setSolBalance(null), 0);
    }
    return () => { active = false; };
  }, [publicKey, connection]);

  useEffect(() => {
    let active = true;
    if (activeTab !== 'trade' || !initialMint || !solAmount || isNaN(parseFloat(solAmount)) || parseFloat(solAmount) <= 0) {
      setQuoteData(null);
      return;
    }

    const fetchQuote = async () => {
      try {
        setIsQuoting(true);
        const rawLamports = Math.floor(parseFloat(solAmount) * 1e9);
        const feeLamports = Math.floor(rawLamports * 0.03); // 3% fee
        const swapLamports = rawLamports - feeLamports;
        const cleanMint = initialMint.trim();
        
        const url = `/api/jup/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${cleanMint}&amount=${swapLamports}&slippageBps=500`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (active && data && !data.error) {
          setQuoteData(data);
        } else if (active) {
          setQuoteData(null);
        }
      } catch (err) {
        if (active) setQuoteData(null);
      } finally {
        if (active) setIsQuoting(false);
      }
    };

    const debounceId = setTimeout(fetchQuote, 500);
    return () => {
      active = false;
      clearTimeout(debounceId);
    };
  }, [solAmount, initialMint, activeTab]);

    const handleSwap = async () => {
    if (!publicKey) {
      setStatus('Connect wallet first.');
      return;
    }
    
    let currentStep = 'initializing';
    try {
      setIsSwapping(true);
      if (!walletSecretKeyBase58) throw new Error("Wallet not initialized");
      const keypair = Keypair.fromSecretKey(bs58.decode(walletSecretKeyBase58));

      const rawLamports = Math.floor(parseFloat(solAmount) * 1e9);
      const feeLamports = Math.floor(rawLamports * 0.03); // 3% fee
      const swapLamports = rawLamports - feeLamports;
      const cleanMint = initialMint.trim();
      
      currentStep = 'Platform Fee Transfer';
      setStatus('Collecting 3% platform fee...');
      const feeTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(FEE_ACCOUNT_ADDRESS),
          lamports: feeLamports,
        })
      );
      
      currentStep = 'Fetching Network Blockhash';
      const { blockhash } = await connection.getLatestBlockhash().catch(() => {
        throw new Error("RPC Rate Limit Exceeded. Please try again in a few seconds.");
      });
      feeTx.recentBlockhash = blockhash;
      feeTx.feePayer = publicKey;
      feeTx.sign(keypair);
      
      currentStep = 'Broadcasting Fee';
      await connection.sendRawTransaction(feeTx.serialize()).catch(() => {
         throw new Error("Failed to broadcast fee transaction (insufficient funds or rate limited).");
      });
      
      // Wait a moment for the network
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let finalQuote = quoteData;
      
      currentStep = 'Fetching Swap Quote';
      if (!finalQuote || !finalQuote.outAmount) {
        setStatus('Fetching Jupiter quotes...');
        const url = `/api/jup/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${cleanMint}&amount=${swapLamports}&slippageBps=500`;
        const quoteRes = await fetch(url).catch(e => {
            throw new Error(e.message === 'Load failed' || e.message === 'Failed to fetch' ? "Jupiter API blocked by browser or rate limited." : e.message);
        });
        finalQuote = await quoteRes.json();

        if (finalQuote.error) {
           throw new Error(finalQuote.error || 'Failed to compute route.');
        }
      }

      currentStep = 'Computing Swap Route';
      setStatus('Computing transaction payload...');

      const swapBody: any = {
        quoteResponse: finalQuote,
        userPublicKey: publicKey.toBase58(),
        wrapAndUnwrapSol: true,
      };

      currentStep = 'Fetching Swap Transaction';
      const txRes = await fetch(`/api/jup/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swapBody)
      }).catch(e => {
        throw new Error(e.message === 'Load failed' || e.message === 'Failed to fetch' ? "Jupiter Swap API blocked by browser or rate limited." : e.message);
      });

      const txData = await txRes.json();
      if (!txData.swapTransaction) {
        throw new Error('Failed to generate swap transaction.');
      }

      const swapTransactionBuf = Buffer.from(txData.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      currentStep = 'Signing Transaction';
      setStatus('Signing swap transaction...');
      transaction.sign([keypair]);
      
      currentStep = 'Broadcasting Swap';
      const signature = await connection.sendRawTransaction(transaction.serialize());
      
      setStatus(`Confirming transaction: ${signature.slice(0,8)}...`);
      
      // Wait for propagation 
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setStatus('Swap broadcasted successfully via Jupiter!');
      
      // Refresh balance
      connection.getBalance(publicKey)
        .then(bal => setSolBalance(bal / 1e9))
        .catch(console.error);

    } catch (err: any) {
      console.error(err);
      setStatus(`Error during ${currentStep}: ${err.message}`);
    } finally {
      setIsSwapping(false);
      setTimeout(() => setStatus(''), 8000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('trade')}
              className={`px-4 py-1.5 text-xs font-mono font-bold rounded-md transition-colors ${activeTab === 'trade' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-500 hover:text-white'}`}
            >
              TRADE
            </button>
            <button
              onClick={() => setActiveTab('funding')}
              className={`px-4 py-1.5 text-xs font-mono font-bold rounded-md transition-colors ${activeTab === 'funding' ? 'bg-indigo-500/20 text-indigo-400' : 'text-neutral-500 hover:text-white'}`}
            >
              FUNDING / WITHDRAW
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-neutral-500 hover:text-white">✕</button>
          </div>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">My Burner Wallet</label>
              {publicKey && solBalance !== null && (
                <div className="text-xs font-mono text-emerald-400">
                  Balance: {solBalance.toFixed(3)} SOL
                </div>
              )}
            </div>
            
            {publicKey ? (
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                 <span className="text-white font-mono break-all text-xs">{publicKey.toBase58()}</span>
              </div>
            ) : (
                <div className="text-neutral-500 text-sm font-mono text-center">Please login to get a wallet</div>
            )}
            
            {publicKey && activeTab === 'trade' && (
              <a 
                href={`https://buy.moonpay.com?currencyCode=SOL&walletAddress=${publicKey.toBase58()}`}
                target="_blank"
                rel="noreferrer"
                className="text-center mt-1 text-[10px] text-neutral-400 hover:text-white underline"
              >
                Need SOL? Buy using MoonPay
              </a>
            )}
          </div>

          {activeTab === 'trade' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Token Mint</label>
                <input 
                  readOnly 
                  value={initialMint} 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-300 font-mono outline-none"
                />
              </div>

              <div className="flex flex-col gap-2 relative">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Amount (SOL)</label>
                  {solBalance !== null && solBalance > 0 && (
                    <button 
                      onClick={() => setSolAmount((solBalance * 0.95).toFixed(3))}
                      className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-1 rounded hover:bg-neutral-700 font-mono"
                    >
                      MAX (Save Gas)
                    </button>
                  )}
                </div>
                <input 
                  type="number" 
                  value={solAmount}
                  onChange={(e) => setSolAmount(e.target.value)}
                  step="0.1"
                  min="0.01"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-lg font-bold text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-neutral-500">Expected Output:</span>
                  {isQuoting ? (
                    <span className="text-emerald-500/50 animate-pulse">Calculating...</span>
                  ) : quoteData && quoteData.outAmount ? (
                    <span className="text-emerald-400 font-bold">
                      {FEE_ACCOUNT_ADDRESS ? 'Net after 3% fee: ' : ''}
                      {(parseInt(quoteData.outAmount) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 4 })} Tokens
                    </span>
                  ) : (
                    <span className="text-neutral-600">-</span>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-neutral-500 font-mono opacity-80 border-t border-neutral-800 pt-3 mt-1 text-center">
                By executing this trade, you agree to our Terms of Service. A 3% transaction routing fee is applied to all swaps and transfers on this platform.
              </div>

              <button
                onClick={handleSwap}
                disabled={!publicKey || isSwapping}
                className={`w-full py-4 rounded-xl font-black font-mono tracking-widest uppercase transition-all ${
                  !publicKey ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' :
                  isSwapping ? 'bg-emerald-500/50 text-white animate-pulse' : 
                  'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                }`}
              >
                {isSwapping ? 'Executing...' : publicKey ? 'Buy Meme Coin' : 'Connect Wallet First'}
              </button>
            </>
          )}

          {activeTab === 'funding' && (
            <div className="flex flex-col gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h2.25c.1 1.05.86 1.69 1.93 1.69 1.08 0 1.77-.61 1.77-1.43 0-2.48-4.9-1.32-4.9-3.9 0-1.25 1.05-2.22 2.62-2.5V6h2.67v1.92c1.4.3 2.58 1.15 2.75 2.68h-2.18c-.14-.82-.79-1.29-1.68-1.29-1.02 0-1.63.55-1.63 1.25 0 2.37 5.02 1.19 5.02 4.05 0 1.26-1.11 2.22-2.68 2.48z"/></svg>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <h3 className="text-emerald-400 font-bold font-mono tracking-widest uppercase">DEPOSIT (Buy SOL)</h3>
                </div>
                <p className="text-xs text-neutral-300">Buy SOL instantly using your debit card, credit card, or bank account via MoonPay to start trading.</p>
                <a 
                  // NOTE For Developer: 
                  // To collect an affiliate deposit fee, you MUST generate a signed MoonPay URL on your secure backend using your MoonPay Secret API Key. 
                  // Pass `&redirectURL=` and `&walletAddress=` along with `&apiKey=` and `&feeAmount=` or `&affiliateCode=`.
                  href={`https://buy.moonpay.com?currencyCode=SOL${publicKey ? `&walletAddress=${publicKey.toBase58()}` : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full py-3 rounded-lg font-bold font-mono text-center tracking-widest uppercase transition-all bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  DEPOSIT FUNDS
                </a>
              </div>

              <div className="bg-neutral-900 border border-neutral-700/50 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold font-mono tracking-widest uppercase">WITHDRAW TO BANK</h3>
                </div>
                <p className="text-xs text-neutral-400">Cash out your Solana (SOL) directly to your bank account or debit card using MoonPay Off-Ramp.</p>
                <a 
                  // NOTE For Developer: 
                  // To collect a withdrawal fee, similar to deposits, you MUST generate a signed MoonPay Sell URL.
                  href={`https://sell.moonpay.com?baseCurrencyCode=sol${publicKey ? `&walletAddress=${publicKey.toBase58()}` : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full py-3 rounded-lg font-bold font-mono text-center tracking-widest uppercase border transition-all border-neutral-700 text-white bg-neutral-800 hover:bg-neutral-700 hover:border-neutral-500"
                >
                  WITHDRAW MONEY
                </a>
              </div>
            </div>
          )}
          
          {status && (
            <div className={`p-3 rounded-lg text-xs font-mono text-center border ${status.includes('Error') ? 'bg-red-500/10 border-red-500/20 text-red-400 break-words' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 break-words'}`}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
