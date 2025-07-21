/**
 * Feature Flag System Types
 *
 * Provides type-safe feature flag management for gradual rollouts,
 * A/B testing, and emergency feature toggles.
 */

export type FeatureFlagValue = boolean | string | number | object;

export interface FeatureFlag {
  /** Unique identifier for the feature flag */
  key: string;
  /** Human-readable name */
  name: string;
  /** Description of what this flag controls */
  description: string;
  /** Current value of the flag */
  value: FeatureFlagValue;
  /** Default value if not configured */
  defaultValue: FeatureFlagValue;
  /** Flag type for UI/validation */
  type: "boolean" | "string" | "number" | "json";
  /** Environment where this flag is active */
  environment?: "development" | "staging" | "production" | "all";
  /** When this flag was last updated */
  updatedAt?: string;
  /** Who last updated this flag */
  updatedBy?: string;
  /** Percentage of users who should see this flag enabled (0-100) */
  rolloutPercentage?: number;
  /** Specific user IDs or wallet addresses that should see this flag */
  allowedUsers?: string[];
  /** Flag category for organization */
  category?: "ui" | "strategy" | "security" | "experimental" | "performance";
}

export interface FeatureFlagConfig {
  /** All available feature flags */
  flags: Record<string, FeatureFlag>;
  /** Global rollout settings */
  global: {
    /** Whether feature flags are enabled at all */
    enabled: boolean;
    /** Debug mode shows flag values in UI */
    debug: boolean;
    /** Remote config URL for fetching flags */
    remoteConfigUrl?: string;
    /** How often to refresh remote config (ms) */
    refreshInterval?: number;
  };
}

export interface FeatureFlagContext {
  /** Get a feature flag value */
  getFlag: <T extends FeatureFlagValue = boolean>(key: string) => T;
  /** Check if a feature is enabled (boolean flags only) */
  isEnabled: (key: string) => boolean;
  /** Get all flags (for debug/admin) */
  getAllFlags: () => Record<string, FeatureFlag>;
  /** Manually override a flag value (development only) */
  setFlag: (key: string, value: FeatureFlagValue) => void;
  /** Refresh flags from remote config */
  refreshFlags: () => Promise<void>;
  /** Loading state for remote config */
  isLoading: boolean;
  /** Error state for remote config */
  error: string | null;
}

/**
 * Predefined feature flags for Zap Pilot
 */
export const FEATURE_FLAGS: Record<
  string,
  Omit<FeatureFlag, "value" | "updatedAt">
> = {
  // UI Features
  NEW_DASHBOARD_LAYOUT: {
    key: "NEW_DASHBOARD_LAYOUT",
    name: "New Dashboard Layout",
    description: "Enable the redesigned dashboard layout with improved metrics",
    defaultValue: false,
    type: "boolean",
    category: "ui",
    environment: "all",
    rolloutPercentage: 0,
  },

  DARK_MODE_TOGGLE: {
    key: "DARK_MODE_TOGGLE",
    name: "Dark Mode Toggle",
    description: "Allow users to switch between light and dark themes",
    defaultValue: false,
    type: "boolean",
    category: "ui",
    environment: "all",
    rolloutPercentage: 100,
  },

  MOBILE_OPTIMIZATIONS: {
    key: "MOBILE_OPTIMIZATIONS",
    name: "Mobile Optimizations",
    description: "Enhanced mobile UI improvements and touch interactions",
    defaultValue: true,
    type: "boolean",
    category: "ui",
    environment: "all",
    rolloutPercentage: 100,
  },

  // Strategy Features
  ADVANCED_STRATEGIES: {
    key: "ADVANCED_STRATEGIES",
    name: "Advanced Investment Strategies",
    description: "Enable complex multi-protocol investment strategies",
    defaultValue: false,
    type: "boolean",
    category: "strategy",
    environment: "all",
    rolloutPercentage: 25,
  },

  AUTO_REBALANCING: {
    key: "AUTO_REBALANCING",
    name: "Automatic Rebalancing",
    description: "Allow automatic portfolio rebalancing based on preset rules",
    defaultValue: false,
    type: "boolean",
    category: "strategy",
    environment: "all",
    rolloutPercentage: 10,
  },

  YIELD_FARMING_V2: {
    key: "YIELD_FARMING_V2",
    name: "Yield Farming V2",
    description: "Next generation yield farming with improved APR calculations",
    defaultValue: false,
    type: "boolean",
    category: "strategy",
    environment: "all",
    rolloutPercentage: 0,
  },

  // Security Features
  HARDWARE_WALLET_INTEGRATION: {
    key: "HARDWARE_WALLET_INTEGRATION",
    name: "Hardware Wallet Integration",
    description: "Support for Ledger and Trezor hardware wallets",
    defaultValue: false,
    type: "boolean",
    category: "security",
    environment: "all",
    rolloutPercentage: 50,
  },

  TRANSACTION_SIMULATION: {
    key: "TRANSACTION_SIMULATION",
    name: "Transaction Simulation",
    description: "Simulate transactions before execution to prevent failures",
    defaultValue: true,
    type: "boolean",
    category: "security",
    environment: "all",
    rolloutPercentage: 100,
  },

  // Experimental Features
  AI_PORTFOLIO_SUGGESTIONS: {
    key: "AI_PORTFOLIO_SUGGESTIONS",
    name: "AI Portfolio Suggestions",
    description: "AI-powered portfolio optimization suggestions",
    defaultValue: false,
    type: "boolean",
    category: "experimental",
    environment: "development",
    rolloutPercentage: 0,
  },

  SOCIAL_TRADING: {
    key: "SOCIAL_TRADING",
    name: "Social Trading",
    description: "Follow and copy successful traders strategies",
    defaultValue: false,
    type: "boolean",
    category: "experimental",
    environment: "development",
    rolloutPercentage: 0,
  },

  // Performance Features
  OPTIMISTIC_UPDATES: {
    key: "OPTIMISTIC_UPDATES",
    name: "Optimistic UI Updates",
    description: "Update UI immediately before transaction confirmation",
    defaultValue: true,
    type: "boolean",
    category: "performance",
    environment: "all",
    rolloutPercentage: 100,
  },

  LAZY_LOADING: {
    key: "LAZY_LOADING",
    name: "Component Lazy Loading",
    description: "Load components only when needed to improve performance",
    defaultValue: true,
    type: "boolean",
    category: "performance",
    environment: "all",
    rolloutPercentage: 100,
  },

  // Configuration Flags
  MAX_PORTFOLIO_SIZE: {
    key: "MAX_PORTFOLIO_SIZE",
    name: "Maximum Portfolio Size",
    description: "Maximum number of assets in a portfolio",
    defaultValue: 20,
    type: "number",
    category: "strategy",
    environment: "all",
  },

  SUPPORTED_CHAINS: {
    key: "SUPPORTED_CHAINS",
    name: "Supported Blockchain Networks",
    description: "List of supported blockchain networks",
    defaultValue: ["ethereum", "polygon", "arbitrum", "optimism"],
    type: "json",
    category: "strategy",
    environment: "all",
  },

  API_ENDPOINTS: {
    key: "API_ENDPOINTS",
    name: "API Endpoint Configuration",
    description: "Backend API endpoints for different environments",
    defaultValue: {
      debank: "https://api.debank.com",
      backend: "http://localhost:8000",
      rebalance: "http://localhost:5000",
    },
    type: "json",
    category: "performance",
    environment: "all",
  },
} as const;

/**
 * Type helper to get flag keys with type safety
 */
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Type helper to ensure flag values match their expected types
 */
export type FeatureFlagValues = {
  [K in FeatureFlagKey]: (typeof FEATURE_FLAGS)[K]["defaultValue"];
};
