/**
 * Services Public API
 *
 * Centralized barrel export for all application services.
 * Import services from this file for cleaner imports:
 *
 * @example
 * ```typescript
 * import { connectWallet, getUserProfile } from '@/services';
 * import { getPortfolioDashboard } from '@/services';
 * ```
 */

// ============================================================================
// PRODUCTION SERVICES
// ============================================================================

// Account & User Management
export {
  AccountServiceError,
  addWalletToBundle,
  connectWallet,
  deleteUser,
  getUserProfile,
  getUserWallets,
  removeUserEmail,
  removeWalletFromBundle,
  updateUserEmail,
  updateWalletLabel,
} from "./accountService";

// Analytics & Portfolio Data
export {
  type DailyYieldReturnsResponse,
  type DashboardWindowParams,
  getDailyYieldReturns,
  getLandingPagePortfolioData,
  getPortfolioDashboard,
  type LandingPageResponse,
  type PoolDetail,
  type UnifiedDashboardResponse,
} from "./analyticsService";

// Bundle Sharing
export {
  type BundleUser,
  generateBundleUrl,
  getBundleUser,
  isOwnBundle,
} from "./bundleService";

// Market Data
export {
  type BtcPriceHistoryResponse,
  type BtcPriceSnapshot,
  getBtcPriceHistory,
} from "./btcPriceService";

// Sentiment & Regime Analysis
export {
  DEFAULT_REGIME_HISTORY,
  fetchRegimeHistory,
  type RegimeHistoryData,
} from "./regimeHistoryService";
export {
  fetchMarketSentiment,
  type MarketSentimentData,
} from "./sentimentService";

// Analytics Export
export {
  exportAnalyticsToCSV,
  validateExportData,
} from "./analyticsExportService";

// Backtesting
export { runBacktest } from "./backtestingService";

// Strategy Suggestions
export {
  type DailySuggestionParams,
  type DailySuggestionResponse,
  getDailySuggestion,
} from "./strategyService";

// Telegram Integration
export {
  disconnectTelegram,
  getTelegramStatus,
  requestTelegramToken,
  type TelegramDisconnectResponse,
  type TelegramStatus,
  type TelegramTokenResponse,
} from "./telegramService";

// ============================================================================
// MOCK SERVICES (Development/Testing Only)
// ============================================================================

// New explicit mock exports (preferred)
export * as chainServiceMock from "./chainService.mock";
export * as transactionServiceMock from "./transactionService.mock";

// ============================================================================
// BACKWARD COMPATIBILITY (Deprecated)
// ============================================================================

/**
 * @deprecated Use transactionServiceMock instead
 * ⚠️ WARNING: This is a MOCK service - simulated data only
 * This re-export will be removed in v2.0.0
 */
export * as transactionService from "./transactionService.mock";

/**
 * @deprecated Use chainServiceMock instead
 * ⚠️ WARNING: This is a MOCK service - simulated data only
 * This re-export will be removed in v2.0.0
 */
export * as chainService from "./chainService.mock";
