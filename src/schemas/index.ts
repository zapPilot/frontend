/**
 * Barrel export for all Zod validation schemas
 *
 * This file provides centralized access to all API response validation schemas.
 * Import from here to validate API responses before consuming them in service functions.
 */

// Balance Service Schemas
export {
  type NormalizedTokenBalance,
  normalizedTokenBalanceSchema,
  safeValidateWalletResponse,
  type TokenBalanceRaw,
  tokenBalanceRawSchema,
  validateTokenBalanceRaw,
  validateWalletResponseData,
  validateWalletTokenBalances,
  type WalletResponseData,
  walletResponseDataSchema,
  type WalletTokenBalances,
  walletTokenBalancesSchema,
} from "./api/balanceSchemas";

// Analytics Service Schemas
export {
  type DailyYieldReturnsResponse,
  dailyYieldReturnsResponseSchema,
  type LandingPageResponse,
  landingPageResponseSchema,
  type PoolDetail,
  type PoolPerformanceResponse,
  poolPerformanceResponseSchema,
  type ProtocolYieldBreakdown,
  protocolYieldBreakdownSchema,
  type ProtocolYieldToday,
  protocolYieldTodaySchema,
  protocolYieldWindowSchema,
  safeValidateUnifiedDashboardResponse,
  type UnifiedDashboardResponse,
  unifiedDashboardResponseSchema,
  validateDailyYieldReturnsResponse,
  validateLandingPageResponse,
  validatePoolPerformanceResponse,
  validateUnifiedDashboardResponse,
  validateYieldReturnsSummaryResponse,
  type YieldReturnsSummaryResponse,
  yieldReturnsSummaryResponseSchema,
  type YieldWindowSummary,
  yieldWindowSummarySchema,
} from "./api/analyticsSchemas";

// Sentiment Service Schemas
export {
  safeValidateSentimentApiResponse,
  type SentimentApiResponse,
  sentimentApiResponseSchema,
  validateSentimentApiResponse,
} from "./api/sentimentSchemas";

// Account Service Schemas
export {
  type AccountToken,
  accountTokenSchema,
  type AddWalletResponse,
  addWalletResponseSchema,
  type ConnectWalletResponse,
  connectWalletResponseSchema,
  type HealthCheckResponse,
  healthCheckResponseSchema,
  type MessageResponse,
  messageResponseSchema,
  type Plan,
  planSchema,
  safeValidateUserProfile,
  type UpdateEmailResponse,
  updateEmailResponseSchema,
  type User,
  type UserCryptoWallet,
  userCryptoWalletSchema,
  type UserProfileResponse,
  userProfileResponseSchema,
  userSchema,
  type UserSubscription,
  userSubscriptionSchema,
  validateAccountTokens,
  validateAddWalletResponse,
  validateConnectWalletResponse,
  validateHealthCheckResponse,
  validateMessageResponse,
  validateUpdateEmailResponse,
  validateUserProfileResponse,
  validateUserWallets,
} from "./api/accountSchemas";
