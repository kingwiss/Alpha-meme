import React, { useRef, useEffect, useState, PointerEvent } from 'react';
import { Eye, ShieldCheck, TrendingUp, AlertTriangle, Cpu } from 'lucide-react';
import { ExecutiveStats } from '../types';

interface MetricHeaderProps {
  stats: ExecutiveStats;
  isSimulating: boolean;
  onForceRefresh: () => void;
  coinsCount: number;
}

export const MetricHeader: React.FC<MetricHeaderProps> = ({
  stats,
  isSimulating,
  onForceRefresh,
  coinsCount,
}) => {
  const cards = [
    <div
      key="heuristics"
      className="w-[280px] shrink-0 rounded-xl p-4 flex flex-col justify-between transition-all glow-emerald"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-400">Heuristics Scope</p>
          <h3 className="text-2xl font-bold font-sans tracking-tight text-white mt-1">
            {(stats.totalScanned24h + (isSimulating ? 12 : 0)).toLocaleString()} <span className="text-xs text-neutral-500 font-normal">/24h</span>
          </h3>
        </div>
        <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
          <Eye size={18} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-mono text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Dex + Pump Fun APIs Live
        </span>
        <span className="text-emerald-400 font-semibold">{coinsCount} tracked</span>
      </div>
    </div>,

    <div
      key="audits"
      className="w-[280px] shrink-0 rounded-xl p-4 flex flex-col justify-between transition-all glow-rose"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-400">Threat Auditing</p>
          <h3 className="text-2xl font-bold font-sans tracking-tight text-white mt-1">
            {stats.averageBreakoutRiskScore}% <span className="text-xs text-neutral-500 font-normal">Avg Safety</span>
          </h3>
        </div>
        <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
          <ShieldCheck size={18} />
        </div>
      </div>
      <div className="mt-4 text-xs font-mono text-neutral-400 flex justify-between items-center">
        <span>Automated audits active</span>
        <span className="bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
          SCAM SHIELD ACTIVE
        </span>
      </div>
    </div>,

    <div
      key="alpha"
      className="w-[280px] shrink-0 rounded-xl p-4 flex flex-col justify-between transition-all glow-amber"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-400">High Alpha Signals</p>
          <h3 className="text-2xl font-bold font-sans tracking-tight text-emerald-400 mt-1">
            {stats.activeHighAlphaCount} <span className="text-xs text-neutral-500 font-normal">Passed Filter</span>
          </h3>
        </div>
        <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
          <TrendingUp size={18} />
        </div>
      </div>
      <div className="mt-4 text-xs font-mono text-neutral-400 flex justify-between items-center">
        <span>Breakout metric &gt; 80%</span>
        <span className="text-amber-400 font-semibold">{stats.pumpMigrationsCount} Migrations</span>
      </div>
    </div>,

    <div
      key="telemetry"
      className="w-[280px] shrink-0 rounded-xl p-4 flex flex-col justify-between transition-all glow-emerald"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-400">Engine Telemetry</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold font-mono tracking-tight text-neutral-200">
              {isSimulating ? 'SIMULATOR ACTIVE' : 'SCAN STALLED'}
            </span>
          </div>
        </div>
        <button
          onClick={onForceRefresh}
          className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors cursor-pointer self-center"
          title="Force immediate API diagnostic sweep"
        >
          <Cpu size={18} className={isSimulating ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-mono text-neutral-500">
        <div className="flex items-center gap-1.5 w-full">
          <span className="text-neutral-400">Polling cycle:</span>
          <div className="h-1.5 bg-neutral-800 rounded-full flex-grow overflow-hidden max-w-[100px]">
            <div
              className={`h-full bg-emerald-500 ${isSimulating ? 'animate-[pulse_1.5s_infinite]' : 'w-1/4'}`}
              style={{ width: isSimulating ? '100%' : '25%' }}
            ></div>
          </div>
          <span className="text-emerald-400 ml-auto text-[10px]">60s Feed</span>
        </div>
      </div>
    </div>
  ];

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // Add dragging for desktop support
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const exactScrollLeft = useRef(0);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime: number | null = null;
    const speed = 0.03; // pixels per ms

    const autoScroll = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // Only animate if not dragging/interacting/hovered.
      if (scrollContainerRef.current && !isInteracting && !isHovered) {
        exactScrollLeft.current += speed * deltaTime;
        
        const scrollWidth = scrollContainerRef.current.scrollWidth;
        const halfWidth = scrollWidth / 2;

        // Reset scroll position gracefully
        if (exactScrollLeft.current >= halfWidth) {
          exactScrollLeft.current -= halfWidth;
        } else if (exactScrollLeft.current <= 0 && speed < 0) {
          exactScrollLeft.current += halfWidth;
        }

        scrollContainerRef.current.scrollLeft = exactScrollLeft.current;
      } else if (scrollContainerRef.current) {
        // synchronize exact position with manual scroll position
        exactScrollLeft.current = scrollContainerRef.current.scrollLeft;
      }
      
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isInteracting, isHovered]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    setIsInteracting(true);
    startX.current = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    scrollLeftStart.current = scrollContainerRef.current?.scrollLeft || 0;
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 1.5; // scroll-fast multiplier
    scrollContainerRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handlePointerUpOrLeave = () => {
    isDragging.current = false;
    setIsInteracting(false);
  };

  return (
    <div 
      id="stat-header-container" 
      className="w-full text-neutral-300 overflow-x-auto hide-scrollbar pb-4 flex cursor-grab active:cursor-grabbing touch-pan-x"
      ref={scrollContainerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setIsInteracting(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrLeave}
      onPointerLeave={handlePointerUpOrLeave}
    >
      <div className="flex shrink-0 gap-4 pr-4 select-none">
        {cards}
      </div>
      <div aria-hidden="true" className="flex shrink-0 gap-4 pr-4 select-none">
        {cards}
      </div>
    </div>
  );
};
