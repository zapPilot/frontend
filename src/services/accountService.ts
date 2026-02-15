/**
 * Account Service
 * Service functions for user management and wallet operations (port 3004)
 * Replaces AccountApiClient with simpler service function approach
 */

import { type EtlJobStatus } from "@davidtnfsh/etl-contracts";

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

// Re-export AccountServiceError for backward compatibility
export { AccountServiceError };

/**
 * Create enhanced error messages for common account API errors
 */
const createAccountServiceError = (error: unknown): AccountServiceError =>
  createServiceError(
    error,
    AccountServiceError,
    "Account service error",
    (status, message) => {
      // Enhance error messages based on status codes
      switch (status) {
        case 400:
          if (message?.includes("wallet")) {
            return "Invalid wallet address format. Must be a 42-character Ethereum address.";
          }
          break;
        case 404:
          return "User account not found. Please connect your wallet first.";
        case 409:
          if (message?.includes("wallet already belongs to another user")) {
            // Keep the backend's enhanced message which already includes guidance
            return message;
          }
          if (message?.includes("wallet")) {
            return "This wallet is already associated with an account.";
          } else if (message?.includes("email")) {
            return "This email address is already in use.";
          }
          break;
        case 422:
          return "Invalid request data. Please check your input and try again.";
      }
      return message;
    }
  );

const accountApiClient = httpUtils.accountApi;

const callAccountApi = createServiceCaller(createAccountServiceError);

// User Management Operations

/**
 * Connect wallet and create/retrieve user
 */
export const connectWallet = async (
  walletAddress: string
): Promise<ConnectWalletResponse> => {
  const response = await callAccountApi(() =>
    accountApiClient.post<ConnectWalletResponse>("/users/connect-wallet", {
      wallet: walletAddress,
    })
  );

  // DEBUG: Log raw response to see what API actually returns
  if (process.env.NODE_ENV === "development") {
    logger.debug(
      "🔍 Raw connect-wallet response:",
      JSON.stringify(response, null, 2)
    );
  }

  // Use safeParse to see validation details
  const validationResult = connectWalletResponseSchema.safeParse(response);
  if (!validationResult.success) {
    logger.error("❌ Validation failed:", validationResult.error.issues);
    // Still throw to maintain error handling, but we've logged the details
    throw new AccountServiceError(
      "Connect wallet response validation failed",
      500,
      "VALIDATION_ERROR",
      { issues: validationResult.error.issues }
    );
  }

  if (process.env.NODE_ENV === "development") {
    logger.debug(
      "✅ Validated response:",
      JSON.stringify(validationResult.data, null, 2)
    );
  }

  return validationResult.data as ConnectWalletResponse;
};

/**
 * Get complete user profile
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfileResponse> => {
  const response = await callAccountApi(() =>
    accountApiClient.get<UserProfileResponse>(`/users/${userId}`)
  );
  return validateUserProfileResponse(response);
};

/**
 * Update user email
 */
export const updateUserEmail = async (
  userId: string,
  email: string
): Promise<UpdateEmailResponse> => {
  const response = await callAccountApi(() =>
    accountApiClient.put<UpdateEmailResponse>(`/users/${userId}/email`, {
      email,
    })
  );
  return validateUpdateEmailResponse(response);
};

const deleteUserResource = async (
  path: string
): Promise<UpdateEmailResponse> => {
  const response = await callAccountApi(() =>
    accountApiClient.delete<UpdateEmailResponse>(path)
  );
  return validateUpdateEmailResponse(response);
};

/**
 * Remove user email (unsubscribe from email-based reports)
 */
export const removeUserEmail = async (
  userId: string
): Promise<UpdateEmailResponse> => {
  return deleteUserResource(`/users/${userId}/email`);
};

/**
 * Delete user account
 * Cannot delete users with active subscriptions
 */
export const deleteUser = async (
  userId: string
): Promise<UpdateEmailResponse> => {
  return deleteUserResource(`/users/${userId}`);
};

// Wallet Management Operations

/**
 * Get all user wallets
 */
export const getUserWallets = async (
  userId: string
): Promise<UserCryptoWallet[]> => {
  const response = await callAccountApi(() =>
    accountApiClient.get<UserCryptoWallet[]>(`/users/${userId}/wallets`)
  );
  return validateUserWallets(response);
};

/**
 * Add wallet to user bundle
 */
export const addWalletToBundle = async (
  userId: string,
  walletAddress: string,
  label?: string
): Promise<AddWalletResponse> => {
  const response = await callAccountApi(() =>
    accountApiClient.post<AddWalletResponse>(`/users/${userId}/wallets`, {
      wallet: walletAddress,
      label,
    })
  );
  return validateAddWalletResponse(response);
};

/**
 * Remove wallet from user bundle
 */
export const removeWalletFromBundle = async (
  userId: string,
  walletId: string
): Promise<{ message: string }> => {
  const response = await callAccountApi(() =>
    accountApiClient.delete<{ message: string }>(
      `/users/${userId}/wallets/${walletId}`
    )
  );
  return validateMessageResponse(response);
};

/**
 * Update wallet label
 */
export const updateWalletLabel = async (
  userId: string,
  walletAddress: string,
  label: string
): Promise<{ message: string }> => {
  const response = await callAccountApi(() =>
    accountApiClient.put<{ message: string }>(
      `/users/${userId}/wallets/${walletAddress}/label`,
      {
        label,
      }
    )
  );
  return validateMessageResponse(response);
};

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
export const triggerWalletDataFetch = async (
  userId: string,
  walletAddress: string
): Promise<EtlJobResponse> => {
  return callAccountApi(() =>
    accountApiClient.post<EtlJobResponse>(
      `/users/${userId}/wallets/${walletAddress}/fetch-data`
    )
  );
};

/**
 * Get ETL job status by ID
 * Used for polling job completion
 */
export const getEtlJobStatus = async (jobId: string): Promise<EtlJobStatus> => {
  const response = await callAccountApi(() =>
    accountApiClient.get<EtlJobStatus>(`/etl/jobs/${jobId}`)
  );
  // Validate response against contract schema
  return etlJobStatusResponseSchema.parse(response);
};
