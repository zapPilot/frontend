/**
 * Portfolio Utils (Legacy)
 *
 * @deprecated This file has been split into specialized modules for better organization:
 *
 * - Data processing: `portfolio-data.ts`
 * - Analytics & mock data: `portfolio-analytics.ts`
 * - Color utilities: `color-utils.ts`
 *
 * Please import from the specific modules instead of this file.
 * This file will be removed in a future version.
 */

// Re-export analytics functions
export {
  CHART_PERIODS,
  generatePortfolioHistory,
  generateAssetAttribution,
  getAnalyticsMetrics,
  getPerformanceData,
  calculateDrawdownData,
} from "./portfolio-analytics";

// Re-export color utilities
export { getChangeColorClasses } from "./color-utils";

// Re-export data processing utilities
export { calculatePortfolioMetrics } from "./portfolio-data";
