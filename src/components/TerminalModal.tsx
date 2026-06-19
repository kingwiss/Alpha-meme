import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Buffer } from 'buffer';

export const TerminalModal = ({ onClose, initialMint }: { onClose: () => void, initialMint: string }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  
  const [solAmount, setSolAmount] = useState('0.1');
  const [isSwapping, setIsSwapping] = useState(false);
  const [status, setStatus] = useState('');
  const [solBalance, setSolBalance] = useState<number | null>(null);

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey)
        .then(bal => setSolBalance(bal / 1e9))
        .catch(console.error);
    } else {
      setSolBalance(null);
    }
  }, [publicKey, connection]);

  const handleSwap = async () => {
    if (!publicKey) {
      setStatus('Connect wallet first.');
      return;
    }
    
    try {
      setIsSwapping(true);
      setStatus('Fetching Jupiter quotes...');
      
      const lamports = Math.floor(parseFloat(solAmount) * 1e9);

      // Fetch quote from Jupiter API V6
      const quoteRes = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${initialMint}&amount=${lamports}&slippageBps=50`);
      const quoteData = await quoteRes.json();

      if (quoteData.error) {
         throw new Error(quoteData.error || 'Failed to compute route.');
      }

      setStatus('Computing transaction payload...');

      const txRes = await fetch(`https://quote-api.jup.ag/v6/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quoteData,
          userPublicKey: publicKey.toBase58(),
          wrapAndUnwrapSol: true
        })
      });

      const txData = await txRes.json();
      if (!txData.swapTransaction) {
        throw new Error('Failed to generate swap transaction.');
      }

      setStatus('Please approve transaction in wallet...');

      const swapTransactionBuf = Buffer.from(txData.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      const signature = await sendTransaction(transaction, connection);
      
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
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsSwapping(false);
      setTimeout(() => setStatus(''), 8000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-950">
          <h2 className="text-xl font-bold text-white tracking-widest font-mono">Jupiter Swap</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const url = window.location.href;
                window.open(`https://phantom.app/ul/browse/${encodeURIComponent(url)}`, '_blank');
              }}
              className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono px-2 py-1.5 rounded hover:bg-indigo-500/20 md:hidden flex items-center justify-center shrink-0 tracking-wider"
            >
              OPEN IN PHANTOM APP
            </button>
            <button onClick={onClose} className="text-neutral-500 hover:text-white">✕</button>
          </div>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Wallet Connection</label>
              {publicKey && solBalance !== null && (
                <div className="text-xs font-mono text-emerald-400">
                  Balance: {solBalance.toFixed(3)} SOL
                </div>
              )}
            </div>
            <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-500 !transition-colors !w-full !justify-center !rounded-xl font-mono !h-12" />
            
            {publicKey && (
              <a 
                href={`https://buy.moonpay.com?currencyCode=SOL&walletAddress=${publicKey.toBase58()}`}
                target="_blank"
                rel="noreferrer"
                className="text-center mt-1 text-[10px] text-neutral-400 hover:text-white underline"
              >
                Deposit Fiat / Buy SOL using MoonPay
              </a>
            )}
          </div>

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

          <button
            onClick={handleSwap}
            disabled={!publicKey || isSwapping}
            className={`w-full py-4 rounded-xl font-black font-mono tracking-widest uppercase transition-all ${
              !publicKey ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' :
              isSwapping ? 'bg-emerald-500/50 text-white animate-pulse' : 
              'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isSwapping ? 'Executing Swaps...' : publicKey ? 'Swap Tokens via Jupiter' : 'Connect Wallet to Swap'}
          </button>
          
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
