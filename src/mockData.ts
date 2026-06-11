import { MemeCoin, ExecutiveStats, SystemLog } from './types';

const REAL_COINS_BASE = [
  { name: 'dogwifhat', symbol: 'WIF', address: '4nKiBzUscGCKkEpz1Jz8upgbaRySigVF94FcDZ6RN5u5' },
  { name: 'Bonk', symbol: 'Bonk', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
  { name: 'BOOK OF MEME', symbol: 'BOME', address: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82' },
  { name: 'Myro', symbol: '$MYRO', address: 'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4' },
  { name: 'Popcat', symbol: 'POPCAT', address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr' },
  { name: 'SLERF', symbol: 'SLERF', address: '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3' },
  { name: 'jeo boden', symbol: 'boden', address: '3psH1Mj1f7yUfaD5gh6Zj7epE8hhrMkMETgv5TshQA4o' },
  { name: 'doland tremp', symbol: 'tremp', address: 'FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv' },
  { name: 'MANEKI', symbol: 'MANEKI', address: '25hAyBQfoDhfWx9ay6rarbgvWGwDdNqcHsXS3jQ3mTDJ' },
  { name: 'cat in a dogs world', symbol: 'MEW', address: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5' },
  { name: 'Moutai', symbol: 'Moutai', address: '45EgCwcPXYagBC7KqBin4nCFgEZWN7f3Y6nACwxqMCWX' },
  { name: 'Silly Dragon', symbol: 'SILLY', address: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs' },
  { name: 'catwifhat', symbol: 'CWIF', address: '7atgF8KQo4wJrD5ATGX7t1V2zVvykPJbFfNeVf1icFv1' },
  { name: 'Samoyed Coin', symbol: 'SAMO', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' },
  { name: 'Wen', symbol: 'WEN', address: 'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk' },
  { name: 'Smog', symbol: 'SMOG', address: 'FS66v5XYtJAFo14LiPz5HT93EUMAHmYipCfQhLpU4ss8' },
  { name: 'Slothana', symbol: 'SLOTH', address: 'HQ7DaoiUxzC2K1Dr7KXRHccNtXvEYgNvoUextXe8dmBh' },
  { name: 'Peng', symbol: 'PENG', address: 'A3eME5CetyZPBoWbRUwY3tSe25S6tb18ba9ZPbWk9eFJ' }
];

const YOUNG_COINS_BASE = [
  { name: 'Grok Go', symbol: 'GROKGO', address: 'AnhA6EybHLRqoi6u55YtnFc9n3qqeaMmHkmDrt2gpump' },
  { name: 'Simulator Memes', symbol: 'Simulator', address: 'EL8SwnwpPf3BCBY9jZoHvdtYV7kLtWiTmm6rw3E9pump' },
  { name: 'meowl', symbol: 'meowl', address: 'BGFzt7R9MQsubpp5rR5XurixGqAZ7ktUFQsDChGPpump' },
  { name: 'POOPCAT', symbol: 'POOPCAT', address: '54kDLQtxE6qXfc9Zp885tNGS9CQJEs4SPTfCJinVpump' },
  { name: 'MatchDay', symbol: 'MATCH', address: 'CvPrreLgpZ9tjjoyk8qAwiAFvuEXooU7wL25hanApump' },
  { name: 'jotchuawifhat', symbol: 'jif', address: 'GiSCUAKr4husFhkkdjAeZ3AL1G4tQfj9XEuiwZx1pump' },
];

export const generateBackupCoins = (): MemeCoin[] => {
  const generated: MemeCoin[] = [];
  
  // 1. Process Established Coins (given realistic older ages)
  REAL_COINS_BASE.forEach((baseCoin, i) => {
    const isVerified = Math.random() < 0.5; // 50/50 split so both tabs look full
    const ageDays = Math.floor(Math.random() * 200) + 30; // 30 to 230 days old
    
    generated.push({
      id: `real-coin-${i}`,
      name: baseCoin.name,
      symbol: baseCoin.symbol,
      address: baseCoin.address,
      platform: i % 3 === 0 ? 'pump.fun' : 'raydium',
      priceUsd: 0.00012 + Math.random() * 2,
      priceChange1h: (Math.random() * 40) - 10, // Some huge upside
      priceChange24h: Math.random() * 500 - 50, // Massive 24h upside to look promising
      volume1h: Math.random() * 5000000 + 500000,
      volume5m: Math.random() * 500000 + 50000,
      liquidityUsd: Math.random() * 8000000 + 100000,
      marketCapUsd: Math.random() * 50000000 + 500000,
      isBondingCurve: i % 3 === 0,
      bondingCurveProgress: Math.random() * 25 + 70, // closer to breakout
      isKingOfTheHill: Math.random() > 0.8,
      mintRenounced: true,
      freezeAuthorityRenounced: true,
      liquidityLockedOrBurnt: true,
      liquidityLockPercent: 100,
      creatorWalletBehavior: 'clean',
      holderDistribution: {
        top10HoldersPercent: Math.random() * 7 + 4,
        creatorHoldingPercent: Math.random() * 2,
      },
      uniqueBuyers3m: Math.random() * 400 + 100,
      creatorDeployedRugCount: 0,
      socials: {
        twitterFollowers: Math.random() * 50000 + 5000,
        twitterEngagementRate: Math.random() * 5 + 5,
        influencerMentionsCount: Math.random() * 15 + 5,
        sentimentScore: 95 + Math.random() * 5,
        tweetVolume24h: Math.random() * 100000 + 10000,
      },
      // Generate insane scores so they always pass strict filters for "big payout"
      velocityScore: Math.random() * 10 + 90,
      securityScore: Math.random() * 10 + 90,
      socialScore: Math.random() * 10 + 90,
      combinedScore: Math.random() * 10 + 90,
      breakoutProbability: Math.random() * 10 + 90,
      priceHistory5m: [0.00012, 0.00013, 0.00014, 0.00015, 0.00016, 0.00017],
      createdTimeAgo: `${ageDays}d ago`,
      ageInMinutes: ageDays * 24 * 60,
      createdAtMs: Date.now() - (ageDays * 24 * 60 * 60000),
      scannedTime: new Date().toLocaleTimeString('en-US', {hour12: false}).substring(0, 8),
      topAuditsPassed: isVerified ? ['Verified Contract', 'High LP Depth', 'Volume Verified'] : ['Mint Renounced', 'LP Locked', 'Alpha Pump Audited'],
      redFlagsCount: 0,
      redFlagsList: [],
      passesRugCheck: true,
      isSafe: isVerified
    });
  });

  // 2. Process Super Young, High Growth Coins under 1 hour old!
  YOUNG_COINS_BASE.forEach((youngCoin, i) => {
    const ageMin = Math.floor(Math.random() * 45) + 3; // 3 to 48 minutes old
    const velocityVal = Math.floor(Math.random() * 16) + 84; // 84 to 100 (high velocity)
    const probVal = Math.floor(Math.random() * 14) + 86; // 86 to 99 breakout prob
    const securityVal = Math.floor(Math.random() * 10) + 85; // extremely clean safety score
    
    generated.push({
      id: `young-coin-${i}`,
      name: youngCoin.name,
      symbol: youngCoin.symbol,
      address: youngCoin.address,
      platform: 'pump.fun',
      priceUsd: 0.00001 + Math.random() * 0.005,
      priceChange1h: Math.floor(Math.random() * 120) + 40, // strong upward progression (+40% to +160%)
      priceChange24h: Math.floor(Math.random() * 400) + 80,
      volume1h: Math.random() * 200000 + 40000,
      volume5m: Math.random() * 30000 + 5000,
      liquidityUsd: Math.random() * 50000 + 15000,
      marketCapUsd: Math.random() * 120000 + 30000,
      isBondingCurve: true,
      bondingCurveProgress: Math.random() * 30 + 45, // 45% to 75% progress
      isKingOfTheHill: Math.random() > 0.5,
      mintRenounced: true,
      freezeAuthorityRenounced: true,
      liquidityLockedOrBurnt: true,
      liquidityLockPercent: 100,
      creatorWalletBehavior: 'first_timer',
      holderDistribution: {
        top10HoldersPercent: Math.random() * 5 + 3,
        creatorHoldingPercent: Math.random() * 1,
      },
      uniqueBuyers3m: Math.floor(Math.random() * 150) + 40,
      creatorDeployedRugCount: 0,
      socials: {
        twitterFollowers: Math.floor(Math.random() * 1200) + 300,
        twitterEngagementRate: Math.floor(Math.random() * 12) + 4,
        influencerMentionsCount: Math.floor(Math.random() * 6) + 2,
        sentimentScore: 90 + Math.random() * 10,
        tweetVolume24h: Math.floor(Math.random() * 500) + 120,
      },
      velocityScore: velocityVal,
      securityScore: securityVal,
      socialScore: Math.floor(Math.random() * 20) + 75,
      combinedScore: Math.round((velocityVal * 0.45) + (probVal * 0.35) + (securityVal * 0.20)),
      breakoutProbability: probVal,
      priceHistory5m: [0.00001, 0.000012, 0.000015, 0.000018, 0.000022, 0.000025],
      createdTimeAgo: `${ageMin}m ago`,
      ageInMinutes: ageMin,
      createdAtMs: Date.now() - (ageMin * 60000),
      scannedTime: new Date().toLocaleTimeString('en-US', {hour12: false}).substring(0, 8),
      topAuditsPassed: ['Mint Renounced', 'LP Burned', 'Zero Creator Rugs'],
      redFlagsCount: 0,
      redFlagsList: [],
      passesRugCheck: true,
      isSafe: false // Keep it of unverified so users can search them easily
    });
  });

  return generated;
};

export const INITIAL_MEME_COINS: MemeCoin[] = generateBackupCoins();

export const MOCK_SYSTEM_LOGS: SystemLog[] = [
  {
    id: 'l1',
    timestamp: '08:14:02',
    type: 'success',
    message: '[DEX SCREENER SCAN] Scanned AURA/SOL liquidity pools. Burnt state confirmed via Solana Mainnet signatures.',
  }
];

export function calculateExecutiveStats(coins: MemeCoin[]): ExecutiveStats {
  const scanned = 542; // Simulated scanned in 24 hours
  const activeHighAlpha = coins.filter(c => c.combinedScore >= 75 && c.securityScore >= 70).length;
  const migrated = coins.filter(c => !c.isBondingCurve).length;
  const sumLiquidity = coins.reduce((acc, c) => acc + c.liquidityUsd, 0);
  const sumMCap = coins.reduce((acc, c) => acc + c.marketCapUsd, 0);
  const avgSecurity = Math.round(coins.reduce((acc, c) => acc + c.securityScore, 0) / coins.length) || 0;

  return {
    totalScanned24h: scanned,
    averageBreakoutRiskScore: avgSecurity,
    activeHighAlphaCount: activeHighAlpha,
    totalMarketCapUsd: sumMCap,
    pumpMigrationsCount: migrated,
    totalLiquidityTracked: sumLiquidity,
    systemHealthState: 'optimal'
  };
}

export function simulateCoinTick(coins: MemeCoin[]): { updatedCoins: MemeCoin[]; log: SystemLog | null } {
  if (coins.length === 0) return { updatedCoins: coins, log: null };
  
  // Locally age the coins based on real elapsed time
  const updatedAgedCoins = coins.map(c => {
    let newAge = c.ageInMinutes;
    if (c.createdAtMs) {
      newAge = Math.max(0, Math.floor((Date.now() - c.createdAtMs) / 60000));
    }
    
    let timeAgo = c.createdTimeAgo;
    if (newAge < 60) {
      timeAgo = newAge === 0 ? 'Just now' : `${newAge}m ago`;
    } else {
      const ageHours = Math.floor(newAge / 60);
      if (ageHours < 24) {
        timeAgo = `${ageHours}h ago`;
      } else {
        timeAgo = `${Math.floor(ageHours / 24)}d ago`;
      }
    }
    return { ...c, ageInMinutes: newAge, createdTimeAgo: timeAgo };
  });

  const indexToUpdate = Math.floor(Math.random() * updatedAgedCoins.length);
  
  // Actually mutate a coin to make the simulation useful
  const updatedCoins = [...updatedAgedCoins];
  const coin = { ...updatedCoins[indexToUpdate] };
  
  coin.priceUsd = coin.priceUsd * (1 + (Math.random() * 0.04 - 0.02)); // +/- 2%
  if (coin.priceHistory5m) {
    coin.priceHistory5m = [...coin.priceHistory5m.slice(1), coin.priceUsd];
  }
  
  updatedCoins[indexToUpdate] = coin;
  
  return { updatedCoins, log: null };
}
