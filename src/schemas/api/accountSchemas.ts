import { type EtlJobStatus } from "@davidtnfsh/etl-contracts";
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
 * Lenient ETL job status schema
 *
 * Only requires jobId and status (the fields we actually use).
 * Makes all other fields optional to handle partial API responses gracefully.
 * This prevents silent validation failures when the API doesn't send all fields.
 */
const LenientEtlJobStatusSchema = z.object({
  jobId: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  trigger: z.enum(["webhook", "manual", "scheduled"]).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  completedAt: z.string().optional(),
  recordsProcessed: z.number().optional(),
  recordsInserted: z.number().optional(),
  duration: z.number().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
}).passthrough(); // Allow additional fields without failing validation

/**
 * Schema for ETL job status response
 *
 * Preprocessing layer that converts snake_case API fields to camelCase
 * before validating against the lenient schema above.
 */
export const etlJobStatusResponseSchema = z.preprocess(
  (val: unknown) => {
    if (val && typeof val === "object") {
      const record = val as Record<string, unknown>;
      const normalized: Record<string, unknown> = {};

      // Convert ALL snake_case fields to camelCase
      if ("job_id" in record) normalized["jobId"] = record["job_id"];
      if ("status" in record) normalized["status"] = record["status"];
      if ("trigger" in record) normalized["trigger"] = record["trigger"];
      if ("created_at" in record) normalized["createdAt"] = record["created_at"];
      if ("updated_at" in record) normalized["updatedAt"] = record["updated_at"];
      if ("completed_at" in record) normalized["completedAt"] = record["completed_at"];
      if ("records_processed" in record) normalized["recordsProcessed"] = record["records_processed"];
      if ("records_inserted" in record) normalized["recordsInserted"] = record["records_inserted"];
      if ("duration" in record) normalized["duration"] = record["duration"];
      if ("error" in record) normalized["error"] = record["error"];

      return normalized;
    }
    return val;
  },
  LenientEtlJobStatusSchema // Use lenient schema instead of strict contract
);

export const connectWalletResponseSchema = z.object({
  user_id: z.string(),
  is_new_user: z.boolean(),
  etl_job: etlJobStatusResponseSchema.optional(),
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

/**
 * ConnectWalletResponse type with explicit EtlJobStatus typing
 * We manually define this instead of inferring from Zod because
 * the external schema import causes type inference issues
 */
/** @public */ export interface ConnectWalletResponse {
  user_id: string;
  is_new_user: boolean;
  etl_job?: EtlJobStatus;
}
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

/**
 * Re-export EtlJobStatus from etl-contracts for convenience
 * This type is used in ConnectWalletResponse
 */
export type { EtlJobStatus };

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
  return connectWalletResponseSchema.parse(data) as ConnectWalletResponse;
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
