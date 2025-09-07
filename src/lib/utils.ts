/**
 * Utility Functions (Legacy)
 *
 * This file now re-exports functions from the consolidated modules.
 * Import directly from the specific modules for better tree-shaking.
 */

// Re-export formatting functions
export { formatCurrency, formatNumber, formatPercentage } from "./formatters";

// Re-export color utilities
export { getChangeColorClasses } from "./color-utils";

// Re-export portfolio utilities
export { calculatePortfolioMetrics } from "./portfolio-data";
