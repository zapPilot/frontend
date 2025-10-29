/**
 * Slippage Configuration Constants
 *
 * Centralized configuration for slippage tolerance settings across the application.
 * Used in swap operations, portfolio rebalancing, and transaction settings.
 *
 * @module constants/slippage
 */

/**
 * Slippage tolerance configuration
 * All values are in percentage format (e.g., 0.5 = 0.5%)
 */
export const SLIPPAGE_CONFIG = {
  /** Default slippage tolerance (0.5%) */
  DEFAULT: 0.5,
  /** Minimum allowed slippage */
  MIN: 0,
  /** Maximum allowed slippage (50%) */
  MAX: 50,
  /** Preset slippage values for quick selection */
  PRESETS: {
    /** Low slippage tolerance (0.1%) */
    LOW: 0.1,
    /** Medium slippage tolerance (0.5%) - Default */
    MEDIUM: 0.5,
    /** High slippage tolerance (1.0%) */
    HIGH: 1.0,
  },
} as const;
