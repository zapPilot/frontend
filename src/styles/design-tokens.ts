// Design System Tokens
// Centralized constants for consistent styling across the application

export const GRADIENTS = {
  PRIMARY: "from-purple-600 to-blue-600",
  SUCCESS: "from-green-600 to-emerald-600",
  DANGER: "from-red-600 to-pink-600",
  WARNING: "from-yellow-600 to-orange-600",
  INFO: "from-blue-600 to-cyan-600",
  DARK: "from-gray-800 to-gray-900",
  LIGHT: "from-gray-200 to-gray-300",
} as const;

export const GLASS_MORPHISM = {
  BASE: "glass-morphism",
  WITH_BORDER: "glass-morphism border border-gray-800",
  ROUNDED_LG: "glass-morphism rounded-2xl border border-gray-800",
  ROUNDED_XL: "glass-morphism rounded-3xl border border-gray-800",
  HOVER: "glass-morphism hover:bg-white/10 transition-all duration-300",
} as const;

export const ANIMATION_DELAYS = {
  NONE: 0,
  FAST: 0.05,
  NORMAL: 0.1,
  SLOW: 0.2,
  EXTRA_SLOW: 0.3,
} as const;

export const PORTFOLIO_COLORS = {
  BTC: "#f59e0b",
  ETH: "#6366f1",
  STABLECOIN: "#10b981",
  DEFI: "#8b5cf6",
  ALTCOIN: "#ef4444",
} as const;

export const RISK_LEVELS = {
  LOW: {
    label: "Low",
    color: "text-green-400",
    bgColor: "bg-green-900/30",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/30",
  },
  HIGH: {
    label: "High",
    color: "text-red-400",
    bgColor: "bg-red-900/30",
  },
} as const;

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

// Utility functions for consistent styling
export const getGradientClass = (gradient: keyof typeof GRADIENTS) =>
  `bg-gradient-to-r ${GRADIENTS[gradient]}`;

export const getRiskLevelClass = (risk: keyof typeof RISK_LEVELS) =>
  `${RISK_LEVELS[risk].bgColor} ${RISK_LEVELS[risk].color} px-2 py-1 rounded-full text-xs`;

export const getGlassMorphismClass = (
  variant: keyof typeof GLASS_MORPHISM = "BASE"
) => GLASS_MORPHISM[variant];
