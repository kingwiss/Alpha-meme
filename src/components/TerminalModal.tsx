import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair, VersionedTransaction, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useAuth } from '../contexts/AuthContext';
import bs58 from 'bs58';
import { saveCoin } from '../lib/coinActions';
import { MemeCoin } from '../types';


export const TerminalModal = ({ onClose, initialMint }: { onClose: () => void, initialMint: string }) => {
  const { connection } = useConnection();
  const { user, profile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'trade' | 'funding'>('trade');
  const [solBalance, setSolBalance] = useState<number | null>(() => {
    const saved = localStorage.getItem(`solBalance_${profile?.walletPublicKey}`);
    return saved ? parseFloat(saved) : null;
  });
  const [tokenBalances, setTokenBalances] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Safely check for mobile viewport on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }
  }, []);

  const publicKey = useMemo(() => {
    const pubKeyString = profile?.walletPublicKey;
    if (!pubKeyString) return null;
    try {
      return new PublicKey(pubKeyString);
    } catch (e) {
      return null;
    }
  }, [profile]);

  useEffect(() => {
    let active = true;
    if (publicKey && connection) {
      connection.getBalance(publicKey)
        .then(bal => { 
          if (active) {
            const newBal = bal / 1e9;
            setSolBalance(newBal); 
            localStorage.setItem(`solBalance_${publicKey.toBase58()}`, newBal.toString());
          }
        })
        .catch(console.error);

      connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID })
        .then(res => {
          if (active) {
            const tokens = res.value.map(acc => {
              const parsedInfo = acc.account.data.parsed.info;
              return {
                mint: parsedInfo.mint,
                amount: parsedInfo.tokenAmount.uiAmount,
                decimals: parsedInfo.tokenAmount.decimals
              };
            }).filter(t => t.amount > 0);
            setTokenBalances(tokens);
          }
        })
        .catch(console.error);
    }
    return () => { active = false; };
  }, [publicKey, connection]);

  const [swapAmount, setSwapAmount] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStatus, setSwapStatus] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

  const handleSwap = async () => {
    if (!profile?.walletSecretKey || !publicKey) {
      setSwapError("Burner wallet not found. Please log in.");
      return;
    }
    
    const amountNum = parseFloat(swapAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setSwapError("Please enter a valid amount.");
      return;
    }

    const networkFee = 0.001; // Approximate dynamic priority fee
    const ataRent = 0.00204;
    const feePercent = 0.045;
    const totalRequired = amountNum + (amountNum * feePercent) + networkFee + ataRent;

    if (solBalance === null || totalRequired > solBalance) {
      setSwapError(`Insufficient SOL balance to cover trade + fees. You need at least ${totalRequired.toFixed(5)} SOL. Please lower your input amount.`);
      return;
    }
    
    if (!initialMint) {
      setSwapError("Invalid token mint.");
      return;
    }

    setIsSwapping(true);
    setSwapError(null);
    setSwapStatus("Executing swap...");

    try {
      // Execute the swap completely via the secure backend pipeline
      const apiUrl = `/api/execute-swap`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-pubkey': publicKey.toBase58()
        },
        body: JSON.stringify({
          walletSecretKey: profile.walletSecretKey,
          amount: amountNum,
          outputMint: initialMint
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Execution pipeline failed.");
      }

      setSwapStatus("Updating dashboard...");

      // Automatically fetch token meta and save to user's savedCoins database
      try {
        const tokenRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${initialMint}`);
        const tokenData = await tokenRes.json();
        const pair = tokenData?.pairs?.[0];
        const name = pair?.baseToken?.name || initialMint.substring(0, 6);
        const symbol = pair?.baseToken?.symbol || 'UNKNOWN';
        const priceUsd = parseFloat(pair?.priceUsd) || 0;
        const fdv = pair?.fdv || 0;

        const purchasedCoin: MemeCoin = {
          id: initialMint,
          name: name,
          symbol: symbol,
          address: initialMint,
          platform: 'raydium',
          priceUsd: priceUsd,
          marketCapUsd: fdv,
          priceChange1h: 0,
          priceChange24h: 0,
          volume1h: 0,
          volume5m: 0,
          liquidityUsd: 0,
          isBondingCurve: false,
          bondingCurveProgress: 0,
          isKingOfTheHill: false,
          mintRenounced: true,
          freezeAuthorityRenounced: true,
          liquidityLockedOrBurnt: true,
          liquidityLockPercent: 100,
          creatorWalletBehavior: 'neutral',
          holderDistribution: { top10HoldersPercent: 0, creatorHoldingPercent: 0 },
          uniqueBuyers3m: 0,
          creatorDeployedRugCount: 0,
          socials: { twitterFollowers: 0, twitterEngagementRate: 0, influencerMentionsCount: 0, sentimentScore: 50, tweetVolume24h: 0 },
          velocityScore: 50,
          securityScore: 50,
          socialScore: 50,
          combinedScore: 50,
          breakoutProbability: 0,
          priceHistory5m: [priceUsd],
          createdTimeAgo: 'Just now',
          ageInMinutes: 0
        };

        if (user?.uid) {
          await saveCoin(user.uid, purchasedCoin);
          console.log("Successfully saved coin to dashboard database:", initialMint);
        }
      } catch (dbErr) {
        console.error("Failed to save purchased coin to dashboard database:", dbErr);
      }

      setSwapStatus(null);
      setSwapAmount('');
      
      // Force refresh balances
      const updatedBalance = solBalance !== null ? solBalance - totalRequired : null;
      setSolBalance(updatedBalance); // Optimistic
      if (updatedBalance !== null && publicKey) {
         localStorage.setItem(`solBalance_${publicKey.toBase58()}`, updatedBalance.toString());
      }

    } catch (e: any) {
      console.error("Client swap failed:", e);
      let errMsg = e.message || "An error occurred during trade execution.";
      
      if (errMsg.includes("custom program error: 0x177e") || errMsg.includes("6014") || errMsg.includes("SlippageToleranceExceeded")) {
        errMsg = "Trade failed due to low liquidity or high price impact. Please try a smaller amount or a different token.";
      } else if (errMsg.includes("custom program error: 0x1") && errMsg.includes("Instruction")) {
        errMsg = "Insufficient SOL for network fees and rent. Please leave at least 0.006 SOL in your wallet and try a smaller amount.";
      } else if (errMsg.includes("bonding_curve_complete")) {
        errMsg = "This token's bonding curve is complete and liquidity is migrating. Please try again later.";
      } else if (errMsg.includes("NO_ROUTES_FOUND")) {
        errMsg = "No liquidity routes available for this token. It may be too new or lack a liquidity pool.";
      } else if (errMsg.includes("TOKEN_NOT_TRADABLE")) {
        errMsg = "This token cannot be traded currently via routing protocols.";
      }
      
      setSwapError(errMsg);
      setSwapStatus(null);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="w-full max-w-[100vw] sm:max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] box-border">
          
          {/* Header */}
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
                FUNDING
              </button>
            </div>
            <button onClick={onClose} className="text-neutral-500 hover:text-white p-1">✕</button>
          </div>
          
          <div className="p-4 flex flex-col gap-4 overflow-y-auto overflow-x-hidden flex-1">
            {/* Common Wallet Display */}
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl flex flex-col gap-1 shrink-0">
               <div className="flex justify-between text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                  <span>Active Burner Wallet</span>
                  {solBalance !== null && <span className="text-emerald-400">Bal: {solBalance.toFixed(3)} SOL</span>}
               </div>
               <div className="text-[11px] font-mono text-white truncate break-all opacity-80">
                  {publicKey?.toBase58() || 'UNAUTHORIZED'}
               </div>
            </div>

            {/* Trading Tab */}
            {activeTab === 'trade' && (
              <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
                <div className="w-full max-w-full box-border bg-neutral-950 border border-neutral-800 rounded-xl relative flex-1 flex flex-col p-4 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Amount (SOL)</label>
                    <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={swapAmount}
                        onChange={e => setSwapAmount(e.target.value)}
                        className="w-full bg-transparent text-white font-mono p-3 outline-none"
                      />
                      <button 
                        onClick={() => {
                          if (solBalance && solBalance > 0.0035) {
                             const maxSwap = (solBalance - 0.0035) / 1.045;
                             setSwapAmount(maxSwap.toFixed(4));
                          } else {
                             setSwapAmount('0');
                          }
                        }}
                        className="px-4 text-xs font-bold text-emerald-500 hover:text-emerald-400 font-mono transition-colors border-l border-neutral-800 h-full py-3"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Target Token</label>
                    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-neutral-500 font-mono text-sm truncate opacity-80 cursor-not-allowed">
                      {initialMint || 'Select a token from Screener'}
                    </div>
                  </div>

                  {swapError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
                      {swapError}
                    </div>
                  )}

                  {swapStatus && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono animate-pulse">
                      {swapStatus}
                    </div>
                  )}

                  <button
                    onClick={handleSwap}
                    disabled={isSwapping || !initialMint}
                    className="mt-2 w-full py-3.5 rounded-lg font-bold font-mono text-center tracking-widest uppercase transition-all bg-emerald-500 hover:bg-emerald-400 text-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSwapping ? 'PROCESSING...' : 'BUY TOKEN'}
                  </button>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 shrink-0">
                  <h3 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-2">Portfolio Holdings</h3>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
                    {tokenBalances.length === 0 ? (
                      <div className="text-xs font-mono text-neutral-600 py-2 text-center">No tokens found</div>
                    ) : (
                      tokenBalances.map((token, i) => (
                        <div key={i} className="flex justify-between items-center bg-neutral-900 border border-neutral-800 rounded p-2">
                           <span className="text-[10px] font-mono text-neutral-400 truncate w-32" title={token.mint}>{token.mint.slice(0, 8)}...</span>
                           <span className="text-xs font-mono font-bold text-white">{token.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Funding Tab */}
            {activeTab === 'funding' && (
              <div className="flex flex-col gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col gap-3">
                  <h3 className="text-emerald-400 font-bold font-mono text-sm uppercase">Quick Buy SOL</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-mono">
                    Buy SOL instantly via MoonPay. Funds arrive directly in your Alpha Pump burner wallet.
                  </p>
                  <a 
                    href={`https://buy.moonpay.com?currencyCode=SOL${publicKey ? `&walletAddress=${publicKey.toBase58()}` : ''}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="block w-full py-3 rounded-lg font-bold font-mono text-center tracking-widest uppercase transition-all bg-emerald-500 hover:bg-emerald-400 text-neutral-950"
                  >
                    DEPOSIT FUNDS
                  </a>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex flex-col gap-3">
                   <h3 className="text-white font-bold font-mono text-sm uppercase">Withdraw</h3>
                   <p className="text-xs text-neutral-500 leading-relaxed font-mono">
                     Send SOL back to your main wallet or cash out to bank.
                   </p>
                   <a 
                    href={`https://sell.moonpay.com?baseCurrencyCode=sol${publicKey ? `&walletAddress=${publicKey.toBase58()}` : ''}`}
                    target="_blank" 
                    rel="noreferrer" 
                    className="block w-full py-3 rounded-lg font-bold font-mono text-center tracking-widest uppercase border border-neutral-800 text-white hover:bg-neutral-800 transition-all"
                  >
                    WITHDRAW SOL
                  </a>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};


