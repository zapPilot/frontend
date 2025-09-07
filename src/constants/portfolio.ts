/**
 * Portfolio Constants
 *
 * Consolidated constants for portfolio management, asset categories,
 * investment types, and portfolio-related business logic.
 */

// Asset Categories and Types
export const ASSET_CATEGORIES = {
  BTC: "btc",
  ETH: "eth",
  STABLECOIN: "stablecoin",
  DEFI: "defi",
  ALTCOIN: "altcoin",
} as const;

export const ASSET_TYPES = {
  STAKING: "Staking",
  LENDING: "Lending",
  LIQUIDITY_POOL: "Liquidity Pool",
  HOLDING: "Holding",
  SAFETY_MODULE: "Safety Module",
  LIQUID_STAKING: "Liquid Staking",
} as const;

// Risk Levels (consolidated from duplicates)
export const RISK_LEVELS = {
  LOW: {
    value: "Low",
    label: "Low",
    color: "text-green-400",
    bgColor: "bg-green-900/30",
  },
  MEDIUM: {
    value: "Medium",
    label: "Medium",
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/30",
  },
  HIGH: {
    value: "High",
    label: "High",
    color: "text-red-400",
    bgColor: "bg-red-900/30",
  },
} as const;

// Portfolio Colors
export const PORTFOLIO_COLORS = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  STABLECOIN: "#26A69A",
  DEFI: "#8B5CF6",
  ALTCOIN: "#AB47BC",
} as const;

// Portfolio Display Configuration
export const PORTFOLIO_CONFIG = {
  // Chart configuration
  DEFAULT_PIE_CHART_SIZE: 250,
  DEFAULT_PIE_CHART_STROKE_WIDTH: 8,

  // Display configuration
  CURRENCY_LOCALE: "en-US",
  CURRENCY_CODE: "USD",
  HIDDEN_BALANCE_PLACEHOLDER: "••••••••",
  HIDDEN_NUMBER_PLACEHOLDER: "••••",

  // Animation delays
  ANIMATION_DELAY_STEP: 0.1,
  CATEGORY_ANIMATION_DURATION: 0.3,
} as const;

// Business Constants
export const PORTFOLIO_BUSINESS = {
  // Mock business constant: 18.5% is our target portfolio APR across all strategies
  // This is intentionally a business constant, not derived from API data
  DEFAULT_APR: 18.5,
  AMOUNT_PERCENTAGES: [0.25, 0.5, 0.75, 1.0] as const,
  SLIPPAGE_RATE: 0.01,
  MIN_INVESTMENT: 10,
  MAX_INVESTMENT: 1000000,
  // Monthly income calculation constants
  MONTHLY_CALCULATION_FACTOR: 12, // APR to monthly conversion
} as const;

// Chart Configuration
export const PORTFOLIO_CHART = {
  DEFAULT_PERIOD: "3M",
  MAX_DRAWDOWN_SCALE: -20,
  DEFAULT_HEIGHT: 300,
  DEFAULT_WIDTH: 800,
  PADDING: 10,
} as const;
// Utility functions
export const getRiskLevelClass = (risk: keyof typeof RISK_LEVELS) =>
  `${RISK_LEVELS[risk].bgColor} ${RISK_LEVELS[risk].color} px-2 py-1 rounded-full text-xs`;

export const getAssetCategoryColor = (
  category: keyof typeof PORTFOLIO_COLORS
) => PORTFOLIO_COLORS[category];

/**
 * Calculate estimated monthly income based on portfolio value and APR
 * @param portfolioValue - Total portfolio value in USD
 * @param apr - Annual percentage rate (default: 18.5%)
 * @returns Estimated monthly income
 */
export const calculateMonthlyIncome = (
  portfolioValue: number,
  apr: number = PORTFOLIO_BUSINESS.DEFAULT_APR
): number => {
  if (portfolioValue <= 0 || apr <= 0) return 0;
  return (
    (portfolioValue * (apr / 100)) /
    PORTFOLIO_BUSINESS.MONTHLY_CALCULATION_FACTOR
  );
};

// Type exports for convenience
export type AssetCategory = keyof typeof ASSET_CATEGORIES;
export type AssetType = keyof typeof ASSET_TYPES;
export type RiskLevel = keyof typeof RISK_LEVELS;
