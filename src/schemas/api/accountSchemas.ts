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
/**
 * Schema for base user object
 */
export const userSchema = z.object({
  id: z.string(),
  // eslint-disable-next-line sonarjs/deprecation
  email: z.string().email().optional(),
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
  // Backend sometimes returns null for label; accept nullable to avoid hard failures
  label: z.string().nullable().optional(),
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
  // Backend may return null for open-ended subscriptions
  ends_at: z.string().nullable().optional(),
  is_canceled: z.boolean(),
  created_at: z.string(),
  plan: planSchema.optional(),
});

/**
 * Schema for account token
 */
export const accountTokenSchema = z.object({
  id: z.string(),
  chain: z.string(),
  name: z.string(),
  symbol: z.string(),
  display_symbol: z.string().optional().nullable(),
  optimized_symbol: z.string().optional().nullable(),
  decimals: z.number(),
  logo_url: z.string().optional().nullable(),
  protocol_id: z.string().optional().nullable(),
  price: z.number(),
  is_verified: z.boolean(),
  is_core: z.boolean(),
  is_wallet: z.boolean(),
  time_at: z.number().optional().nullable(),
  amount: z.number(),
});

/**
 * Schema for health check response
 */
export const healthCheckResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for connect wallet response
 */
const etlJobResponseSchema = z.object({
  job_id: z.string().nullable(),
  status: z.string(),
  message: z.string(),
  rate_limited: z.boolean().optional(),
});

export const connectWalletResponseSchema = z.object({
  user_id: z.string(),
  is_new_user: z.boolean(),
  etl_job: etlJobResponseSchema.optional(),
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
 * Schema for simple message response
 */
export const messageResponseSchema = z.object({
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

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type inference from schemas
 * These types are automatically generated from the Zod schemas
 */
/** @public */ export type UserCryptoWallet = z.infer<
  typeof userCryptoWalletSchema
>;
/** @public */ export type ConnectWalletResponse = z.infer<
  typeof connectWalletResponseSchema
>;
/** @public */ export type EtlJobResponse = z.infer<
  typeof etlJobResponseSchema
>;
/** @public */ export type AddWalletResponse = z.infer<
  typeof addWalletResponseSchema
>;
/** @public */ export type UpdateEmailResponse = z.infer<
  typeof updateEmailResponseSchema
>;
/** @public */ export type UserProfileResponse = z.infer<
  typeof userProfileResponseSchema
>;
/** @public */ export type MessageResponse = z.infer<
  typeof messageResponseSchema
>;
/** @public */ export type AccountToken = z.infer<typeof accountTokenSchema>;
/** @public */ export type HealthCheckResponse = z.infer<
  typeof healthCheckResponseSchema
>;

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
 * Validates user crypto wallets array from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateUserWallets(data: unknown): UserCryptoWallet[] {
  return z.array(userCryptoWalletSchema).parse(data);
}

/**
 * Validates account tokens array from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateAccountTokens(data: unknown): AccountToken[] {
  return z.array(accountTokenSchema).parse(data);
}

/**
 * Validates message response from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateMessageResponse(data: unknown): MessageResponse {
  return messageResponseSchema.parse(data);
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

// safeValidateUserProfile removed (test-only usage)
