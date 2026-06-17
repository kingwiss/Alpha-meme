export interface HolderDistribution {
  top10HoldersPercent: number;
  creatorHoldingPercent: number;
}

export interface SocialMetrics {
  twitterFollowers: number;
  twitterEngagementRate: number; // percentage
  influencerMentionsCount: number;
  sentimentScore: number; // 0 - 100
  tweetVolume24h: number;
}

export type CreatorBehavior = 'clean' | 'suspicious' | 'neutral' | 'first_timer';

export interface MemeCoin {
  id: string;
  name: string;
  symbol: string;
  address: string;
  platform: 'pump.fun' | 'raydium' | 'meteora';
  priceUsd: number;
  priceChange1h: number;
  priceChange24h: number;
  volume1h: number;
  volume5m: number;
  liquidityUsd: number;
  marketCapUsd: number;
  
  // Bonding Curve (Pump.fun specific)
  isBondingCurve: boolean;
  bondingCurveProgress: number; // 0 to 100
  isKingOfTheHill: boolean;
  
  // Security Auditing (Anti-rug checklist)
  mintRenounced: boolean;
  freezeAuthorityRenounced: boolean;
  liquidityLockedOrBurnt: boolean;
  liquidityLockPercent: number; // 0 to 100
  creatorWalletBehavior: CreatorBehavior;
  holderDistribution: HolderDistribution;
  uniqueBuyers3m: number;
  creatorDeployedRugCount: number;
  
  // Sentiments
  socials: SocialMetrics;
  
  // Metric Engine calculated fields
  velocityScore: number; // Transaction speed/buy pressure ratio (0-100)
  securityScore: number; // Smart filter security ranking (0-100)
  socialScore: number; // Social momentum and influencer tracking (0-100)
  combinedScore: number; // Main weighted alpha rating (0-100)
  breakoutProbability: number; // Percent chance of 100x breakout (0-100)
  
  // Historical snapshots (for charts / sparks)
  priceHistory5m: number[]; // Last 6 intervals
  
  // Metadata
  createdTimeAgo: string;
  ageInMinutes: number;
  createdAtMs?: number;
  scannedTime: string;
  topAuditsPassed: string[];
  redFlagsCount: number;
  redFlagsList: string[];
  passesRugCheck: boolean;
  isSafe: boolean;
}

export interface ExecutiveStats {
  totalScanned24h: number;
  averageBreakoutRiskScore: number;
  activeHighAlphaCount: number;
  totalMarketCapUsd: number;
  pumpMigrationsCount: number;
  totalLiquidityTracked: number;
  systemHealthState: 'optimal' | 'degraded' | 'scanning';
}

export interface ScreenerFilters {
  riskTolerance: 'all' | 'conservative' | 'aggressive' | 'degen';
  minSecurityScore: number;
  minBondingProgress: number;
  platform: 'all' | 'pump.fun' | 'dexes';
  sortBy: 'combinedScore' | 'breakoutProbability' | 'velocityScore' | 'marketCapUsd' | 'priceChange1h';
  searchQuery: string;
  expertAntiRugOnly?: boolean;
  expertHighVelocityOnly?: boolean;
  expertSocialHypeOnly?: boolean;
  expertGoldenTicketOnly?: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  message: string;
}

declare global {
  interface Window {
    Jupiter: any;
  }
}
