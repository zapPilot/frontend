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
const userSchema = z.object({
  id: z.string(),
  // eslint-disable-next-line sonarjs/deprecation
  email: z.string().email().optional(),
  is_subscribed_to_reports: z.boolean(),
  created_at: z.string(),
});

/**
 * Schema for user crypto wallet
 */
const userCryptoWalletSchema = z.object({
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
const planSchema = z.object({
  code: z.string(),
  name: z.string(),
  tier: z.number(),
});

/**
 * Schema for user subscription
 */
const userSubscriptionSchema = z.object({
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
 * Validates message response from API
 * Returns validated data or throws ZodError with detailed error messages
 */
export function validateMessageResponse(data: unknown): MessageResponse {
  return messageResponseSchema.parse(data);
}

// safeValidateUserProfile removed (test-only usage)
