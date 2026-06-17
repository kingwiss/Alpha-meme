import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, ShieldAlert, Award, ArrowUpRight, Zap, Flame, ExternalLink, Bookmark } from 'lucide-react';
import { MemeCoin } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { saveCoin, unsaveCoin } from '../lib/coinActions';

interface ScreenerTableProps {
  coins: MemeCoin[];
  onSelectCoin: (coin: MemeCoin) => void;
  onPremiumBlocked?: () => void;
  selectedCoinId?: string;
}

export const ScreenerTable: React.FC<ScreenerTableProps> = ({
  coins,
  onSelectCoin,
  onPremiumBlocked,
  selectedCoinId,
}) => {
  const { user, profile, savedCoinIds } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [copiedPhantomId, setCopiedPhantomId] = useState<string | null>(null);

  const blurredIds = React.useMemo(() => {
    const sortedByBest = [...coins].sort((a, b) => b.breakoutProbability - a.breakoutProbability);
    const numToBlur = Math.ceil(coins.length * 0.25);
    return new Set(sortedByBest.slice(0, numToBlur).map(c => c.id));
  }, [coins]);

  const displayCoins = React.useMemo(() => {
    // Pseudo-random but stable sort to mix premium and non-premium scattered
    return [...coins].sort((a, b) => {
      const aVal = (a.address.charCodeAt(a.address.length - 1) || 0) + a.name.charCodeAt(0);
      const bVal = (b.address.charCodeAt(b.address.length - 1) || 0) + b.name.charCodeAt(0);
      if (aVal !== bVal) return bVal - aVal;
      return a.id.localeCompare(b.id);
    });
  }, [coins]);

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    if (addr.length <= 12) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}`;
  };

  const copyAddress = (e: React.MouseEvent, id: string, address: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyLink = (e: React.MouseEvent, id: string, address: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  // Helper to render simple, pixel-perfect price sparklines as an SVG line path
  const renderSparkline = (prices: number[]) => {
    if (!prices || prices.length < 2) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    
    // Width and height of sparkline
    const width = 80;
    const height = 24;
    const padding = 2;
    
    // Calculate SVG coordinate points
    const points = prices.map((price, i) => {
      const x = (i / (prices.length - 1)) * (width - 2 * padding) + padding;
      const y = height - ((price - min) / range) * (height - 2 * padding) - padding;
      return `${x},${y}`;
    }).join(' ');

    const isUp = prices[prices.length - 1] >= prices[0];
    const strokeColor = isUp ? '#34d399' : '#f87171'; // emerald-400 vs rose-400

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          points={points}
        />
        {/* Glow point on the last price point */}
        {prices.length > 0 && (
          <circle
            cx={(prices.length - 1) / (prices.length - 1) * (width - 2 * padding) + padding}
            cy={height - ((prices[prices.length - 1] - min) / range) * (height - 2 * padding) - padding}
            r="2"
            fill={strokeColor}
            className="animate-pulse"
          />
        )}
      </svg>
    );
  };

  return (
    <div id="screener-table-wrapper" className="glass-panel rounded-xl overflow-hidden w-full">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/60">
        <div>
          <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-emerald-400 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Active Alpha Streams
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time multi-source heuristics evaluation. Click coin to inspect raw API metadata.
          </p>
        </div>
        <div className="text-[10px] text-neutral-500 font-mono">
          Showing {coins.length} tokens
        </div>
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table id="alpha-screener-table" className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-neutral-800/80 text-[11px] font-mono uppercase tracking-wider text-neutral-400 bg-neutral-950/40">
              <th className="py-3 px-4">Token & Platform</th>
              <th className="py-3 px-4 text-right">Price (USD)</th>
              <th className="py-3 px-4 text-right">1H Change</th>
              <th className="py-3 px-4 text-center">Breakout Probability</th>
              <th className="py-3 px-4 text-center">Age</th>
              <th className="py-3 px-4 text-center">Trend (30m)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {coins.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs font-mono text-neutral-500 bg-neutral-950/20">
                  ⚠️ No micro-assets pass the configured security threshold or search filters.
                  <br />
                  <span className="text-[10px] text-neutral-600 mt-1 block">Try lowering the Minimum Security Score slider or choosing AGGRESSIVE/DEGEN.</span>
                </td>
              </tr>
            ) : (
              displayCoins.map((coin) => {
                const isSelected = selectedCoinId === coin.id;
                const isPositive = coin.priceChange1h >= 0;
                
                // Security status configuration
                const isSecure = coin.securityScore >= 75;
                const isHighlyCompromised = coin.securityScore < 30;
                
                // Expert Consensus Golden Target criteria
                const isGoldenTarget = coin.securityScore >= 85 && coin.combinedScore >= 80 && coin.breakoutProbability >= 85;
                
                // Blur the top ~25% of coins for premium
                const isPremiumHidden = profile?.isPremium !== true && blurredIds.has(coin.id);

                return (
                  <React.Fragment key={coin.id}>
                    <tr
                      id={`token-row-${coin.symbol}`}
                      onClick={() => {
                        if (isPremiumHidden) {
                          if (onPremiumBlocked) onPremiumBlocked();
                        } else {
                          onSelectCoin(coin);
                        }
                      }}
                      className={`hover:bg-neutral-800/40 transition-colors cursor-pointer text-xs relative ${
                        isSelected ? 'bg-emerald-500/5 border-l-4 border-l-emerald-500' : ''
                      }`}
                      style={{ filter: isPremiumHidden ? 'blur(6px)' : 'none', opacity: isPremiumHidden ? 0.3 : 1, userSelect: isPremiumHidden ? 'none' : 'auto' }}
                    >
                    {/* Token details and copy address */}
                    <td className="py-3.5 px-4 relative">
                      {isPremiumHidden && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none whitespace-nowrap">
                          <span className="bg-emerald-500 text-neutral-950 px-4 py-1.5 rounded text-xs font-bold font-mono tracking-wider shadow-xl border border-emerald-400">
                             ⭐ PREMIUM COIN
                          </span>
                        </div>
                      )}
                      <div className={`flex items-center gap-2 ${isPremiumHidden ? 'blur-lg opacity-30 select-none pointer-events-none' : ''}`}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-neutral-100 font-sans">{coin.name}</span>
                            <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-1 py-0.2 rounded font-semibold">
                              ${coin.symbol}
                            </span>
                            {coin.isKingOfTheHill && (
                              <span className="text-[9px] bg-amber-500/15 border border-amber-500/30 text-amber-400 px-1 py-0.2 rounded flex items-center gap-0.5" title="King of the Hill">
                                <Flame size={10} /> KOTH
                              </span>
                            )}
                            {isGoldenTarget && (
                              <span className="text-[9px] bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono font-bold px-1 py-0.2 rounded flex items-center gap-0.5" title="Expert Golden Ticket Target: Low rug risk & extreme volume velocity!">
                                🏆 GOLDEN TARGET
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              coin.platform === 'pump.fun' 
                                ? 'bg-purple-950/40 text-purple-300 border border-purple-800/30' 
                                : 'bg-blue-950/40 text-blue-300 border border-blue-800/30'
                            }`}>
                              {coin.platform}
                            </span>
                            <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-900 transition-colors max-w-[120px] md:max-w-[180px] xl:max-w-[250px] overflow-hidden" onClick={(e) => { if (!isPremiumHidden) copyAddress(e, coin.id, coin.address); }} title="Click to copy full contract address">
                              <span className="text-[10px] text-neutral-400 font-mono tracking-tight truncate shrink">
                                {isPremiumHidden ? 'XXXXXXXXXXXXXXXXXXXXXXXXX' : coin.address}
                              </span>
                              <div className="text-neutral-500 p-0.5 shrink-0">
                                {copiedId === coin.id ? (
                                  <Check size={10} className="text-emerald-400" />
                                ) : (
                                  <Copy size={10} />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-center p-1 bg-neutral-950 rounded border border-neutral-800 hover:border-sky-500/50 hover:bg-neutral-900 transition-colors" onClick={(e) => { if (!isPremiumHidden) copyLink(e, coin.id, coin.address); }} title="Click to copy Address for Phantom">
                              {copiedLinkId === coin.id ? (
                                <Check size={12} className="text-sky-400" />
                              ) : (
                                <ExternalLink size={12} className="text-sky-500" />
                              )}
                            </div>
                            {user && !isPremiumHidden && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (savedCoinIds.has(coin.id)) {
                                    unsaveCoin(user.uid, coin.id).catch(console.error);
                                  } else {
                                    saveCoin(user.uid, coin).catch(console.error);
                                  }
                                }}
                                className="flex items-center justify-center gap-1 px-2 py-1 bg-neutral-950 rounded border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-900 transition-colors text-[10px] text-emerald-400 font-mono font-bold" 
                                title={savedCoinIds.has(coin.id) ? "Remove from Dashboard" : "Save to Dashboard"}
                              >
                                <Bookmark size={12} fill={savedCoinIds.has(coin.id) ? "currentColor" : "none"} /> {savedCoinIds.has(coin.id) ? 'SAVED' : 'SAVE'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isPremiumHidden && (
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/20 backdrop-blur-sm z-10">
                           <button className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 px-3 py-1.5 rounded text-xs font-bold font-mono tracking-wider shadow">
                             VIEW
                           </button>
                        </div>
                      )}
                    </td>

                    {/* Price USD */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-neutral-200 relative">
                      <span className={isPremiumHidden ? 'blur-lg opacity-30 select-none pointer-events-none' : ''}>
                        ${isPremiumHidden ? '0.0000' : coin.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}
                      </span>
                    </td>

                    {/* Price Change 1H */}
                    <td className="py-3.5 px-4 text-right font-mono relative">
                      <div className={`flex flex-col items-end ${isPremiumHidden ? 'blur-lg opacity-30 select-none pointer-events-none' : ''}`}>
                        <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}{isPremiumHidden ? '0' : coin.priceChange1h.toFixed(1)}%
                        </span>
                        <span className="text-[8px] text-neutral-500 tracking-wider font-sans uppercase mt-0.5">
                          PAST HOUR
                        </span>
                      </div>
                    </td>

                    {/* Calculated Probabilities */}
                    <td className="py-3.5 px-4 text-center relative">
                      <div className={`flex flex-col items-center justify-center gap-1 ${isPremiumHidden ? 'blur-lg opacity-30 select-none pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-mono font-bold ${
                            coin.breakoutProbability >= 85 
                              ? 'text-emerald-400' 
                              : coin.breakoutProbability >= 50
                                ? 'text-amber-400'
                                : 'text-neutral-400'
                          }`}>
                            {isPremiumHidden ? '99' : coin.breakoutProbability}%
                          </span>
                          {coin.breakoutProbability >= 85 && (
                            <Zap size={10} className="text-emerald-400 fill-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <div className="w-20 bg-neutral-950 border border-neutral-800 rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              coin.breakoutProbability >= 85
                                ? 'bg-emerald-500'
                                : coin.breakoutProbability >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-neutral-600'
                            }`}
                            style={{ width: `${isPremiumHidden ? 99 : coin.breakoutProbability}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Age */}
                    <td className="py-3.5 px-4 text-center text-neutral-400 font-mono text-xs relative">
                       <span className={isPremiumHidden ? 'blur-lg opacity-30 select-none pointer-events-none' : ''}>
                         {coin.createdTimeAgo}
                       </span>
                    </td>

                    {/* Price History Sparklines */}
                    <td className="py-3.5 px-4 text-center relative">
                      <div className={`flex items-center justify-center ${isPremiumHidden ? 'blur-lg opacity-30 pointer-events-none' : ''}`}>
                        {renderSparkline(coin.priceHistory5m)}
                      </div>
                    </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="flex flex-col gap-3 p-3 lg:hidden">
        {coins.length === 0 ? (
          <div className="py-10 text-center text-xs font-mono text-neutral-500 bg-neutral-950/20 rounded-lg">
            ⚠️ No micro-assets pass the configured security threshold or search filters.
          </div>
        ) : (
          displayCoins.map((coin) => {
            const isSelected = selectedCoinId === coin.id;
            const isPositive = coin.priceChange1h >= 0;
            const isSecure = coin.securityScore >= 75;
            const isHighlyCompromised = coin.securityScore < 30;
            const isGoldenTarget = coin.securityScore >= 85 && coin.combinedScore >= 80 && coin.breakoutProbability >= 85;
            
            // Blur the top ~25% of coins for premium
            const isPremiumHidden = profile?.isPremium !== true && blurredIds.has(coin.id);

            return (
              <div key={coin.id} className={`flex flex-col relative`}>
                <div 
                  onClick={() => {
                    if (isPremiumHidden) {
                      if (onPremiumBlocked) onPremiumBlocked();
                    } else {
                      onSelectCoin(coin);
                    }
                  }}
                  className={`flex flex-col gap-3 p-4 glass-panel rounded-xl overflow-hidden cursor-pointer transition-colors ${
                    isSelected ? 'border-emerald-500 bg-emerald-500/5' : 'border-neutral-800 hover:bg-neutral-800/50'
                  }`}
                >
                  {isPremiumHidden && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/20 backdrop-blur-md z-10 rounded-xl">
                       <button className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 px-4 py-2 rounded text-sm font-bold font-mono tracking-wider shadow">
                         VIEW PREMIUM COIN
                       </button>
                    </div>
                  )}
                  <div className={`flex justify-between items-start gap-2 ${isPremiumHidden ? 'select-none pointer-events-none' : ''}`} style={{ filter: isPremiumHidden ? 'blur(6px)' : 'none', opacity: isPremiumHidden ? 0.3 : 1 }}>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-neutral-100 font-sans text-sm">{coin.name}</span>
                        <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-1 py-0.2 rounded font-semibold truncate">
                          ${coin.symbol}
                        </span>
                        {isGoldenTarget && (
                          <span className="text-[9px] bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono font-bold px-1 py-0.2 rounded flex items-center gap-0.5 flex-shrink-0">
                            🏆 GOLDEN
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono flex-shrink-0 ${
                          coin.platform === 'pump.fun' 
                            ? 'bg-purple-950/40 text-purple-300 border border-purple-800/30' 
                            : 'bg-blue-950/40 text-blue-300 border border-blue-800/30'
                        }`}>
                          {coin.platform}
                        </span>
                        <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800 transition-colors cursor-pointer min-w-0 max-w-[110px] sm:max-w-[200px] overflow-hidden" onClick={(e) => copyAddress(e, coin.id, coin.address)} title="Click to copy full contract address">
                          <span className="text-[10px] font-mono text-neutral-400 truncate shrink">
                             {coin.address}
                          </span>
                          <div className="text-neutral-500 shrink-0">
                             {copiedId === coin.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                          </div>
                        </div>
                        <div className="flex items-center justify-center p-1 bg-neutral-900 rounded border border-neutral-800 hover:border-sky-500/50 hover:bg-neutral-800 transition-colors cursor-pointer" onClick={(e) => copyLink(e, coin.id, coin.address)} title="Click to copy Address for Phantom">
                          {copiedLinkId === coin.id ? (
                            <Check size={12} className="text-sky-400" />
                          ) : (
                            <ExternalLink size={12} className="text-sky-500" />
                          )}
                        </div>
                        {user && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (savedCoinIds.has(coin.id)) {
                                unsaveCoin(user.uid, coin.id).catch(console.error);
                              } else {
                                saveCoin(user.uid, coin).catch(console.error);
                              }
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-1 bg-neutral-900 rounded border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800 transition-colors cursor-pointer text-[10px] text-emerald-400 font-mono font-bold" 
                            title={savedCoinIds.has(coin.id) ? "Remove from Dashboard" : "Save to Dashboard"}
                          >
                            <Bookmark size={12} fill={savedCoinIds.has(coin.id) ? "currentColor" : "none"} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="font-mono text-sm font-semibold text-neutral-200">
                        ${coin.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}
                      </span>
                      <div className="flex flex-col items-end mt-0.5">
                        <span className={`text-xs font-mono font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}{coin.priceChange1h.toFixed(1)}%
                        </span>
                        <span className="text-[8px] text-neutral-500 font-mono tracking-wider font-normal uppercase">PAST HOUR</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className={`flex items-center flex-wrap gap-2 ${isPremiumHidden ? 'select-none pointer-events-none' : ''}`} style={{ filter: isPremiumHidden ? 'blur(6px)' : 'none', opacity: isPremiumHidden ? 0.3 : 1 }}>
                     <span className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        coin.velocityScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        coin.velocityScore >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                     }`}>
                       {coin.velocityScore}⚡ Vel
                     </span>
                     
                     {isHighlyCompromised ? (
                        <div className="flex items-center gap-1 max-w-fit text-rose-400 font-mono text-[10px] bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                          <ShieldAlert size={10} /> Risk {coin.securityScore}
                        </div>
                      ) : isSecure ? (
                        <div className="flex items-center gap-1 max-w-fit text-emerald-400 font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          <ShieldCheck size={10} /> Safe {coin.securityScore}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 max-w-fit text-amber-400 font-mono text-[10px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                          <ShieldAlert size={10} /> Warn {coin.securityScore}
                        </div>
                      )}

                      <div className="flex items-center gap-1 max-w-fit text-indigo-400 font-mono text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                         <Award size={10} /> {coin.breakoutProbability}% Breakout
                      </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-4 mt-2 p-3 bg-neutral-950/50 rounded-lg border border-neutral-800/60 ${isPremiumHidden ? 'select-none pointer-events-none' : ''}`} style={{ filter: isPremiumHidden ? 'blur(6px)' : 'none', opacity: isPremiumHidden ? 0.3 : 1 }}>
                    <div className="flex flex-col gap-2">
                       <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Liquidity & MC</span>
                       <div className="flex flex-col gap-0.5 font-mono text-[11px] font-semibold">
                         <span className="text-neutral-300">Liq: ${coin.liquidityUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                         <span className="text-neutral-400">MCap: ${coin.marketCapUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                       </div>
                    </div>
                    <div className="flex flex-col gap-2">
                       {coin.isBondingCurve ? (
                        <div className="flex flex-col justify-center gap-1 w-full">
                          <div className="flex justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                            <span>Curve</span>
                            <span className="text-purple-400 font-bold">{coin.bondingCurveProgress}%</span>
                          </div>
                          <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                              style={{ width: `${coin.bondingCurveProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                         <div className="flex flex-col gap-1">
                           <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Status</span>
                           <span className="text-[10px] font-mono text-blue-400 uppercase font-semibold">
                             Migrated to DEX
                           </span>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/40 text-[10px] font-mono text-neutral-500 flex justify-between items-center">
        <span>* Breakout probability calculates real-time bonding velocity + contract security ratios.</span>
        <span>UTC Live feed simulated scan interval: 4s</span>
      </div>
    </div>
  );
};
