// App-wide constants and configuration

export const APP_CONFIG = {
  name: "Zap Pilot",
  description: "Intent-based DeFi execution engine",
  version: "0.1.0",
} as const;

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

export const ASSET_CATEGORIES = {
  BTC: "btc",
  ETH: "eth",
  STABLECOIN: "stablecoin",
  ALTCOIN: "altcoin",
} as const;

export const RISK_LEVELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

export const ASSET_TYPES = {
  STAKING: "Staking",
  LENDING: "Lending",
  LIQUIDITY_POOL: "Liquidity Pool",
  HOLDING: "Holding",
  SAFETY_MODULE: "Safety Module",
  LIQUID_STAKING: "Liquid Staking",
} as const;
