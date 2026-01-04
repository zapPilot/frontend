/**
 * Utility Functions Public API
 *
 * Centralized barrel export for all utility functions.
 * Import utilities from this file for cleaner imports:
 *
 * @example
 * ```typescript
 * import { formatCurrency, formatAddress, logger } from '@/utils';
 * ```
 */

// ============================================================================
// FORMATTERS
// ============================================================================

export {
  calculateDataFreshness,
  type DataFreshness,
  formatAddress,
  formatChartDate,
  formatCurrency,
  formatNumber,
  formatRelativeTime,
  formatters,
  type FreshnessState,
} from "./formatters";

// ============================================================================
// LOGGING
// ============================================================================

export { logger } from "./logger";

// ============================================================================
// MATH UTILITIES
// ============================================================================

export * from "./mathUtils";

// ============================================================================
// CLIPBOARD
// ============================================================================

export { copyTextToClipboard } from "./clipboard";

// ============================================================================
// CHART UTILITIES
// ============================================================================

export * from "./chartHoverUtils";
