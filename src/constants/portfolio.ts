/**
 * Portfolio Constants
 *
 * Consolidated constants for portfolio management and display configuration.
 */

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
