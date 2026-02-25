/**
 * Account Service
 * Service functions for user management and wallet operations (port 3004)
 * Replaces AccountApiClient with simpler service function approach
 */

import type { EtlJobStatus } from "@davidtnfsh/etl-contracts";

import { AccountServiceError } from "@/lib/errors";
import { httpUtils } from "@/lib/http";
import { createServiceCaller } from "@/lib/http/createServiceCaller";
import { createServiceError } from "@/lib/http/serviceErrorUtils";
import {
  connectWalletResponseSchema,
  etlJobStatusResponseSchema,
  validateAddWalletResponse,
  validateMessageResponse,
  validateUpdateEmailResponse,
  validateUserProfileResponse,
  validateUserWallets,
} from "@/schemas/api/accountSchemas";
import type {
  AddWalletResponse,
  ConnectWalletResponse,
  UpdateEmailResponse,
  UserCryptoWallet,
  UserProfileResponse,
} from "@/types/domain/user.types";
import { logger } from "@/utils/logger";

export { AccountServiceError };

function mapAccountConflictMessage(message: string | undefined): string | null {
  if (message?.includes("wallet already belongs to another user")) {
    return message;
  }

  if (message?.includes("wallet")) {
    return "This wallet is already associated with an account.";
  }

  if (message?.includes("email")) {
    return "This email address is already in use.";
  }

  return null;
}

function mapAccountServiceErrorMessage(
  status: number | undefined,
  message: string | undefined
): string {
  if (status === 400 && message?.includes("wallet")) {
    return "Invalid wallet address format. Must be a 42-character Ethereum address.";
  }

  if (status === 404) {
    return "User account not found. Please connect your wallet first.";
  }

  if (status === 409) {
    return (
      mapAccountConflictMessage(message) ?? message ?? "Account service error"
    );
  }

  if (status === 422) {
    return "Invalid request data. Please check your input and try again.";
  }

  return message ?? "Account service error";
}

/**
 * Create enhanced error messages for common account API errors
 */
function createAccountServiceError(error: unknown): AccountServiceError {
  return createServiceError(
    error,
    AccountServiceError,
    "Account service error",
    mapAccountServiceErrorMessage
  );
}

function logDevelopmentResponse(label: string, payload: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  logger.debug(label, JSON.stringify(payload, null, 2));
}

function validateConnectWalletResponse(
  response: unknown
): ConnectWalletResponse {
  const validationResult = connectWalletResponseSchema.safeParse(response);
  if (!validationResult.success) {
    logger.error("❌ Validation failed:", validationResult.error.issues);
    throw new AccountServiceError(
      "Connect wallet response validation failed",
      500,
      "VALIDATION_ERROR",
      { issues: validationResult.error.issues }
    );
  }

  return validationResult.data as ConnectWalletResponse;
}

const accountApiClient = httpUtils.accountApi;

const callAccountApi = createServiceCaller(createAccountServiceError);

// User Management Operations

/**
 * Connect wallet and create/retrieve user
 */
export async function connectWallet(
  walletAddress: string
): Promise<ConnectWalletResponse> {
  const response = await callAccountApi(() =>
    accountApiClient.post<ConnectWalletResponse>("/users/connect-wallet", {
      wallet: walletAddress,
    })
  );

  logDevelopmentResponse("🔍 Raw connect-wallet response:", response);
  const validatedResponse = validateConnectWalletResponse(response);
  logDevelopmentResponse("✅ Validated response:", validatedResponse);

  return validatedResponse;
}

/**
 * Get complete user profile
 */
export async function getUserProfile(
  userId: string
): Promise<UserProfileResponse> {
  const response = await callAccountApi(() =>
    accountApiClient.get<UserProfileResponse>(`/users/${userId}`)
  );
  return validateUserProfileResponse(response);
}

/**
 * Update user email
 */
export async function updateUserEmail(
  userId: string,
  email: string
): Promise<UpdateEmailResponse> {
  const response = await callAccountApi(() =>
    accountApiClient.put<UpdateEmailResponse>(`/users/${userId}/email`, {
      email,
    })
  );
  return validateUpdateEmailResponse(response);
}

async function deleteUserResource(path: string): Promise<UpdateEmailResponse> {
  const response = await callAccountApi(() =>
    accountApiClient.delete<UpdateEmailResponse>(path)
  );
  return validateUpdateEmailResponse(response);
}

/**
 * Remove user email (unsubscribe from email-based reports)
 */
export async function removeUserEmail(
  userId: string
): Promise<UpdateEmailResponse> {
  return deleteUserResource(`/users/${userId}/email`);
}

/**
 * Delete user account
 * Cannot delete users with active subscriptions
 */
export async function deleteUser(userId: string): Promise<UpdateEmailResponse> {
  return deleteUserResource(`/users/${userId}`);
}

// Wallet Management Operations

/**
 * Get all user wallets
 */
export async function getUserWallets(
  userId: string
): Promise<UserCryptoWallet[]> {
  const response = await callAccountApi(() =>
    accountApiClient.get<UserCryptoWallet[]>(`/users/${userId}/wallets`)
  );
  return validateUserWallets(response);
}

/**
 * Add wallet to user bundle
 */
export async function addWalletToBundle(
  userId: string,
  walletAddress: string,
  label?: string
): Promise<AddWalletResponse> {
  const response = await callAccountApi(() =>
    accountApiClient.post<AddWalletResponse>(`/users/${userId}/wallets`, {
      wallet: walletAddress,
      label,
    })
  );
  return validateAddWalletResponse(response);
}

/**
 * Remove wallet from user bundle
 */
export async function removeWalletFromBundle(
  userId: string,
  walletId: string
): Promise<{ message: string }> {
  const response = await callAccountApi(() =>
    accountApiClient.delete<{ message: string }>(
      `/users/${userId}/wallets/${walletId}`
    )
  );
  return validateMessageResponse(response);
}

/**
 * Update wallet label
 */
export async function updateWalletLabel(
  userId: string,
  walletAddress: string,
  label: string
): Promise<{ message: string }> {
  const response = await callAccountApi(() =>
    accountApiClient.put<{ message: string }>(
      `/users/${userId}/wallets/${walletAddress}/label`,
      {
        label,
      }
    )
  );
  return validateMessageResponse(response);
}

// ETL Job Operations

/**
 * ETL job response from trigger endpoint
 */
export interface EtlJobResponse {
  job_id: string | null;
  status: string;
  message: string;
  rate_limited?: boolean;
}

/**
 * ETL job status response
 * Re-export from @davidtnfsh/etl-contracts for consistency
 */
export type { EtlJobStatus } from "@davidtnfsh/etl-contracts";

/**
 * Trigger ETL data fetch for a wallet
 * Used for on-the-fly portfolio data loading
 */
export async function triggerWalletDataFetch(
  userId: string,
  walletAddress: string
): Promise<EtlJobResponse> {
  return callAccountApi(() =>
    accountApiClient.post<EtlJobResponse>(
      `/users/${userId}/wallets/${walletAddress}/fetch-data`
    )
  );
}

/**
 * Get ETL job status by ID
 * Used for polling job completion
 */
export async function getEtlJobStatus(jobId: string): Promise<EtlJobStatus> {
  const response = await callAccountApi(() =>
    accountApiClient.get<EtlJobStatus>(`/etl/jobs/${jobId}`)
  );
  return etlJobStatusResponseSchema.parse(response);
}
