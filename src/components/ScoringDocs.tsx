import React, { useState } from 'react';
import { Info, HelpCircle, ShieldCheck, Zap, HeartCrack } from 'lucide-react';

export const ScoringDocs: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="scoring-docs-panel" className="glass-panel rounded-xl overflow-hidden flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex justify-between items-center text-white hover:bg-neutral-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="text-emerald-400 shrink-0" size={16} />
          <h4 className="text-sm font-bold font-mono text-neutral-200">Scoring Index Legend</h4>
        </div>
        <span className="text-xs text-neutral-500 uppercase tracking-wider font-mono border border-neutral-800 px-2 py-0.5 rounded bg-neutral-950">
          {isOpen ? 'Close' : 'Read Docs'}
        </span>
      </button>

      {isOpen && (
        <div className="p-5 pt-0 text-white flex flex-col gap-3 border-t border-neutral-800 mt-0">
          <p className="text-xs text-neutral-400 font-mono mt-3">How the automated 0-100 breakout velocity coefficient is scored</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {/* Metric 1 */}
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-400 flex items-center gap-1">
                <Zap size={11} /> Transaction Velocity (45%)
              </span>
              <p className="text-xs text-neutral-300 font-mono leading-relaxed mt-1">
                Analyses transaction speed ratios on live liquidity pools. Promotes tokens experiencing heavy buy orders over selling pressures.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-blue-400 flex items-center gap-1">
                <ShieldCheck size={11} /> Contract Threat Shield (25%)
              </span>
              <p className="text-xs text-neutral-300 font-mono leading-relaxed mt-1">
                Deducts heavy score penalties for unrenounced mint/freeze authorities, suspicious dev wallet histories, and developer supply dumps.
              </p>
            </div>

            {/* Metric 3 */}
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-400 flex items-center gap-1">
                <HelpCircle size={11} /> Social Media Sentiment (30%)
              </span>
              <p className="text-[10px] leading-relaxed text-neutral-300 font-mono mt-1">
                Crawls active X/Twitter sentiment to index handle activity, follower growth, engagement index, and high-repute influencer mentions.
              </p>
            </div>
          </div>

          {/* Safety Shield Capping warning */}
          <div className="mt-2 bg-gradient-to-r from-rose-950/20 to-neutral-950 border border-rose-500/20 p-3.5 rounded-lg flex items-start gap-2.5">
            <HeartCrack size={16} className="text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-rose-300 uppercase font-mono tracking-wider block">
                Critical Safety Feature: The "Anti-Rug Capping Penalty"
              </span>
              <p className="text-[11px] text-neutral-300 font-mono leading-snug mt-1">
                To prevent clever honeypots and frontloaded scam contracts from ranking as Tier-1 breakouts, our algorithm triggers a strict **capping penalty** if the Security Score drops below 40. The combined breakout probability has a hard limit at **max 32**, routing scam assets immediately downwards even if transaction velocity or social hype is extremely high.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
