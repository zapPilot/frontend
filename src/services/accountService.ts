/**
 * Account Service
 * Service functions for user management and wallet operations (port 3004)
 * Replaces AccountApiClient with simpler service function approach
 */

import { httpUtils } from "@/lib/http-utils";
import {
  validateAccountTokens,
  validateAddWalletResponse,
  validateConnectWalletResponse,
  validateHealthCheckResponse,
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

import { createServiceCaller } from "../lib/createServiceCaller";

/**
 * Account Service Error Details
 */
interface AccountServiceErrorDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
  [key: string]: unknown;
}

/**
 * AccountServiceError maintains the shape of API errors without depending on the
 * HTTP utilities module (which is frequently mocked in tests).
 * This keeps the constructor available even when http-utils is mocked.
 */
export class AccountServiceError extends Error {
  status: number;
  code?: string;
  details?: AccountServiceErrorDetails;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: AccountServiceErrorDetails
  ) {
    super(message);
    this.name = "AccountServiceError";
    this.status = status;
    if (code !== undefined) {
      this.code = code;
    }
    if (details !== undefined) {
      this.details = details;
    }
  }
}

/**
 * Internal token interface for getUserTokens endpoint
 */
interface AccountToken {
  id: string;
  chain: string;
  name: string;
  symbol: string;
  display_symbol: string;
  optimized_symbol: string;
  decimals: number;
  logo_url: string;
  protocol_id: string;
  price: number;
  is_verified: boolean;
  is_core: boolean;
  is_wallet: boolean;
  time_at: number;
  amount: number;
}

/**
 * API Error Response Structure
 */
interface ApiErrorResponse {
  status?: number;
  message?: string;
  code?: string;
  details?: AccountServiceErrorDetails;
  response?: {
    status?: number;
  };
}

/**
 * Type guard for API error response
 */
function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return error !== null && typeof error === "object";
}

/**
 * Create enhanced error messages for common account API errors
 */
const createAccountServiceError = (error: unknown): AccountServiceError => {
  const apiError = isApiErrorResponse(error) ? error : {};
  const status = apiError.status || apiError.response?.status || 500;
  let message = apiError.message || "Account service error";

  // Enhance error messages based on status codes
  switch (status) {
    case 400:
      if (message?.includes("wallet")) {
        message =
          "Invalid wallet address format. Must be a 42-character Ethereum address.";
      }
      break;
    case 404:
      message = "User account not found. Please connect your wallet first.";
      break;
    case 409:
      if (message?.includes("wallet already belongs to another user")) {
        // Keep the backend's enhanced message which already includes guidance
        // The backend now returns: "Wallet already belongs to another user, please delete one of the accounts instead"
        break;
      }
      if (message?.includes("wallet")) {
        message = "This wallet is already associated with an account.";
      } else if (message?.includes("email")) {
        message = "This email address is already in use.";
      }
      break;
    case 422:
      message = "Invalid request data. Please check your input and try again.";
      break;
  }

  const errorData =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : {};

  return new AccountServiceError(
    message,
    status,
    errorData["code"] as string,
    errorData["details"] as Record<string, unknown>
  );
};

const accountApiClient = httpUtils.accountApi;
const backendApiClient = httpUtils.backendApi;

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
  return validateConnectWalletResponse(response);
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

/**
 * Remove user email (unsubscribe from email-based reports)
 */
export const removeUserEmail = async (
  userId: string
): Promise<UpdateEmailResponse> => {
  const response = await callAccountApi(() =>
    accountApiClient.delete<UpdateEmailResponse>(`/users/${userId}/email`)
  );
  return validateUpdateEmailResponse(response);
};

/**
 * Delete user account
 * Cannot delete users with active subscriptions
 */
export const deleteUser = async (
  userId: string
): Promise<UpdateEmailResponse> => {
  const response = await callAccountApi(() =>
    accountApiClient.delete<UpdateEmailResponse>(`/users/${userId}`)
  );
  return validateUpdateEmailResponse(response);
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

// Utility Functions

/**
 * Health check for account service
 */
export const checkAccountServiceHealth = async (): Promise<{
  status: string;
  timestamp: string;
}> => {
  const response = await callAccountApi(() =>
    accountApiClient.get<{
      status: string;
      timestamp: string;
    }>("/health")
  );
  return validateHealthCheckResponse(response);
};

/**
 * Get user tokens for a specific chain
 */
export const getUserTokens = async (
  accountAddress: string,
  chainName: string
): Promise<AccountToken[]> => {
  const response = await callAccountApi(() =>
    backendApiClient.get<AccountToken[]>(
      `/user/${accountAddress}/${chainName}/tokens`
    )
  );
  return validateAccountTokens(response);
};
