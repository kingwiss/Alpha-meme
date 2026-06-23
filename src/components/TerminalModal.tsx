import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useAuth } from '../contexts/AuthContext';

export const TerminalModal = ({ onClose, initialMint }: { onClose: () => void, initialMint: string }) => {
  const { connection } = useConnection();
  const { profile } = useAuth();
  
  const walletPubkeyString = profile?.walletPublicKey;
  const publicKey = walletPubkeyString ? new PublicKey(walletPubkeyString) : null;
  
  const [activeTab, setActiveTab] = useState<'trade' | 'funding'>(initialMint === '' ? 'funding' : 'trade');
  const [solBalance, setSolBalance] = useState<number | null>(null);
  
  // Validate the mint address
  let validatedMint = '';
  let isMintValid = false;
  try {
    if (initialMint) {
      const pk = new PublicKey(initialMint.trim());
      validatedMint = pk.toBase58();
      isMintValid = true;
    }
  } catch (e) {
    isMintValid = false;
  }

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
    if (activeTab === 'trade' && isMintValid) {
      const script = document.createElement('script');
      script.src = 'https://terminal.jup.ag/main-v3.js';
      script.onload = () => {
        const jupiter = (window as any).Jupiter;
        if (jupiter) {
          jupiter.init({
            displayMode: 'integrated',
            integratedTargetId: 'integrated-terminal',
            endpoint: 'https://mainnet.helius-rpc.com/?api-key=3d18e988-fdce-4070-86a3-f5c2dd98c15c',
            strictTokenList: false,
            defaultExplorer: 'Solscan',
            formProps: {
              fixedOutputMint: true,
              initialOutputMint: validatedMint,
              initialInputMint: 'So11111111111111111111111111111111111111112',
            },
          });
        }
      };
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        const terminal = document.getElementById('integrated-terminal');
        if (terminal) {
          terminal.innerHTML = '';
        }
      };
    }
  }, [activeTab, validatedMint, isMintValid]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-950 shrink-0">
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
        
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
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
              {!isMintValid ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                  <p className="text-red-400 font-mono text-sm">Invalid Token Mint Address</p>
                  <p className="text-neutral-500 text-xs mt-2 break-all">{initialMint}</p>
                </div>
              ) : (
                <div 
                  id="integrated-terminal" 
                  className="w-full rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center bg-neutral-950 border border-neutral-800"
                >
                  <div className="text-neutral-500 font-mono text-sm animate-pulse">Loading Jupiter Terminal...</div>
                </div>
              )}
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
        </div>
      </div>
    </div>
  );
};
