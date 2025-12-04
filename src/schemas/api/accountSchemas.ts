import { z } from "zod";

/**
 * Zod schemas for account service API responses
 *
 * These schemas provide runtime validation for account-related API responses,
 * ensuring type safety and catching malformed data before it causes runtime errors.
 */

// ============================================================================
// USER SCHEMAS
// ============================================================================

/**
 * Schema for base user object
 */
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  is_active: z.boolean(),
  is_subscribed_to_reports: z.boolean(),
  created_at: z.string(),
});

/**
 * Schema for user crypto wallet
 */
export const userCryptoWalletSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  wallet: z.string(),
  label: z.string().optional(),
  created_at: z.string(),
});

/**
 * Schema for subscription plan
 */
export const planSchema = z.object({
  code: z.string(),
  name: z.string(),
  tier: z.number(),
});

/**
 * Schema for user subscription
 */
export const userSubscriptionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  plan_code: z.string(),
  starts_at: z.string(),
  ends_at: z.string().optional(),
  is_canceled: z.boolean(),
  created_at: z.string(),
  plan: planSchema.optional(),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for connect wallet response
 */
export const connectWalletResponseSchema = z.object({
  user_id: z.string(),
  is_new_user: z.boolean(),
});

/**
 * Schema for add wallet response
 */
export const addWalletResponseSchema = z.object({
  wallet_id: z.string(),
  message: z.string(),
});

/**
 * Schema for update email response
 */
export const updateEmailResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

/**
 * Schema for user profile response
 */
export const userProfileResponseSchema = z.object({
  user: userSchema,
  wallets: z.array(userCryptoWalletSchema),
  subscription: userSubscriptionSchema.optional(),
});

/**
 * Schema for account token (from getUserTokens endpoint)
 */
export const accountTokenSchema = z.object({
  id: z.string(),
  chain: z.string(),
  name: z.string(),
  symbol: z.string(),
  display_symbol: z.string(),
  optimized_symbol: z.string(),
  decimals: z.number(),
  logo_url: z.string(),
  protocol_id: z.string(),
  price: z.number(),
  is_verified: z.boolean(),
  is_core: z.boolean(),
  is_wallet: z.boolean(),
  time_at: z.number(),
  amount: z.number(),
});

/**
 * Schema for health check response
 */
export const healthCheckResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
});

/**
 * Schema for simple message response
 */
export const messageResponseSchema = z.object({
  message: z.string(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type inference from schemas
 * These types are automatically generated from the Zod schemas
 */
export type User = z.infer<typeof userSchema>;
export type UserCryptoWallet = z.infer<typeof userCryptoWalletSchema>;
export type Plan = z.infer<typeof planSchema>;
export type UserSubscription = z.infer<typeof userSubscriptionSchema>;
export type ConnectWalletResponse = z.infer<typeof connectWalletResponseSchema>;
export type AddWalletResponse = z.infer<typeof addWalletResponseSchema>;
export type UpdateEmailResponse = z.infer<typeof updateEmailResponseSchema>;
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
export type AccountToken = z.infer<typeof accountTokenSchema>;
export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
export type MessageResponse = z.infer<typeof messageResponseSchema>;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validates connect wallet response data from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateConnectWalletResponse(
  data: unknown
): ConnectWalletResponse {
  return connectWalletResponseSchema.parse(data);
}

/**
 * Validates add wallet response data from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateAddWalletResponse(data: unknown): AddWalletResponse {
  return addWalletResponseSchema.parse(data);
}

/**
 * Validates update email response data from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateUpdateEmailResponse(
  data: unknown
): UpdateEmailResponse {
  return updateEmailResponseSchema.parse(data);
}

/**
 * Validates user profile response data from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateUserProfileResponse(
  data: unknown
): UserProfileResponse {
  return userProfileResponseSchema.parse(data);
}

/**
 * Validates account tokens array from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateAccountTokens(data: unknown): AccountToken[] {
  return z.array(accountTokenSchema).parse(data);
}

/**
 * Validates user crypto wallets array from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateUserWallets(data: unknown): UserCryptoWallet[] {
  return z.array(userCryptoWalletSchema).parse(data);
}

/**
 * Validates health check response from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateHealthCheckResponse(
  data: unknown
): HealthCheckResponse {
  return healthCheckResponseSchema.parse(data);
}

/**
 * Validates message response from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateMessageResponse(data: unknown): MessageResponse {
  return messageResponseSchema.parse(data);
}

/**
 * Safe validation that returns result with success/error information
 * Useful for cases where you want to handle validation errors gracefully
 */
export function safeValidateUserProfile(data: unknown) {
  return userProfileResponseSchema.safeParse(data);
}
