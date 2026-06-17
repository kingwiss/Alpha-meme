import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, ShieldAlert, Award, FileCode, Users, HelpCircle, Activity, ShoppingCart, BellDot, HeartHandshake, Copy, Check, Link, ExternalLink, LineChart as ChartIcon, Zap } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';
import { MemeCoin } from '../types';

interface InspectorDrawerProps {
  coin: MemeCoin | null;
  onClose: () => void;
  onMockBuy: (id: string, amountSol: number) => void;
  onMockSell: (id: string, amountSol: number) => void;
  onAddAlert: (symbol: string) => void;
  onOpenTerminal?: (mint: string) => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  coin,
  onClose,
  onMockBuy,
  onMockSell,
  onAddAlert,
  onOpenTerminal
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'audit' | 'bonding' | 'social' | 'api'>('chart');
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [alertConfigured, setAlertConfigured] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedDexLink, setCopiedDexLink] = useState(false);
  const [copiedJupLink, setCopiedJupLink] = useState(false);
  const [copiedPhantomLink, setCopiedPhantomLink] = useState(false);

  if (!coin) {
    return (
      <div id="inspector-empty-state" className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center text-center h-full text-neutral-400">
        <Activity size={36} className="text-neutral-500 animate-pulse mb-3" />
        <h4 className="text-sm font-semibold font-mono uppercase text-neutral-300">Diagnostic Unit Idle</h4>
        <p className="text-xs text-neutral-500 mt-2 max-w-xs">
          Select any rising micro-asset from the Alpha Feed to run automated security audits and pull social scores.
        </p>
      </div>
    );
  }

  const triggerAlertAdd = () => {
    onAddAlert(coin.symbol);
    setAlertConfigured(true);
    setTimeout(() => setAlertConfigured(false), 3000);
  };

  // Generate simulated raw API payloads based on current reactive state
  const getRawPayload = () => {
    return JSON.stringify({
      schema: 'solana-heuristic-v2',
      api_source: coin.platform === 'pump.fun' ? 'pump_fun_bindings' : 'dex_screener_pools',
      fomo_family_integration: true,
      fomo_early_gem_signal: coin.combinedScore > 90,
      token: {
        address: coin.address,
        symbol: coin.symbol,
        name: coin.name,
        price_sol: (coin.priceUsd / 135).toFixed(8), // Assuming SOL = $135
        price_usd: coin.priceUsd,
        market_cap_usd: coin.marketCapUsd,
        liquidity_pool_usd: coin.liquidityUsd,
        hourly_vol_usd: coin.volume1h,
        five_min_vol_usd: coin.volume5m,
        created_time_offset: coin.createdTimeAgo,
      },
      contract_auditor: {
        mint_authority_disabled: coin.mintRenounced,
        freeze_authority_disabled: coin.freezeAuthorityRenounced,
        lp_burn_status_percentage: coin.liquidityLockPercent,
        creator_reputation: coin.creatorWalletBehavior,
        top_10_distribution: coin.holderDistribution,
      },
      social_indexer: {
        twitter: {
          handles_scanned: coin.socials.tweetVolume24h,
          followers: coin.socials.twitterFollowers,
          engagement_factor: coin.socials.twitterEngagementRate,
          sentiment_index: coin.socials.sentimentScore,
          prominent_influencers: coin.socials.influencerMentionsCount,
        }
      },
      breakout_engine: {
        velocity_score: coin.velocityScore,
        risk_index_rating: coin.securityScore,
        social_density_score: coin.socialScore,
        combined_alpha_coefficient: coin.combinedScore,
        calculated_breakout_probability_pct: coin.breakoutProbability
      }
    }, null, 2);
  };

  const chartData = useMemo(() => {
    if (!coin) return [];
    return coin.priceHistory5m.map((price, idx) => {
      // Create some fake time labels stepping backwards by minutes
      const stepsBack = coin.priceHistory5m.length - 1 - idx;
      return {
        time: `-${stepsBack}m`,
        price: price
      };
    });
  }, [coin]);

  return (
    <div id="inspector-panel-root" className="glass-panel rounded-xl flex flex-col h-full text-white overflow-hidden">
      {/* Drawer Header */}
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/20">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg text-xs font-mono font-bold ${
            coin.combinedScore >= 80 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : coin.combinedScore >= 50
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {coin.combinedScore} Rank
          </span>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1">
              <span>{coin.name}</span>
              <span className="text-neutral-500 font-mono text-[10px]">(${coin.symbol})</span>
            </h3>
            <p className="text-[10px] text-neutral-500 font-mono">
              Scanned: {coin.createdTimeAgo}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Stats Summary Strip */}
      <div className="p-4 bg-neutral-950/40 border-b border-neutral-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <span className="text-[10px] font-mono text-neutral-400 block uppercase">Price</span>
          <span className="text-sm font-bold font-mono text-white">
            ${coin.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 6 })}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono text-neutral-400 block uppercase">Breakout Risk</span>
          <span className={`text-sm font-mono font-bold ${coin.securityScore >= 75 ? 'text-emerald-400' : coin.securityScore >= 45 ? 'text-amber-400' : 'text-rose-400'}`}>
            {coin.securityScore >= 75 ? 'Low' : coin.securityScore >= 45 ? 'Medium' : 'CRITICAL'}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono text-neutral-400 block uppercase">Alpha Target</span>
          <span className="text-sm font-bold text-amber-300 font-sans">
            {coin.breakoutProbability}%
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono text-neutral-400 block uppercase">5m Volume</span>
          <span className="text-sm font-mono font-semibold text-emerald-400">
            ${coin.volume5m.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Phantom & Solana Dapp Swap Hub */}
      <div className="p-4 bg-gradient-to-r from-emerald-950/20 via-indigo-950/20 to-neutral-900/40 border-b border-neutral-800 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Phantom Swap & Token Trading Hub
          </span>
          <span className="text-[9px] text-neutral-500 font-mono">
            Solana Mainnet L1
          </span>
        </div>

        {/* Address Row display */}
        <div className="flex items-center gap-1.5 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] text-neutral-400 block font-mono uppercase tracking-wider mb-0.5">Mint Contract Address</span>
            <span className="text-xs font-mono text-emerald-400 block truncate font-bold uppercase select-all leading-tight font-semibold">
              {coin.address}
            </span>
          </div>
          
          <button
            id="copy-address-drawer"
            onClick={() => {
              navigator.clipboard.writeText(coin.address);
              setCopiedAddress(true);
              setTimeout(() => setCopiedAddress(false), 2000);
            }}
            className="glass-panel border-neutral-800 hover:border-emerald-500/40 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-400 px-2.5 py-1.5 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            title="Copy Solana contract address to clipboard"
          >
            {copiedAddress ? (
              <>
                <Check size={11} className="text-emerald-400 animate-bounce" />
                <span className="text-emerald-400">COPIED MINT!</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>COPY MINT CODE</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Pasteable Links Grid */}
        <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
          <button
            onClick={() => {
              if (onOpenTerminal) {
                onOpenTerminal(coin.address);
              } else if ((window as any).openTerminalWithMint) {
                (window as any).openTerminalWithMint(coin.address);
              }
            }}
            className="border border-neutral-800 bg-neutral-950/60 hover:bg-emerald-600/10 hover:border-emerald-500/30 text-neutral-300 hover:text-emerald-300 py-1.5 rounded transition-all flex items-center justify-center gap-1 cursor-pointer font-bold"
            title="Buy Securely via Jupiter inside Alpha Pump"
          >
            <Zap size={11} className="text-emerald-400" />
            <span>EXCHANGE / TRADE (JUPITER)</span>
          </button>

          {/* Option 3: DexScreener Link */}
          <button
            id="copy-dexscreener-link-drawer"
            onClick={() => {
              navigator.clipboard.writeText(`https://dexscreener.com/solana/${coin.address}`);
              setCopiedDexLink(true);
              setTimeout(() => setCopiedDexLink(false), 2000);
            }}
            className="border border-neutral-800 bg-neutral-950/60 hover:bg-sky-600/10 hover:border-sky-500/30 text-neutral-300 hover:text-sky-300 py-1.5 rounded transition-all flex items-center justify-center gap-1 cursor-pointer font-bold"
            title="Copy DexScreener URL"
          >
            {copiedDexLink ? (
              <>
                <Check size={11} className="text-sky-400" />
                <span>COPIED URL!</span>
              </>
            ) : (
              <>
                <Link size={11} className="text-neutral-400" />
                <span>COPY DEX LINK</span>
              </>
            )}
          </button>
        </div>

        {/* Supplementary links */}
        <div className="grid grid-cols-1 text-center text-[10px] font-mono">
          <a
            href={`https://solscan.io/token/${coin.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 py-1 rounded transition-all flex items-center justify-center gap-1 cursor-pointer font-semibold"
            title="Inspect on Solscan Explorer"
          >
            <ExternalLink size={10} className="text-neutral-400" />
            <span>SOLSCAN BLOCKCHAIN EXPLORER ↗</span>
          </a>
        </div>

        {/* Instructive subtitle */}
        <div className="text-[10px] text-neutral-400 leading-snug font-mono mt-0.5 bg-neutral-900/50 p-2.5 rounded border border-neutral-800/40">
          🚀 <strong className="text-neutral-200">How to Open & Trade inside Phantom Wallet:</strong>
          <ul className="list-disc pl-4 mt-1 space-y-1">
            <li><strong>Import Address Directly:</strong> Click <span className="text-emerald-400 font-bold">COPY MINT CODE</span> and paste the exact line of characters into Phantom's native wallet swap search or trade inputs.</li>
            <li><strong>For Phantom dApp Browser page:</strong> Click <span className="text-purple-400 font-bold">COPY JUPITER LINK</span> and paste this exact URL directly into Phantom's in-wallet browser search bar to instantly load the trading pair with SOL.</li>
          </ul>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-neutral-800 bg-neutral-950/20 text-[11px] font-mono">
        <button
          id="tab-chart"
          onClick={() => setActiveTab('chart')}
          className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 capitalize font-semibold cursor-pointer transition-all ${
            activeTab === 'chart'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ChartIcon size={12} /> Chart
        </button>
        <button
          id="tab-security-audit"
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-2 text-center border-b-2 capitalize font-semibold cursor-pointer transition-all ${
            activeTab === 'audit'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Contract Audit
        </button>
        <button
          id="tab-bonding-curve"
          onClick={() => setActiveTab('bonding')}
          className={`flex-1 py-2 text-center border-b-2 capitalize font-semibold cursor-pointer transition-all ${
            activeTab === 'bonding'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Bonding Tech
        </button>
        <button
          id="tab-social-mentions"
          onClick={() => setActiveTab('social')}
          className={`flex-1 py-2 text-center border-b-2 capitalize font-semibold cursor-pointer transition-all ${
            activeTab === 'social'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Social Sentiment
        </button>
        <button
          id="tab-raw-api"
          onClick={() => setActiveTab('api')}
          className={`flex-1 py-2 text-center border-b-2 capitalize font-semibold cursor-pointer transition-all ${
            activeTab === 'api'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          API Payload
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
        
        {/* TAB 0: CHART */}
        {activeTab === 'chart' && (
          <div className="flex flex-col gap-4">
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800/80">
              <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest mb-3">
                Recent Price Action
              </h4>
              <div className="h-48 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="#525252" 
                      fontSize={10} 
                      tickFormatter={(val) => '$' + val.toFixed(6)}
                      tickLine={false}
                      axisLine={false}
                      width={65}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', fontSize: '12px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#34d399' }}
                      formatter={(value: number) => ['$' + value.toFixed(8), 'Price']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke={coin.priceChange1h >= 0 ? "#34d399" : "#fb7185"} 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: '#171717', strokeWidth: 2 }} 
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-neutral-900 border border-neutral-800 rounded p-3">
                <span className="text-[10px] text-neutral-400 font-mono block">1H Change</span>
                <span className={`text-sm font-bold font-mono ${coin.priceChange1h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {coin.priceChange1h >= 0 ? '+' : ''}{coin.priceChange1h.toFixed(2)}%
                </span>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded p-3">
                <span className="text-[10px] text-neutral-400 font-mono block">24H Change</span>
                <span className={`text-sm font-bold font-mono ${coin.priceChange24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: CONTRACT AUDIT */}
        {activeTab === 'audit' && (
          <div className="flex flex-col gap-4">
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
              <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest mb-3 flex items-center justify-between">
                <span>Threat Verification Summary</span>
                <span className="text-[10px] text-neutral-500 font-normal">Passed: {coin.topAuditsPassed.length} / 4</span>
              </h4>
              
              <div className="flex flex-col gap-2.5">
                {/* Rule: Mint Authority */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-mono">Mint Authority Disabled</span>
                  {coin.mintRenounced ? (
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={11} /> YES (Renounced)
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <ShieldAlert size={11} /> ACTIVE THREAT
                    </span>
                  )}
                </div>

                {/* Rule: Freeze Authority */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-mono">Freeze Authority Renounced</span>
                  {coin.freezeAuthorityRenounced ? (
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={11} /> YES (Disabled)
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <ShieldAlert size={11} /> ACTIVE RISK
                    </span>
                  )}
                </div>

                {/* Rule: Locked LP */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-mono">LP Token Burnt / Locked</span>
                  {coin.liquidityLockedOrBurnt ? (
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={11} /> {coin.liquidityLockPercent}% Burnt
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldAlert size={11} /> 0% (Dev LP Risk)
                    </span>
                  )}
                </div>

                {/* Rule: Developer Behavior */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-mono">Dev Wallet Activity Profile</span>
                  <span className={`font-mono text-[11px] font-bold ${
                    coin.creatorWalletBehavior === 'clean' 
                      ? 'text-emerald-400' 
                      : coin.creatorWalletBehavior === 'first_timer'
                        ? 'text-blue-400' 
                        : 'text-rose-400 font-semibold'
                  }`}>
                    {coin.creatorWalletBehavior === 'clean' && 'Clean History (No Rug)'}
                    {coin.creatorWalletBehavior === 'first_timer' && 'First-Time Wallet'}
                    {coin.creatorWalletBehavior === 'neutral' && 'Neutral History'}
                    {coin.creatorWalletBehavior === 'suspicious' && 'Suspicious / Rug History'}
                  </span>
                </div>
              </div>
            </div>

            {/* Holder Distribution Details */}
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
              <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest mb-3">
                Holder Density Indicators
              </h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="border border-neutral-800 bg-neutral-900/60 p-2 rounded">
                  <span className="text-[10px] text-neutral-400 block font-mono">Top 10 Wallets</span>
                  <span className={`text-base font-mono font-bold ${coin.holderDistribution.top10HoldersPercent > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {coin.holderDistribution.top10HoldersPercent}%
                  </span>
                  <span className="text-[9px] text-neutral-500 block mt-0.5">Supply Concentration</span>
                </div>
                <div className="border border-neutral-800 bg-neutral-900/60 p-2 rounded">
                  <span className="text-[10px] text-neutral-400 block font-mono">Creator Holding</span>
                  <span className={`text-base font-mono font-bold ${coin.holderDistribution.creatorHoldingPercent > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {coin.holderDistribution.creatorHoldingPercent}%
                  </span>
                  <span className="text-[9px] text-neutral-500 block mt-0.5">Creator Pre-mine</span>
                </div>
              </div>
            </div>

            {/* Red Flags warnings list */}
            {coin.redFlagsCount > 0 ? (
              <div className="bg-rose-950/20 border border-rose-500/20 p-3 rounded-lg flex flex-col gap-1.5">
                <span className="text-xs text-rose-400 font-bold font-mono flex items-center gap-1 uppercase tracking-wider">
                  <ShieldAlert size={12} /> Red Flag Diagnostics ({coin.redFlagsCount})
                </span>
                <ul className="list-disc list-inside text-[11px] text-neutral-300 flex flex-col gap-1 mt-1 font-mono">
                  {coin.redFlagsList.map((rf, idx) => (
                    <li key={idx} className="leading-tight text-neutral-300">{rf}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-2">
                <Award size={16} className="text-emerald-400 shrink-0" />
                <span className="text-[11px] text-emerald-300 font-semibold font-mono">
                  Zero critical malicious signatures fetched. Passed multi-layer heuristics checks.
                </span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BONDING TECH */}
        {activeTab === 'bonding' && (
          <div className="flex flex-col gap-4">
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
              <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest mb-2">
                Pump.fun Bonding Curve Specs
              </h4>
              <p className="text-[11px] text-neutral-400 mb-3 leading-snug">
                Once bonding curve progress reaches 100%, the contract transfers all accumulated token liquidity to Raydium pool automations with the mint authority burnt.
              </p>

              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between text-xs font-mono text-neutral-300 mb-1">
                    <span>Bonding Curve Complete</span>
                    <span className="text-purple-400 font-bold">{coin.bondingCurveProgress}%</span>
                  </div>
                  <div className="w-full bg-neutral-900 rounded-full h-3 p-0.5 overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${coin.bondingCurveProgress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-neutral-900 p-2 rounded text-center">
                    <span className="text-[10px] text-neutral-400 block font-mono">Platform State</span>
                    <span className="text-xs font-bold text-neutral-200 capitalize">{coin.platform}</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded text-center">
                    <span className="text-[10px] text-neutral-400 block font-mono">Curve Status</span>
                    <span className="text-xs font-bold text-neutral-200">
                      {coin.bondingCurveProgress >= 100 ? 'Fully Seeded' : 'Seeding Curve'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive simulation utility */}
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800/80">
              <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <ShoppingCart size={13} /> Simulation Play Sandbox
              </h4>
              <p className="text-[10px] text-neutral-400 font-mono mb-3">
                Simulate buy and sell transactional orders to test real-time scoring recalculations and bonding velocity adjustments.
              </p>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    id="mock-buy-10sol"
                    onClick={() => onMockBuy(coin.id, 10)}
                    className="flex-1 bg-emerald-500 text-neutral-950 py-1.5 rounded text-xs font-mono font-bold cursor-pointer hover:bg-emerald-400 transition-colors"
                  >
                    +10 SOL Buy Surge
                  </button>
                  <button
                    id="mock-buy-30sol"
                    onClick={() => onMockBuy(coin.id, 30)}
                    className="flex-1 bg-purple-600 text-white py-1.5 rounded text-xs font-mono font-bold cursor-pointer hover:bg-purple-500 transition-colors"
                  >
                    +30 SOL Whales
                  </button>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    id="mock-sell-10sol"
                    onClick={() => onMockSell(coin.id, 10)}
                    className="flex-1 border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 py-1.5 rounded text-[11px] font-mono cursor-pointer transition-all"
                  >
                    Dump 10 SOL Sell
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SOCIAL SENTIMENT */}
        {activeTab === 'social' && (
          <div className="flex flex-col gap-4">
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
              <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest mb-3">
                Twitter/X Mentions & Analytics
              </h4>

              <div className="flex flex-col gap-3">
                {/* Followers */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-mono">Twitter/X Followers</span>
                  <span className="text-white font-mono font-bold">
                    {coin.socials.twitterFollowers.toLocaleString()}
                  </span>
                </div>

                {/* Tweet Volume */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-mono">Scan volume (24H mentions)</span>
                  <span className="text-blue-400 font-mono font-bold">
                    {coin.socials.tweetVolume24h.toLocaleString()} tweets
                  </span>
                </div>

                {/* Engagement */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-mono">Twitter Activity Ratio</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {coin.socials.twitterEngagementRate}%
                  </span>
                </div>

                {/* Sentiment score */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
                    <span>X Sentiment Index Rating</span>
                    <span className="text-emerald-400 font-bold">{coin.socials.sentimentScore}% Positive</span>
                  </div>
                  <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800">
                    <div
                      className={`h-full rounded-full ${
                        coin.socials.sentimentScore >= 75
                          ? 'bg-emerald-500'
                          : coin.socials.sentimentScore >= 45
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${coin.socials.sentimentScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Influencer mentions card */}
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 flex items-center gap-3">
              <Users size={20} className="text-blue-400 shrink-0" />
              <div>
                <span className="text-[10px] text-neutral-400 block font-mono">Influencer Scans</span>
                <span className="text-xs text-neutral-200 font-bold font-mono">
                  {coin.socials.influencerMentionsCount} prominent alpha handles talking about ${coin.symbol}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RAW API DIAGNOSTICS */}
        {activeTab === 'api' && (
          <div className="flex flex-col gap-2 flex-grow h-0">
            <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
              <span>GET /v2/token/{coin.address}</span>
              <button
                id="copy-raw-api"
                onClick={() => {
                  navigator.clipboard.writeText(getRawPayload());
                  setCopiedRaw(true);
                  setTimeout(() => setCopiedRaw(false), 2000);
                }}
                className="text-emerald-400 hover:text-emerald-300 text-[10px]"
              >
                {copiedRaw ? 'Copied JSON!' : 'Copy raw payload'}
              </button>
            </div>
            
            <div className="flex-grow bg-neutral-950 p-2.5 rounded border border-neutral-800/80 font-mono text-[10px] text-emerald-400/80 overflow-auto whitespace-pre h-48 scrollbar-thin">
              {getRawPayload()}
            </div>
          </div>
        )}

        {/* Action Controls for alert / telegram setups */}
        <div className="pt-4 border-t border-neutral-800 flex flex-col gap-2 mt-4 bg-neutral-900">
          <button
            id={`configure-alert-${coin.symbol}`}
            onClick={triggerAlertAdd}
            className={`w-full py-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              alertConfigured
                ? 'bg-neutral-800 text-emerald-400'
                : 'bg-neutral-800 hover:bg-neutral-700 text-white'
            }`}
          >
            <BellDot size={13} className={alertConfigured ? 'text-emerald-400' : 'text-neutral-400'} />
            {alertConfigured ? `ALERT TRIGGERED FOR $${coin.symbol}` : `Configure real-time Price Alert`}
          </button>
          
          <div className="flex items-center gap-1.5 justify-center text-[10px] text-neutral-500 font-mono">
            <HeartHandshake size={11} /> 
            <span>Simulating secure RPC link with Solana Mainnet-Beta</span>
          </div>
        </div>
      </div>
    </div>
  );
};
