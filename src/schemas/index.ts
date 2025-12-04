/**
 * Barrel export for all Zod validation schemas
 *
 * This file provides centralized access to all API response validation schemas.
 * Import from here to validate API responses before consuming them in service functions.
 */

// Balance Service Schemas
export {
  tokenBalanceRawSchema,
  normalizedTokenBalanceSchema,
  walletResponseDataSchema,
  walletTokenBalancesSchema,
  validateTokenBalanceRaw,
  validateWalletResponseData,
  validateWalletTokenBalances,
  safeValidateWalletResponse,
  type TokenBalanceRaw,
  type NormalizedTokenBalance,
  type WalletResponseData,
  type WalletTokenBalances,
} from "./api/balanceSchemas";

// Analytics Service Schemas
export {
  protocolYieldWindowSchema,
  protocolYieldTodaySchema,
  protocolYieldBreakdownSchema,
  yieldWindowSummarySchema,
  yieldReturnsSummaryResponseSchema,
  landingPageResponseSchema,
  unifiedDashboardResponseSchema,
  dailyYieldReturnsResponseSchema,
  poolPerformanceResponseSchema,
  validateYieldReturnsSummaryResponse,
  validateLandingPageResponse,
  validateUnifiedDashboardResponse,
  validateDailyYieldReturnsResponse,
  validatePoolPerformanceResponse,
  safeValidateUnifiedDashboardResponse,
  type ProtocolYieldWindow,
  type ProtocolYieldToday,
  type ProtocolYieldBreakdown,
  type YieldWindowSummary,
  type YieldReturnsSummaryResponse,
  type LandingPageResponse,
  type UnifiedDashboardResponse,
  type DailyYieldReturnsResponse,
  type PoolPerformanceResponse,
  type PoolDetail,
} from "./api/analyticsSchemas";

// Sentiment Service Schemas
export {
  sentimentApiResponseSchema,
  validateSentimentApiResponse,
  safeValidateSentimentApiResponse,
  type SentimentApiResponse,
} from "./api/sentimentSchemas";

// Account Service Schemas
export {
  userSchema,
  userCryptoWalletSchema,
  planSchema,
  userSubscriptionSchema,
  connectWalletResponseSchema,
  addWalletResponseSchema,
  updateEmailResponseSchema,
  userProfileResponseSchema,
  accountTokenSchema,
  healthCheckResponseSchema,
  messageResponseSchema,
  validateConnectWalletResponse,
  validateAddWalletResponse,
  validateUpdateEmailResponse,
  validateUserProfileResponse,
  validateAccountTokens,
  validateUserWallets,
  validateHealthCheckResponse,
  validateMessageResponse,
  safeValidateUserProfile,
  type User,
  type UserCryptoWallet,
  type Plan,
  type UserSubscription,
  type ConnectWalletResponse,
  type AddWalletResponse,
  type UpdateEmailResponse,
  type UserProfileResponse,
  type AccountToken,
  type HealthCheckResponse,
  type MessageResponse,
} from "./api/accountSchemas";
