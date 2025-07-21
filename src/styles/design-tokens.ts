/**
 * @deprecated This file has been consolidated into constants/design-system.ts and constants/portfolio.ts
 * Please import from the appropriate domain-specific constants file instead
 */

// Re-export design system constants for backward compatibility
export {
  GRADIENTS,
  GLASS_MORPHISM,
  ANIMATION_DELAYS,
  getGradientClass,
  getGlassMorphismClass,
} from "../constants/design-system";

// Re-export portfolio constants for backward compatibility
export {
  PORTFOLIO_COLORS,
  RISK_LEVELS,
  getRiskLevelClass,
} from "../constants/portfolio";

// Legacy exports - use specific domain constants instead
export const BUSINESS_CONSTANTS = {
  PORTFOLIO: {
    DEFAULT_APR: 18.5,
    AMOUNT_PERCENTAGES: [0.25, 0.5, 0.75, 1.0] as const,
    SLIPPAGE_RATE: 0.01,
    MIN_INVESTMENT: 10,
    MAX_INVESTMENT: 1000000,
  },
  CHART: {
    DEFAULT_PERIOD: "3M",
    MAX_DRAWDOWN_SCALE: -20,
    DEFAULT_HEIGHT: 300,
    DEFAULT_WIDTH: 800,
    PADDING: 10,
  },
  ANIMATION: {
    DURATION: {
      FAST: 0.2,
      NORMAL: 0.5,
      SLOW: 0.8,
    },
    STAGGER_DELAY: 0.05,
  },
} as const;

export const MOCK_DATA_CONSTANTS = {
  PORTFOLIO_VALUE: 100000,
  ASSET_ALLOCATIONS: {
    BTC: 35.2,
    ETH: 28.7,
    STABLECOIN: 20.1,
    DEFI: 12.4,
    ALTCOIN: 3.6,
  },
  PERFORMANCE_METRICS: {
    BEST_DAY: 5.2,
    WORST_DAY: -3.8,
    AVG_DAILY: 0.12,
    WIN_RATE: 64.2,
  },
} as const;
