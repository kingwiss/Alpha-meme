/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  ShieldX, 
  Terminal, 
  RotateCcw, 
  Plus, 
  BellRing, 
  Flame, 
  Activity, 
  Globe, 
  Search, 
  HelpCircle,
  Play,
  Pause,
  AlertCircle,
  Sun,
  Moon,
  Loader2,
  RefreshCw,
  User as UserIcon,
  Check,
  Mail
} from 'lucide-react';
import { MemeCoin, ExecutiveStats, ScreenerFilters, SystemLog } from './types';
import { INITIAL_MEME_COINS, MOCK_SYSTEM_LOGS, calculateExecutiveStats, simulateCoinTick } from './mockData';
import { MetricHeader } from './components/MetricHeader';
import { RiskFilters } from './components/RiskFilters';
import { ScreenerTable } from './components/ScreenerTable';
import { InspectorDrawer } from './components/InspectorDrawer';
import { ScoringDocs } from './components/ScoringDocs';
import { fetchLiveTokens } from './liveDataService';
import { useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ProfileDashboard } from './components/ProfileDashboard';
import { viewCoin } from './lib/coinActions';
import { ContactFloatingButton } from './components/ContactFloatingButton';
import { TerminalModal } from './components/TerminalModal';
import { TokenSearchModal } from './components/TokenSearchModal';
import { AboutPage } from './components/AboutPage';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';

// Safe wrapper for localStorage to prevent security exceptions in sandboxed iframes
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access denied:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage write denied:", e);
    }
  }
};

// Safe wrapper for sessionStorage to prevent security exceptions in sandboxed iframes
const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access denied:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage write denied:", e);
    }
  }
};

const safeReplaceState = (state: any, title: string, url: string) => {
  try {
    window.history.replaceState(state, title, url);
  } catch (e) {
    console.warn("History replaceState restricted or blocked:", e);
  }
};

export default function App() {
  const { user, profile, updateProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showComingSoonPremiumModal, setShowComingSoonPremiumModal] = useState(false);
  
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [terminalMint, setTerminalMint] = useState<string>('');
  
  const [showTokenSearchModal, setShowTokenSearchModal] = useState(false);

  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'privacy' | 'terms'>('home');

  // Core application states
  const [coins, setCoins] = useState<MemeCoin[]>(INITIAL_MEME_COINS);
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  
  const [selectedExternalCoin, setSelectedExternalCoin] = useState<MemeCoin | null>(null);

  // Show premium modal after 3 minutes if not premium
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!profile?.isPremium) {
        setShowPremiumModal(true);
      }
    }, 3 * 60 * 1000); // 3 minutes
    return () => clearTimeout(timer);
  }, [profile?.isPremium]);

  // Suggest premium purchase after 60s for non-premium users
  useEffect(() => {
    if (profile?.isPremium) return;
    
    const hasShown = safeLocalStorage.getItem('hasShownComingSoonPremium');
    if (hasShown) return;

    const timer = setTimeout(() => {
      setShowComingSoonPremiumModal(true);
      safeLocalStorage.setItem('hasShownComingSoonPremium', 'true');
    }, 60000); // 60 seconds

    return () => clearTimeout(timer);
  }, [profile?.isPremium]);

  // Check for payment success parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session_id = urlParams.get('session_id');
    const payment = urlParams.get('payment');

    if (payment === 'success' && session_id && profile) {
      if (profile.isPremium) {
         // Clean the URL if already premium but somehow still has params
         safeReplaceState({}, document.title, window.location.pathname);
         return; 
      }
      
      // Clean the URL IMMEDIATELY to prevent duplicate effects if re-rendered
      safeReplaceState({}, document.title, window.location.pathname);
      
      const verifyPayment = async () => {
        try {
          const res = await fetch('/api/verify-session', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ sessionId: session_id })
          });
          const data = await res.json();
          if (data.isPremium) {
            await updateProfile({ isPremium: true });
            alert("Payment successful! You are now premium and can see all coins!");
          } else {
             alert("Payment not yet successful. If this is a mistake, contact support.");
          }
        } catch (e) {
          console.error("Verification error", e);
          alert("Failed to verify payment session.");
        }
      };

      verifyPayment();
    }
  }, [profile, updateProfile]);
  
  useEffect(() => {
    if (selectedCoinId && user) {
      const coin = coins.find(c => c.id === selectedCoinId) || (selectedExternalCoin?.id === selectedCoinId ? selectedExternalCoin : null);
      if (coin) {
        viewCoin(user.uid, coin).catch(console.error);
      }
    }
  }, [selectedCoinId, user, coins, selectedExternalCoin]);

  const [logs, setLogs] = useState<SystemLog[]>(MOCK_SYSTEM_LOGS);
  const [alerts, setAlerts] = useState<string[]>(['AURA', 'CHAD']);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  
  // Theme and UI States
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  // Audio Notification states
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [notifiedSymbols, setNotifiedSymbols] = useState<string[]>(() => {
    return INITIAL_MEME_COINS.filter(
      c => c.combinedScore >= 90 && c.securityScore >= 75 && c.breakoutProbability >= 90
    ).map(c => c.symbol);
  });

  // Web Audio alert chime function
  const playHotBreakoutChime = (symbol: string) => {
    try {
      const AudioCtxConstructor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxConstructor) return;
      const ctx = new AudioCtxConstructor();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      const playTone = (freq: number, startTime: number, duration: number, type: 'sine' | 'triangle' = 'sine') => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Play major pentatonic arpeggio (sweet futuristic crypto terminal sounds)
      playTone(523.25, now, 0.22, 'sine');         // C5
      playTone(587.33, now + 0.08, 0.22, 'sine');   // D5
      playTone(659.25, now + 0.16, 0.25, 'sine');   // E5
      playTone(783.99, now + 0.24, 0.35, 'sine');   // G5
      playTone(880.00, now + 0.32, 0.45, 'sine');   // A5
      playTone(1046.50, now + 0.40, 0.70, 'sine');   // C6 (Climax pin)

    } catch (err) {
      console.warn('Web Audio Playback failed or blocked:', err);
    }
  };
  
  // Custom Token Creator Form State
  const [showCreatorForm, setShowCreatorForm] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customSymbol, setCustomSymbol] = useState<string>('');
  const [customAddress, setCustomAddress] = useState<string>('');
  const [customPlatform, setCustomPlatform] = useState<'pump.fun' | 'raydium'>('pump.fun');
  const [customSecurityProfile, setCustomSecurityProfile] = useState<'safe' | 'scam'>('safe');
  const [creationStatus, setCreationStatus] = useState<string | null>(null);

  // Search/Filters configuration state
  const [filters, setFilters] = useState<ScreenerFilters>({
    riskTolerance: 'all',
    minSecurityScore: 0,
    minBondingProgress: 0,
    platform: 'all',
    sortBy: 'breakoutProbability',
    searchQuery: '',
  });

  // Calculate live executive figures based on reactive state
  const stats = useMemo(() => calculateExecutiveStats(coins), [coins]);

  // Retrieve current active coin object for detailed inspections, using a ref buffer so they don't vanish if they fall out of filters
  const prevSelectedCoinRef = useRef<MemeCoin | null>(null);
  
  const selectedCoin = useMemo(() => {
    if (!selectedCoinId) {
      prevSelectedCoinRef.current = null;
      return null;
    }
    const found = coins.find(coin => coin.id === selectedCoinId) || (selectedExternalCoin?.id === selectedCoinId ? selectedExternalCoin : null);
    if (found) {
      prevSelectedCoinRef.current = found;
      return found;
    }
    return prevSelectedCoinRef.current;
  }, [coins, selectedCoinId, selectedExternalCoin]);

  // Calculate dynamic scam-ratio percentage of pool (securityScore < 40)
  const scamRatioPercent = useMemo(() => {
    if (coins.length === 0) return 0;
    const countScams = coins.filter(c => c.securityScore < 40).length;
    return Math.round((countScams / coins.length) * 100);
  }, [coins]);

  const [activeFeedTab, setActiveFeedTab] = useState<'unverified' | 'verified' | 'fresh'>('fresh');

  // Terminal box automatic scrolling ref
  const terminalLogsRef = useRef<HTMLDivElement>(null);

  const handleSelectCoin = (coin: MemeCoin) => {
    setSelectedCoinId(coin.id === selectedCoinId ? '' : coin.id);
  }

  const handleBuyCoin = (coin: MemeCoin) => {
    setTerminalMint(coin.address);
    setShowTerminalModal(true);
  };

  // Auto-scroll log console
  useEffect(() => {
    if (terminalLogsRef.current) {
      terminalLogsRef.current.scrollTop = terminalLogsRef.current.scrollHeight;
    }
  }, [logs]);

  // Global Price & Status Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setCoins(currentCoins => {
        const { updatedCoins, log } = simulateCoinTick(currentCoins);
        
        // If simulation produced a log update, prepend it to console logs
        if (log) {
          setLogs(prev => [log, ...prev].slice(0, 30));
        }
        
        return updatedCoins;
      });
    }, 4000); // Trigger Tick event every 4 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Scan for hot breakout coins and play alert
  useEffect(() => {
    if (!audioEnabled) return;
    
    // Find coins that fit the hot breakout criteria (100x breakout prospects)
    const currentHotCoins = coins.filter(
      c => c.combinedScore >= 90 && c.securityScore >= 75 && c.breakoutProbability >= 90
    );
    
    // Find any new breakout that hasn't played an alarm yet
    const newHotCoinObj = currentHotCoins.find(c => !notifiedSymbols.includes(c.symbol));
    
    if (newHotCoinObj) {
      // Direct Web Audio trigger
      playHotBreakoutChime(newHotCoinObj.symbol);
      
      // Cache symbol to avoid spam
      setNotifiedSymbols(prev => [...prev, newHotCoinObj.symbol]);
      
      // Append a global trigger alert badge in state
      setAlerts(prev => {
        if (!prev.includes(newHotCoinObj.symbol)) {
          return [...prev, newHotCoinObj.symbol];
        }
        return prev;
      });

      // Write beautiful live logs feedback
      const alertTime = new Date().toLocaleTimeString();
      const audioLog: SystemLog = {
        id: 'aud-' + Math.random().toString(36).substring(2, 6),
        timestamp: alertTime.substring(0, 8),
        type: 'alert',
        message: `📢 [AUDIO ALERT] High breakout metrics confirmed for $${newHotCoinObj.symbol}! Combined Tracker score: ${newHotCoinObj.combinedScore}, breakout prob: ${newHotCoinObj.breakoutProbability}%. Audio alarm triggered.`
      };
      setLogs(prev => [audioLog, ...prev]);
    }
    
    // Clean symbols that drop below metrics to enable re-alerting if they pump back up
    const cleanedNotified = notifiedSymbols.filter(symbol => 
      coins.some(c => c.symbol === symbol && c.combinedScore >= 90 && c.securityScore >= 75 && c.breakoutProbability >= 90)
    );
    
    if (cleanedNotified.length !== notifiedSymbols.length) {
      setNotifiedSymbols(cleanedNotified);
    }
  }, [coins, audioEnabled, notifiedSymbols]);

  // Filter processing pipeline on reactive items
  const filteredAndSortedCoins = useMemo(() => {
    return coins
      .filter(coin => {
        // Query search
        const query = filters.searchQuery.toLowerCase().trim();
        if (query) {
          const matchAddress = coin.address.toLowerCase().includes(query);
          const matchSymbol = coin.symbol.toLowerCase().includes(query);
          const matchName = coin.name.toLowerCase().includes(query);
          if (!matchAddress && !matchSymbol && !matchName) return false;
        }

        // Platform filter
        if (filters.platform === 'pump.fun' && coin.platform !== 'pump.fun') return false;
        if (filters.platform === 'dexes' && coin.platform === 'pump.fun') return false;

        // Custom minimum filters
        if (coin.securityScore < filters.minSecurityScore) return false;

        if (coin.isBondingCurve && coin.bondingCurveProgress < filters.minBondingProgress) return false;

        // Risk tolerance filters
        if (filters.riskTolerance === 'conservative') {
          // Hide any coin with low safety score or active threat indices
          if (coin.securityScore < 80) return false;
          if (!coin.mintRenounced || !coin.freezeAuthorityRenounced) return false;
        } else if (filters.riskTolerance === 'aggressive') {
          // Hide coins with extreme threat patterns
          if (coin.securityScore < 50) return false;
        } else if (filters.riskTolerance === 'all') {
          // Default baseline: Show all tokens that show any remote promise of blowing up, even if unverified.
          // Filter out ONLY absolute garbage (zero velocity/socials and garbage security)
          const absoluteGarbage = coin.securityScore < 20 && coin.velocityScore < 20 && coin.socialScore < 20;
          if (absoluteGarbage) return false;
        }

        // --- Expert Intelligence Radar Filters ---
        if (filters.expertAntiRugOnly) {
          // Enforce ultra-safe contract traits: 0 flags, low concentration, locked LP
          if (coin.securityScore < 80) return false;
          if (coin.redFlagsCount > 0) return false;
          if (!coin.mintRenounced || !coin.freezeAuthorityRenounced || !coin.liquidityLockedOrBurnt) return false;
          if (coin.holderDistribution.top10HoldersPercent > 20) return false;
        }

        if (filters.expertHighVelocityOnly) {
          // Require extreme buyer inflow velocity
          if (coin.velocityScore < 80) return false;
        }

        if (filters.expertSocialHypeOnly) {
          // Require powerful social volume and positive sentiment
          if (coin.socialScore < 80) return false;
          if (coin.socials.sentimentScore < 75) return false;
        }

        if (filters.expertGoldenTicketOnly) {
          // Golden target filters of pristine security and breakout momentum
          if (coin.securityScore < 85) return false;
          if (coin.combinedScore < 80) return false;
          if (coin.breakoutProbability < 85) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Dynamic sorting metrics
        const property = filters.sortBy;
        return b[property] - a[property];
      });
  }, [coins, filters]);

  // Real live API refresh using DexScreener
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    // Add loading indicator log
    const timestamp = new Date().toLocaleTimeString('en-US', {hour12: false}).substring(0, 8);
    setLogs(prev => [{
      id: 'load-' + Math.random().toString(36).substring(2, 5),
      timestamp,
      type: 'info',
      message: '⚙️ [SYNC INITIATED] Connecting to DexScreener & Alpha Pump indexing APIs...'
    }, ...prev]);

    try {
      const { liveCoins, logs: fetchLogs } = await fetchLiveTokens();
      
      if (liveCoins.length > 0) {
        setCoins(current => {
          // Merge the new coins, replacing existing symbols, avoiding duplicates
          const newIds = new Set(liveCoins.map(c => c.id));
          const newSymbols = new Set(liveCoins.map(c => c.symbol));
          const filteredCurrent = current.filter(c => !newIds.has(c.id) && !newSymbols.has(c.symbol));
          // Sort the massive combined payload using the combined metrics
          return [...liveCoins, ...filteredCurrent].sort((a,b) => b.combinedScore - a.combinedScore).slice(0, 200);
        });
      }
      
      setLogs(prev => [...fetchLogs, ...prev].slice(0, 50));
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  };

  // Automatically update the tokens index from Dex Screener live data every 45 seconds
  useEffect(() => {
    // Do an immediate pull on component mount
    handleForceRefresh();
    
    // Setup interval loop
    const syncInterval = setInterval(() => {
      handleForceRefresh();
    }, 8000); // 8 seconds!

    return () => clearInterval(syncInterval);
  }, []);

  // Add simulated Alert configs
  const handleAddAlert = (symbol: string) => {
    if (alerts.includes(symbol)) return;
    setAlerts(prev => [...prev, symbol]);
    
    const timestamp = new Date().toISOString().substring(11, 19);
    const alertLog: SystemLog = {
      id: 'alrt-' + Math.random().toString(36).substring(2, 5),
      timestamp,
      type: 'alert',
      message: `🔔 [ALERT SECURED] Trigger configured for $${symbol} to monitor 10% price fluctuations.`
    };
    setLogs(prev => [alertLog, ...prev]);
  };

  // Clear configured price alerts
  const handleClearAlerts = () => {
    setAlerts([]);
    const timestamp = new Date().toISOString().substring(11, 19);
    setLogs(prev => [{
      id: 'clr-' + Math.random().toString(36).substring(2, 5),
      timestamp,
      type: 'info',
      message: '🧹 [ALERT CLEAR] Discarded all active price triggers from local session state.'
    }, ...prev]);
  };

  // Simulated Registry function for launching custom tokens to see the tracker score them
  const handleCreateCustomToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customSymbol) {
      setCreationStatus('Name and Ticker are required.');
      return;
    }

    const nextId = (coins.length + 1).toString();
    // Providing a valid real fallback address so Phantom test works
    const tokenAddress = customAddress || '8uYXZ2B3S1p7mNQs3B6Q9N8J4TpK4M1rL3S2Ppump';
    const nowTime = new Date().toISOString().substring(11, 19);

    // Differentiate security profiles based on selected parameters
    const isSafe = customSecurityProfile === 'safe';
    const safetyScore = isSafe ? 96 : 14;
    const velocity = 82;
    const social = 75;
    
    // Scorer calculation
    let calculatedCombined = Math.round((velocity * 0.45) + (social * 0.35) + (safetyScore * 0.20));
    if (!isSafe) {
      calculatedCombined = Math.min(32, calculatedCombined); // Apply strict Anti-scam capping limits
    }

    const breakoutProb = Math.min(99, Math.ceil(calculatedCombined * 1.03));

    const newMeme: MemeCoin = {
      id: nextId,
      name: customName,
      symbol: customSymbol.toUpperCase(),
      address: tokenAddress,
      platform: customPlatform,
      priceUsd: customPlatform === 'pump.fun' ? 0.00012 : 0.0042,
      priceChange1h: 15.0,
      priceChange24h: 15.0,
      volume1h: 34000,
      volume5m: 4500,
      liquidityUsd: isSafe ? 25000 : 3800,
      marketCapUsd: isSafe ? 120000 : 25000,
      isBondingCurve: customPlatform === 'pump.fun',
      bondingCurveProgress: customPlatform === 'pump.fun' ? 20.0 : 100,
      isKingOfTheHill: false,
      mintRenounced: isSafe,
      freezeAuthorityRenounced: isSafe,
      liquidityLockedOrBurnt: isSafe,
      liquidityLockPercent: isSafe ? 100 : 0,
      creatorWalletBehavior: isSafe ? 'neutral' : 'suspicious',
      holderDistribution: {
        top10HoldersPercent: isSafe ? 14.5 : 84.2,
        creatorHoldingPercent: isSafe ? 0.5 : 24.0,
      },
      uniqueBuyers3m: isSafe ? 25 : 3,
      creatorDeployedRugCount: isSafe ? 0 : 2,
      socials: {
        twitterFollowers: 1400,
        twitterEngagementRate: 5.2,
        influencerMentionsCount: isSafe ? 4 : 0,
        sentimentScore: isSafe ? 80 : 15,
        tweetVolume24h: 110,
      },
      velocityScore: velocity,
      securityScore: safetyScore,
      socialScore: social,
      combinedScore: calculatedCombined,
      breakoutProbability: breakoutProb,
      priceHistory5m: customPlatform === 'pump.fun' ? [0.00009, 0.00010, 0.00010, 0.00011, 0.00012, 0.00012] : [0.0039, 0.0041, 0.0040, 0.0041, 0.0042, 0.0042],
      createdTimeAgo: 'Just now',
      ageInMinutes: 0,
      scannedTime: nowTime,
      topAuditsPassed: isSafe ? ['Mint Authority Disabled', 'LP Burn Verified', 'Distributed Holders'] : ['Scan Initialized'],
      redFlagsCount: isSafe ? 0 : 4,
      redFlagsList: isSafe ? [] : [
        'Mint authority is ACTIVE (owner can mint coins endlessly)',
        'Freeze authority is ENABLED (creator can freeze buyer funds)',
        'LP Liquidity sits unlocked in creator main wallet',
        'Developer has historic cluster links to 4 previously pulled tokens'
      ],
      passesRugCheck: isSafe,
      isSafe: isSafe
    };

    setCoins(current => [newMeme, ...current]);
    setSelectedCoinId(nextId);
    
    // Add success log
    setLogs(prev => [{
      id: 'reg-' + Math.random().toString(36).substring(2, 5),
      timestamp: nowTime,
      type: isSafe ? 'success' : 'alert',
      message: `🎯 [LAUNCH TELEMETRY] Custom token unregistered slot loaded. $${newMeme.symbol} is actively parsed by Scoring Engine.`
    }, ...prev]);

    // Reset Form fields
    setCustomName('');
    setCustomSymbol('');
    setCustomAddress('');
    setCreationStatus(`Registered $${newMeme.symbol} successfully! Added to tracker table.`);
    setTimeout(() => {
      setCreationStatus(null);
      setShowCreatorForm(false);
    }, 2500);
  };

  if (currentPage === 'about') return <AboutPage onBack={() => setCurrentPage('home')} />;
  if (currentPage === 'privacy') return <PrivacyPage onBack={() => setCurrentPage('home')} />;
  if (currentPage === 'terms') return <TermsPage onBack={() => setCurrentPage('home')} />;

  return (
    <div className={`min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-neutral-950 text-white selection:bg-emerald-500 selection:text-neutral-950 font-sans flex flex-col gap-4 sm:gap-6 overscroll-none p-2 sm:p-4`}>
      {/* Background Underlay to prevent white overscroll */}
      <div className="fixed inset-0 bg-neutral-950 -z-50 pointer-events-none" />
      
      {/* 1. Header Toolbar Console */}
      <header id="primary-header-rail" className="glass-panel rounded-xl px-4 py-3 sm:px-5 sm:py-4 w-full flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-start lg:items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="hidden sm:flex p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl animate-pulse shrink-0 mt-1 lg:mt-0">
            <Zap size={22} className="fill-emerald-400" />
          </div>
          <div className="flex flex-col gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] text-emerald-400 font-mono tracking-wider font-bold border border-emerald-500/40 bg-emerald-500/5 px-1.5 py-0.5 rounded">
                PRO TERMINAL v3.1
              </span>
              <span className="text-[10px] sm:text-xs text-neutral-500 font-mono flex items-center gap-1.5 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Solana Mainnet Live
              </span>
            </div>
            
            <div className="flex flex-col xl:flex-row xl:items-center gap-3 xl:gap-5 w-full">
              <div className="flex items-center gap-2">
                <img src="/favicon.svg" alt="Alpha Pump Logo" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight font-sans text-white shrink-0">
                  Alpha Pump
                </h1>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Active alerts counter badge */}
                {alerts.length > 0 && (
                  <div id="alerts-notifier-pill" className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] sm:text-xs font-mono shrink-0">
                    <BellRing size={13} className="animate-bounce" />
                    <span>{alerts.length} Triggers Active</span>
                    <button 
                      onClick={handleClearAlerts}
                      className="text-neutral-500 hover:text-white ml-1 underline cursor-pointer text-[10px]"
                      title="Discard active alerts"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Audio Alarms controls */}
                <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800 shrink-0">
                  <button
                    id="toggle-audio-alerts"
                    onClick={() => {
                      const nextEnabled = !audioEnabled;
                      setAudioEnabled(nextEnabled);
                      if (nextEnabled) {
                        playHotBreakoutChime('TEST');
                      }
                    }}
                    className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      audioEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                        : 'text-neutral-500 hover:text-neutral-400'
                    }`}
                    title="Toggle sound alarms on breakout signals"
                  >
                    {audioEnabled ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Audio: ON 🔉</span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-600"></span>
                        <span>Audio: OFF 🔇</span>
                      </>
                    )}
                  </button>
                  <div className="w-px h-4 bg-neutral-800 hidden sm:block"></div>
                  
                  {audioEnabled && (
                    <button
                      id="test-audio-chime-btn"
                      onClick={() => playHotBreakoutChime('TEST')}
                      className="hover:bg-neutral-800 text-[9px] font-mono font-bold px-2 py-1 text-neutral-400 hover:text-white rounded transition-all cursor-pointer border border-neutral-800"
                      title="Test sound pitch"
                    >
                      TEST CHIME
                    </button>
                  )}
                </div>
                
                {/* Core feed simulator controls */}
                <button
                  id="pause-simulation-button"
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`p-1.5 sm:p-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                    isSimulating
                      ? 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 border-emerald-600'
                  }`}
                  title={isSimulating ? "Pause Feed Sim" : "Resume Feed Sim"}
                >
                  {isSimulating ? (
                    <Pause size={14} className="fill-neutral-300" />
                  ) : (
                    <Play size={14} className="fill-neutral-950" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic global tickers & feeds panel */}
        <div className="flex items-center gap-3 w-full lg:w-auto lg:justify-end border-t border-neutral-800/50 pt-3 lg:border-t-0 lg:pt-0">
          <button
            onClick={() => setShowTokenSearchModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer bg-neutral-900 border border-neutral-800 text-sky-400 hover:text-white hover:bg-sky-500/10 hover:border-sky-400 shrink-0"
            title="Search and Buy any coin on Solana"
          >
            <Search size={14} /> SEARCH MEME COINS
          </button>
          
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Alpha Pump is the very best app for finding the best meme coins on the market! https://www.alphapump.online/")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 sm:p-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer bg-neutral-900 border border-neutral-800 text-white hover:border-neutral-500 shrink-0"
            title="Share on X"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          
          {user && profile ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowProfile(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-emerald-500/50 shrink-0"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0">
                  {profile.profileImage ? (
                    <img src={profile.profileImage} alt={profile.username} className="w-full h-full object-cover" />
                  ) : (
                    profile.username.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="truncate max-w-[150px]">{profile.username}</span>
              </button>
              <button
                onClick={() => {
                  setTerminalMint('');
                  setShowTerminalModal(true);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0"
                title="Deposit Funds"
              >
                <Plus size={18} className="stroke-[3]" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] uppercase shrink-0"
            >
              <UserIcon size={14} /> SIGN IN
            </button>
          )}
        </div>
      </header>

      {/* 2. Live Executive Metric Cards Row */}
      <MetricHeader 
        stats={stats} 
        isSimulating={isSimulating} 
        onForceRefresh={handleForceRefresh}
        coinsCount={coins.length}
      />

      {/* 3. Primary Screener Workstation Columns */}
      <div id="workspace-layout-split" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WIDE COLUMN (Left - 2cols): Risk controls and alpha table */}
        <div id="workspace-screener-col" className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Advanced Risk controls */}
          <div className="glass-panel rounded-xl overflow-hidden text-sm">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full px-4 py-3 flex items-center justify-between text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-2 font-mono font-bold">
                <ShieldCheck size={16} className="text-emerald-500" />
                Advanced Filters & Adjustments
              </div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider">{showFilters ? 'Hide' : 'Expand'}</span>
            </button>
            {showFilters && (
              <div className="border-t border-neutral-800">
                <RiskFilters filters={filters} onFilterChange={setFilters} />
              </div>
            )}
          </div>

          {/* Tabs for Verified vs Unverified */}
          <div className="flex border-b border-neutral-800 mb-2 items-center justify-between">
            <div className="flex">
              <button
                onClick={() => setActiveFeedTab('fresh')}
                className={`pb-3 px-2 sm:px-4 text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFeedTab === 'fresh'
                    ? 'border-b-2 border-emerald-500 text-emerald-400'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Fresh {"< 1h"}
              </button>
              <button
                onClick={() => setActiveFeedTab('unverified')}
                className={`pb-3 px-2 sm:px-4 text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFeedTab === 'unverified'
                    ? 'border-b-2 border-emerald-500 text-emerald-400'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Unverified Gems
              </button>
              <button
                onClick={() => setActiveFeedTab('verified')}
                className={`pb-3 px-2 sm:px-4 text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFeedTab === 'verified'
                    ? 'border-b-2 border-emerald-500 text-emerald-400'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Verified
              </button>
            </div>
            
            {/* Refresh List Button */}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center p-2 glass-panel hover:border-emerald-500 hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors uppercase tracking-wider text-[10px] font-mono font-bold rounded mb-2 group"
              title="Refresh List"
            >
              <RefreshCw size={14} className="group-hover:animate-spin" />
            </button>
          </div>

          {/* Screener table feed */}
          <div>
            {isInitialLoad ? (
              <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-xl space-y-4">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-neutral-400 font-mono text-sm animate-pulse">Initializing Terminal &amp; Fetching Global APIS...</p>
              </div>
            ) : (
              <>
                {activeFeedTab === 'fresh' && (
                  <>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-300 font-mono mb-3 flex items-center gap-2">
                      <Zap className="text-sky-400" size={16} />
                      <span className="truncate">Fresh Coins {"< 1 Hour Old"} for Quick Buy & Sells</span>
                    </h3>
                    <ScreenerTable 
                      coins={filteredAndSortedCoins
                        .filter(c => c.ageInMinutes < 60)
                        .sort((a,b) => b.velocityScore - a.velocityScore)
                      } 
                      onSelectCoin={handleSelectCoin}
                      onBuyCoin={handleBuyCoin}
                      onPremiumBlocked={() => setShowPremiumModal(true)}
                      selectedCoinId={selectedCoinId}
                    />
                  </>
                )}

                {activeFeedTab === 'unverified' && (
                  <>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-300 font-mono mb-3 flex items-center gap-2">
                      <Activity className="text-amber-400" size={16} />
                      <span className="truncate">Showing strictly unverified breakout tokens (1hr+)</span>
                    </h3>
                    <ScreenerTable 
                      coins={filteredAndSortedCoins.filter(c => !c.isSafe && c.passesRugCheck && c.ageInMinutes >= 60)} 
                      onSelectCoin={handleSelectCoin}
                      onBuyCoin={handleBuyCoin}
                      onPremiumBlocked={() => setShowPremiumModal(true)}
                      selectedCoinId={selectedCoinId}
                    />
                  </>
                )}

                {activeFeedTab === 'verified' && (
                  <>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-300 font-mono mb-3 flex items-center gap-2">
                      <ShieldCheck className="text-emerald-400" size={16} />
                      <span className="truncate">All Verified & Monitored Signals (1hr+)</span>
                    </h3>
                    <ScreenerTable 
                      coins={filteredAndSortedCoins.filter(c => c.isSafe && c.ageInMinutes >= 60)} 
                      onSelectCoin={handleSelectCoin}
                      onBuyCoin={handleBuyCoin}
                      onPremiumBlocked={() => setShowPremiumModal(true)}
                      selectedCoinId={selectedCoinId}
                    />
                  </>
                )}
              </>
            )}
          </div>

          {/* Quick interactive sandbox: Register Custom Coin for telemetry parsing */}
          <div className="glass-panel rounded-xl p-5">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold font-sans flex items-center gap-1.5">
                  <Plus className="text-emerald-400" size={16} />
                  Register Sandbox Token Telemetry
                </h4>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Simulate launching custom micro-assets to examine safety rating weights and capping penalties.
                </p>
              </div>
              <button
                id="toggle-creation-form"
                onClick={() => setShowCreatorForm(!showCreatorForm)}
                className="bg-neutral-800 border border-neutral-700 font-mono text-xs px-3.5 py-1.5 rounded-lg text-emerald-400 hover:bg-neutral-700 hover:text-white transition-all cursor-pointer"
              >
                {showCreatorForm ? 'Cancel Entry' : 'Configure Sandbox Mint'}
              </button>
            </div>

            {showCreatorForm && (
              <form onSubmit={handleCreateCustomToken} className="mt-4 pt-4 border-t border-neutral-800/80 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-neutral-400 uppercase">Token Common Name</label>
                    <input
                      id="custom-coin-name"
                      type="text"
                      placeholder="e.g. Flappy Doge"
                      className="bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded py-1.5 px-3 text-xs outline-none text-white font-mono"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Symbol Ticker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-neutral-400 uppercase">Ticker Symbol</label>
                    <input
                      id="custom-coin-symbol"
                      type="text"
                      placeholder="e.g. FLAP"
                      className="bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded py-1.5 px-3 text-xs outline-none text-emerald-400 font-mono uppercase"
                      value={customSymbol}
                      onChange={(e) => {
                        if (e.target.value.length <= 8) setCustomSymbol(e.target.value);
                      }}
                      required
                    />
                  </div>

                  {/* Custom Contract address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-neutral-400 uppercase">Mock Address (Optional)</label>
                    <input
                      id="custom-coin-address"
                      type="text"
                      placeholder="e.g. 5xR8p...pump"
                      className="bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded py-1.5 px-3 text-xs outline-none text-white font-mono"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  {/* Plat select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-neutral-400 uppercase">LP Platform Launching</label>
                    <div className="grid grid-cols-2 bg-neutral-950 border border-neutral-800 p-1 rounded gap-1">
                      <button
                        type="button"
                        onClick={() => setCustomPlatform('pump.fun')}
                        className={`py-1 text-center font-mono text-[10px] rounded cursor-pointer ${
                          customPlatform === 'pump.fun' ? 'bg-neutral-800 font-bold text-purple-300' : 'text-neutral-500'
                        }`}
                      >
                        Pump.fun curve (20% init)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomPlatform('raydium')}
                        className={`py-1 text-center font-mono text-[10px] rounded cursor-pointer ${
                          customPlatform === 'raydium' ? 'bg-neutral-800 font-bold text-blue-300' : 'text-neutral-500'
                        }`}
                      >
                        Raydium open pool
                      </button>
                    </div>
                  </div>

                  {/* Security Select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-neutral-400 uppercase">Security Threat Profile</label>
                    <div className="grid grid-cols-2 bg-neutral-950 border border-neutral-800 p-1 rounded gap-1">
                      <button
                        type="button"
                        onClick={() => setCustomSecurityProfile('safe')}
                        className={`py-1 text-center font-mono text-[10px] rounded cursor-pointer ${
                          customSecurityProfile === 'safe' ? 'bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/30' : 'text-neutral-500'
                        }`}
                      >
                        Verified Code Base (Safe)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomSecurityProfile('scam')}
                        className={`py-1 text-center font-mono text-[10px] rounded cursor-pointer ${
                          customSecurityProfile === 'scam' ? 'bg-rose-950 text-rose-400 font-bold border border-rose-800/30 animate-pulse' : 'text-neutral-500'
                        }`}
                      >
                        Dangerous Threat LP (Risky)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/40">
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {customSecurityProfile === 'safe' 
                      ? '🔒 Clean audit report will be dispatched on launch: renounced contract, low dev pre-mine.' 
                      : '⚠️ Honeypot threat preset enabled: Mint active, freeze authority live, LP unburnt.'}
                  </span>
                  <button
                    id="submit-register-custom-token"
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold font-mono text-xs px-5 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Simulate Live Launch!
                  </button>
                </div>
              </form>
            )}

            {creationStatus && (
              <div id="creation-feedback-banner" className="mt-3 bg-emerald-950/20 border border-emerald-800/30 p-2 rounded text-xs text-emerald-300 font-mono text-center">
                {creationStatus}
              </div>
            )}
          </div>

          {/* Educational Scoring docs */}
          <ScoringDocs />
        </div>

        {/* NARROW COLUMN (Right - 1col): Diagnostic log terminal */}
        <div id="workspace-sidebar-col" className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Scanners Live Heuristic Terminal (Logs) */}
          <div id="heuristics-log-monitor" className="glass-panel rounded-xl flex flex-col min-h-[50px] overflow-hidden">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full p-4 flex justify-between items-center hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="text-emerald-400" size={15} />
                <span className="text-xs font-bold font-mono uppercase tracking-widest text-neutral-300">
                  Heuristic Diagnostic Log
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wide">
                    FEED ON
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 tracking-wider bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">{showLogs ? 'HIDE' : 'SHOW'}</span>
              </div>
            </button>
            
            {showLogs && (
              <div className="flex flex-col gap-3.5 p-4 border-t border-neutral-800">
                {/* Real-time Risk Heatmap Visual Panel */}
                <div id="risk-heatmap-display" className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                    <span className="text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Activity size={12} className="text-rose-400" />
                      Mempool Risk Heatmap
                    </span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${
                      scamRatioPercent > 35 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : scamRatioPercent > 15 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {scamRatioPercent}% threat exposure
                    </span>
                  </div>
                  
                  {/* Heat bar gradient slider with dynamic pin needle */}
                  <div className="relative w-full h-3 bg-neutral-900 rounded overflow-hidden border border-neutral-800 flex">
                    <div className="w-1/3 h-full bg-emerald-500/15"></div>
                    <div className="w-1/3 h-full bg-amber-500/15"></div>
                    <div className="w-1/3 h-full bg-rose-500/20"></div>
                    
                    {/* Visual red overlay matching risk ratio */}
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-rose-500/15 transition-all duration-500" 
                      style={{ width: `${scamRatioPercent}%` }}
                    />
                    
                    {/* Heat index slide marker pin */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_#ffffff] transition-all duration-500"
                      style={{ left: `calc(${scamRatioPercent}% - 2px)` }}
                    />
                  </div>
                  
                  {/* Segments counting legend */}
                  <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Safe ({coins.filter(c => c.securityScore >= 75).length})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Caution ({coins.filter(c => c.securityScore >= 40 && c.securityScore < 75).length})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      Threats ({coins.filter(c => c.securityScore < 40).length})
                    </span>
                  </div>
                </div>

                {/* Simulated Live logs sandbox terminal container */}
                <div
                  id="terminal-logs-window"
                  ref={terminalLogsRef}
                  className="flex-1 bg-neutral-950 p-3 rounded-lg font-mono text-[10px] leading-tight overflow-y-auto space-y-2 select-all h-64 max-h-[350px] border border-neutral-800/60 scrollbar-thin"
                >
                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-2 items-start border-b border-neutral-900/40 pb-1.5">
                      <span className="text-neutral-500 shrink-0 select-none">[{log.timestamp}]</span>
                      <span className={`leading-normal ${
                        log.type === 'success' 
                          ? 'text-emerald-400' 
                          : log.type === 'warning' 
                            ? 'text-rose-400' 
                            : log.type === 'alert'
                              ? 'text-amber-400 font-semibold'
                              : 'text-neutral-300'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono pt-1">
                  <span>Automatic clearing is set to Capped 30 Logs</span>
                  <button
                    id="clear-logs-button"
                    onClick={() => setLogs([])}
                    className="text-[10px] text-neutral-400 hover:text-emerald-400 underline transition-all cursor-pointer"
                  >
                    Clear Terminal Screen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Branding Acknowledgement */}
      <footer id="branding-footer" className="bg-neutral-900/40 border border-neutral-800/50 rounded-xl p-4 text-center text-xs font-mono text-neutral-500 mt-2 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>Developed to meet professional decentralized exchange audit specifications.</span>
        <div className="flex items-center gap-4 text-neutral-400">
          <button onClick={() => setCurrentPage('about')} className="hover:text-emerald-400 transition-colors">About Us</button>
          <button onClick={() => setCurrentPage('privacy')} className="hover:text-emerald-400 transition-colors">Privacy Policy</button>
          <button onClick={() => setCurrentPage('terms')} className="hover:text-emerald-400 transition-colors">Terms of Service</button>
        </div>
        <span className="text-neutral-500 flex items-center gap-1.5">
          <Globe size={11} className="text-emerald-500" />
          <span>Solana Heuristics Client Core &bull; Secured by Alpha Pump & DexScreener</span>
        </span>
      </footer>

      <ContactFloatingButton />

      {/* Modal for viewing coin details without jumping screen */}
      {selectedCoin && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm shadow-2xl overflow-y-auto"
          onClick={() => setSelectedCoinId('')}
        >
          <div 
            className="w-full max-w-4xl bg-neutral-900 rounded-xl border border-neutral-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden" 
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="flex-1 overflow-y-auto hide-scrollbar">
               <InspectorDrawer 
                 coin={selectedCoin} 
                 onClose={() => setSelectedCoinId('')}
                 onAddAlert={handleAddAlert}
                 onOpenTerminal={(mint) => {
                   setTerminalMint(mint);
                   setShowTerminalModal(true);
                 }}
               />
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm shadow-2xl">
          <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full relative overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.15)] auto-fade-in relative z-10 flex flex-col items-center">
            <button 
              onClick={() => setShowPremiumModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white bg-neutral-800 hover:bg-neutral-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow"
            >
              x
            </button>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="text-xl font-bold font-sans text-center mb-2">Unlock the Best Coins</h2>
            <p className="text-neutral-400 text-sm text-center mb-6">
              You must buy Premium to view the very best, most promising coins on the market and get an improved experience.
            </p>
            
            <div className="w-full bg-neutral-950 rounded-xl p-4 mb-6 border border-neutral-800">
               <div className="flex justify-between items-center mb-1">
                 <span className="font-mono text-emerald-400 font-bold">Premium Access</span>
                 <span className="font-mono text-white">$4.99 <span className="text-neutral-500 text-xs">/ week</span></span>
               </div>
               <ul className="text-xs font-mono text-neutral-400 mt-3 space-y-2">
                 <li className="flex items-center gap-2"><Check size={12} className="text-emerald-500" /> View all Golden Targets</li>
                 <li className="flex items-center gap-2"><Check size={12} className="text-emerald-500" /> See exact breakout predictions &gt; 85%</li>
               </ul>
            </div>
            
            <button 
              onClick={async () => {
                 if (!user) {
                   setShowPremiumModal(false);
                   setShowAuthModal(true);
                   return;
                 }
                 try {
                    const res = await fetch('/api/create-checkout-session', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ uid: user.uid, username: profile?.username || 'User' })
                    });
                    const data = await res.json();
                    if (data.url) {
                       // Fix for Stripe checkout in iframe (like AI Studio) returning blank page
                       if (window.self !== window.top) {
                         window.open(data.url, '_blank');
                       } else {
                         window.location.assign(data.url);
                       }
                    } else {
                       alert("Error checking out: " + (data.error || 'Unknown Error'));
                    }
                 } catch(e) {
                    alert("Failed to initiate checkout");
                 }
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold font-mono tracking-wider rounded-xl uppercase transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Get Premium Now
            </button>
          </div>
        </div>
      )}

      {showTerminalModal && (
        <TerminalModal 
          onClose={() => setShowTerminalModal(false)} 
          initialMint={terminalMint} 
        />
      )}

      {showTokenSearchModal && (
        <TokenSearchModal 
          onClose={() => setShowTokenSearchModal(false)}
          onSelectToken={(mint) => {
            setTerminalMint(mint);
            setShowTerminalModal(true);
          }}
        />
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showProfile && <ProfileDashboard onClose={() => setShowProfile(false)} onSelectCoin={(id) => {
        // If the coin isn't found in current state, we still try. 
        // We ensure we close profile first
        setShowProfile(false);
        setSelectedCoinId(id);
      }} onOpenSwap={(mint) => {
        setShowProfile(false);
        setTerminalMint(mint);
        setShowTerminalModal(true);
      }} />}
    </div>
  );
}
