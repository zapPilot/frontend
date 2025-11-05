export const DEFAULT_CATEGORY_WEIGHTS: Record<string, number> = {
  stablecoin: 45,
  eth: 35,
  btc: 20,
};

export const DEFAULT_PORTFOLIO_TOTAL_VALUE = 100_000;

export const MIN_ALLOCATION_PERCENT = 0;
export const MAX_ALLOCATION_PERCENT = 100;

/**
 * Allocation thresholds for rebalancing logic
 */
export const ALLOCATION_THRESHOLDS = {
  /** Below this percentage change, maintain current allocation */
  CHANGE_MAINTAIN: 0.5,
  /** Minimum BTC allocation percentage in rebalancing */
  MIN_BTC_ALLOCATION: 25,
  /** Maximum ETH allocation percentage in rebalancing */
  MAX_ETH_ALLOCATION: 50,
  /** ETH allocation increase amount */
  ETH_INCREASE: 7,
  /** Stablecoin allocation decrease amount */
  STABLECOIN_DECREASE: 2,
  /** Random variation range for mock data */
  RANDOM_VARIATION: 10,
} as const;

/**
 * UI control configuration for allocation adjustments
 */
export const ALLOCATION_UI = {
  /** Fine adjustment step for allocation sliders */
  SLIDER_STEP_FINE: 0.1,
  /** Coarse adjustment step for allocation sliders */
  SLIDER_STEP_COARSE: 0.5,
} as const;

/**
 * Mock values for testing and development
 * ZAP-207: Pending replacement with real API data
 */
export const MOCK_VALUES = {
  /** Mock total portfolio value in USD */
  PORTFOLIO_VALUE: 30000,
  /** Mock dollar value per percentage point */
  DOLLAR_PER_PERCENTAGE: 300,
} as const;

/**
 * Base value for percentage calculations
 */
export const PERCENTAGE_BASE = 100;
