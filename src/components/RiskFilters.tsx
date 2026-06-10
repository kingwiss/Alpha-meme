import React from 'react';
import { Search, ShieldAlert, BadgePercent, Layers, ArrowUpDown, Info, Sparkles, ShieldCheck, Award, TrendingUp, BookOpen, HelpCircle } from 'lucide-react';
import { ScreenerFilters } from '../types';

interface RiskFiltersProps {
  filters: ScreenerFilters;
  onFilterChange: (filters: ScreenerFilters) => void;
}

export const RiskFilters: React.FC<RiskFiltersProps> = ({ filters, onFilterChange }) => {
  const [showExpertRadar, setShowExpertRadar] = React.useState(true);
  const [activeResourceTab, setActiveResourceTab] = React.useState<'scamShield' | 'resources'>('scamShield');

  const setRiskTolerance = (tolerance: 'all' | 'conservative' | 'aggressive' | 'degen') => {
    // Automatically tweak default slider numbers to match the quick presets
    let minSecScore = 0;
    if (tolerance === 'conservative') minSecScore = 80;
    else if (tolerance === 'aggressive') minSecScore = 50;
    else if (tolerance === 'degen') minSecScore = 0;

    onFilterChange({
      ...filters,
      riskTolerance: tolerance,
      minSecurityScore: minSecScore,
    });
  };

  return (
    <div
      id="filters-root-panel"
      className="glass-panel rounded-xl p-5 w-full flex flex-col gap-4 text-white"
    >
      {/* Tab Row: Title / Header & Search */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-lg font-bold font-sans flex items-center gap-2">
            Alpha Screen Parameters
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Configure automated heuristic scoring parameters & scam shields
          </p>
        </div>
        <div id="search-input-frame" className="relative w-full lg:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
            <Search size={16} />
          </span>
          <input
            id="search-input-box"
            type="text"
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg py-2 pl-9 pr-4 text-xs font-mono text-white placeholder-neutral-500 outline-none transition-colors"
            placeholder="Search address, ticker, name..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-neutral-800/60">
        {/* Risk Tolerance Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-neutral-400 uppercase tracking-wide flex items-center gap-1">
            <ShieldAlert size={12} className="text-amber-400" />
              Risk Tolerance Shield
          </label>
          <div className="grid grid-cols-4 bg-neutral-950 p-1 border border-neutral-800 rounded-lg text-center gap-0.5">
            {(['all', 'conservative', 'aggressive', 'degen'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setRiskTolerance(level)}
                className={`text-[8px] sm:text-[9px] uppercase tracking-wider font-mono py-1.5 rounded capitalize transition-all cursor-pointer ${
                  filters.riskTolerance === level
                    ? 'bg-neutral-800 text-emerald-400 font-bold border border-neutral-700/50'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Origin Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-neutral-400 uppercase tracking-wide flex items-center gap-1">
            <Layers size={12} className="text-blue-400" />
            Platform Feeds
          </label>
          <div className="grid grid-cols-3 bg-neutral-950 p-1 border border-neutral-800 rounded-lg text-center gap-0.5">
            {[
              { id: 'all', label: 'All Feeds' },
              { id: 'pump.fun', label: 'Pump.fun' },
              { id: 'dexes', label: 'DEX Pools' },
            ].map((plat) => (
              <button
                key={plat.id}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    platform: plat.id as any,
                  })
                }
                className={`text-[8px] sm:text-[9px] uppercase tracking-wider font-mono py-1.5 rounded transition-all cursor-pointer ${
                  filters.platform === plat.id
                    ? 'bg-neutral-800 text-blue-400 font-bold border border-neutral-700/50'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {plat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bonding Progress Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-mono text-neutral-400">
            <span className="uppercase tracking-wide flex items-center gap-1">
              <BadgePercent size={12} className="text-emerald-400 animate-pulse" />
              Min Bonding Progress
            </span>
            <span className="text-emerald-400 font-semibold">{filters.minBondingProgress}%</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input
              id="bonding-progress-slider"
              type="range"
              min="0"
              max="95"
              step="5"
              className="w-full accent-emerald-500 bg-neutral-950 rounded-lg appearance-none h-1 cursor-pointer"
              value={filters.minBondingProgress}
              onChange={(e) =>
                onFilterChange({ ...filters, minBondingProgress: parseInt(e.target.value) })
              }
            />
          </div>
        </div>

        {/* Security Audit Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-mono text-neutral-400">
            <span className="uppercase tracking-wide">Min Security Index</span>
            <span
              className={`font-semibold font-mono ${
                filters.minSecurityScore >= 75
                  ? 'text-emerald-400'
                  : filters.minSecurityScore >= 40
                    ? 'text-amber-400'
                    : 'text-rose-400'
              }`}
            >
              {filters.minSecurityScore >= 1 ? `${filters.minSecurityScore} Pts` : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input
              id="security-score-slider"
              type="range"
              min="0"
              max="90"
              step="10"
              className="w-full accent-emerald-500 bg-neutral-950 rounded-lg appearance-none h-1 cursor-pointer"
              value={filters.minSecurityScore}
              onChange={(e) =>
                onFilterChange({ ...filters, minSecurityScore: parseInt(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      {/* 4. Expert Intelligence Radar Controls */}
      <div className="border-t border-neutral-800/80 pt-4 mt-1 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
              🔬 Meme Expert Intelligence Radar & Smart Security Filters
            </span>
          </div>
          <button
            type="button"
            id="toggle-expert-radar-panel"
            onClick={() => setShowExpertRadar(!showExpertRadar)}
            className="text-[10px] font-mono text-neutral-400 hover:text-emerald-400 cursor-pointer underline decoration-dotted capitalize select-none"
          >
            {showExpertRadar ? 'Hide Expert Panel ▼' : 'Show Expert Panel ▲'}
          </button>
        </div>

        {showExpertRadar && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800/60 transition-all">
            {/* Left Side (7 cols): Expert Filter Toggles */}
            <div className="xl:col-span-7 flex flex-col gap-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 block mb-1">
                ⚡ Expert Filters Configuration
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Low Rug Risk */}
                <button
                  type="button"
                  id="btn-expert-anti-rug"
                  onClick={() => onFilterChange({
                    ...filters,
                    expertAntiRugOnly: !filters.expertAntiRugOnly,
                    minSecurityScore: !filters.expertAntiRugOnly ? Math.max(80, filters.minSecurityScore) : filters.minSecurityScore
                  })}
                  className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all relative overflow-hidden group cursor-pointer ${
                    filters.expertAntiRugOnly
                      ? 'bg-emerald-950/30 border-emerald-500/80 text-white'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-between w-full">
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-emerald-400">
                      <ShieldCheck size={13} /> Strict Anti-Rug Guard
                    </span>
                    <span className={`h-2 w-2 rounded-full ${filters.expertAntiRugOnly ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-700'}`}></span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono leading-snug mt-1">
                    Filters out ANY token with active warnings. Enforces Mint Renounced, Freeze Disabled / Revoked, and decentralized holders.
                  </p>
                </button>

                {/* 2. High Velocity */}
                <button
                  type="button"
                  id="btn-expert-high-velocity"
                  onClick={() => onFilterChange({
                    ...filters,
                    expertHighVelocityOnly: !filters.expertHighVelocityOnly,
                    sortBy: !filters.expertHighVelocityOnly ? 'velocityScore' : filters.sortBy
                  })}
                  className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all relative overflow-hidden group cursor-pointer ${
                    filters.expertHighVelocityOnly
                      ? 'bg-sky-950/30 border-sky-500/80 text-white'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-between w-full">
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-sky-400">
                      <TrendingUp size={13} /> Whale Velocity Booster
                    </span>
                    <span className={`h-2 w-2 rounded-full ${filters.expertHighVelocityOnly ? 'bg-sky-400 animate-pulse' : 'bg-neutral-700'}`}></span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono leading-snug mt-1">
                    Isolates coins with raw 5m trade volume multiplier spikes & exceptional real-time buyer inflow rates.
                  </p>
                </button>

                {/* 3. Social Mentions */}
                <button
                  type="button"
                  id="btn-expert-social"
                  onClick={() => onFilterChange({
                    ...filters,
                    expertSocialHypeOnly: !filters.expertSocialHypeOnly
                  })}
                  className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all relative overflow-hidden group cursor-pointer ${
                    filters.expertSocialHypeOnly
                      ? 'bg-purple-950/30 border-purple-500/80 text-white'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-between w-full">
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-purple-400">
                      <Award size={13} /> Social Hub Alpha Seal
                    </span>
                    <span className={`h-2 w-2 rounded-full ${filters.expertSocialHypeOnly ? 'bg-purple-400 animate-pulse' : 'bg-neutral-700'}`}></span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono leading-snug mt-1">
                    Targets coins with intensive X/Twitter follower engagement, high influencer mentions, & positive sentiment &gt;80%.
                  </p>
                </button>

                {/* 4. Golden Ticket */}
                <button
                  type="button"
                  id="btn-expert-golden-ticket"
                  onClick={() => {
                    const nextVal = !filters.expertGoldenTicketOnly;
                    onFilterChange({
                      ...filters,
                      expertGoldenTicketOnly: nextVal,
                      expertAntiRugOnly: nextVal ? true : filters.expertAntiRugOnly,
                      expertHighVelocityOnly: nextVal ? true : filters.expertHighVelocityOnly,
                      expertSocialHypeOnly: nextVal ? true : filters.expertSocialHypeOnly,
                      riskTolerance: nextVal ? 'conservative' : filters.riskTolerance,
                      minSecurityScore: nextVal ? 90 : filters.minSecurityScore,
                      sortBy: nextVal ? 'combinedScore' : filters.sortBy
                    });
                  }}
                  className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all relative overflow-hidden group cursor-pointer ${
                    filters.expertGoldenTicketOnly
                      ? 'bg-amber-950/50 border-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-between w-full">
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-400">
                      <Sparkles size={13} className="animate-spin text-amber-400" /> Golden Ticket Target (Best Buy)
                    </span>
                    <span className={`h-2 w-2 rounded-full ${filters.expertGoldenTicketOnly ? 'bg-amber-400 animate-ping' : 'bg-neutral-700'}`}></span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono leading-snug mt-1">
                    Aligns all scoring engines simultaneously. Isolates elite highly-vetted coins with pristine security and explosive traction.
                  </p>
                </button>
              </div>
            </div>

            {/* Right Side (5 cols): Guidelines / API Resources */}
            <div className="xl:col-span-5 border-t xl:border-t-0 xl:border-l border-neutral-800/80 pt-3 xl:pt-0 xl:pl-4 flex flex-col gap-2">
              <div className="flex border-b border-neutral-800 pb-1 w-full justify-between items-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                  <BookOpen size={11} /> Expert Guidelines & APIs
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveResourceTab('scamShield')}
                    className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                      activeResourceTab === 'scamShield' 
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-800/50' 
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Best Practices
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResourceTab('resources')}
                    className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${
                      activeResourceTab === 'resources' 
                        ? 'bg-blue-500/20 text-blue-400 font-bold border border-blue-800/50' 
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    RPC Endpoints
                  </button>
                </div>
              </div>

              {activeResourceTab === 'scamShield' ? (
                <div className="text-[10px] font-mono text-neutral-300 space-y-1.5 leading-snug">
                  <div className="p-1 px-1.5 rounded bg-rose-950/20 border border-rose-900/40 text-rose-300">
                    <strong>1. Renounce Check:</strong> Active &quot;Mint Authority&quot; allows devs to supply-shock dump on holders. Always look for green shield Check.
                  </div>
                  <div className="p-1 px-1.5 rounded bg-emerald-950/10 border border-emerald-950/40 text-neutral-300">
                    <strong>2. LP Lock & Burn:</strong> Ensure LP is 100% burnt. If LP is held in a dev wallet, direct withdraw/drain can occur instantly.
                  </div>
                  <div className="p-1 px-1.5 rounded bg-emerald-950/10 border border-emerald-950/40 text-neutral-300">
                    <strong>3. Holder Concentration:</strong> Top-10 holders holding &gt;25% combined represent severe central dumping likelihood.
                  </div>
                </div>
              ) : (
                <div className="text-[10px] font-mono text-neutral-300 space-y-1.5 leading-snug">
                  <p className="text-neutral-400 text-[9px] mb-1">Cross-verifying signals with real-time Solana indexing services:</p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center bg-neutral-900 p-1 px-1.5 rounded border border-neutral-800/40">
                      <span className="text-blue-400 font-bold">DexScreener Websocket API</span>
                      <span className="text-neutral-500 text-[8px]">Live Pool Indexes</span>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-900 p-1 px-1.5 rounded border border-neutral-800/40">
                      <span className="text-purple-400 font-bold">Jup.ag Routing SDK</span>
                      <span className="text-neutral-500 text-[8px]">Auto Swap Pre-sets</span>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-900 p-1 px-1.5 rounded border border-neutral-800/40">
                      <span className="text-yellow-400 font-bold">Helius Solana RPC Streams</span>
                      <span className="text-neutral-500 text-[8px]">Mempool Anti-Rug</span>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-900 p-1 px-1.5 rounded border border-neutral-800/40">
                      <span className="text-emerald-400 font-bold">Pump.fun Bonding API</span>
                      <span className="text-neutral-500 text-[8px]">Curve Graduations</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sorting row */}
      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-neutral-800/40 text-xs text-neutral-400 font-mono gap-2">
        <span className="flex items-center gap-1">
          <Info size={13} className="text-emerald-500" />
          {filters.riskTolerance === 'conservative' && 'Scam Shield active: Hiding coins with unrenounced mints and high-holder supply.'}
          {filters.riskTolerance === 'degen' && 'Scam Shield bypassed: Warning! Visualizing contracts with high risk of immediate rug pull.'}
          {filters.riskTolerance === 'aggressive' && 'Scam Shield moderate: Visualizing young assets with solid velocity and minor red flags.'}
          {filters.riskTolerance === 'all' && 'Scam Shield normal: Displaying complete list matching minimum score parameters.'}
        </span>
        <div className="flex items-center gap-2">
          <span>Sort By:</span>
          <select
            id="sorting-dropdown"
            className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-emerald-400 outline-none focus:border-emerald-500 cursor-pointer font-mono"
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
          >
            <option value="combinedScore">⚡ Alpha Velocity Score</option>
            <option value="breakoutProbability">🔥 Breakout Probability</option>
            <option value="velocityScore">🚀 Transaction Speed (tx/m)</option>
            <option value="marketCapUsd">💼 Market Cap (USD)</option>
            <option value="priceChange1h">📊 1H Price Gain %</option>
          </select>
        </div>
      </div>
    </div>
  );
};
