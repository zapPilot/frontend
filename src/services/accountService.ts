/**
 * Account Service
 * Service functions for user management and wallet operations (port 3004)
 * Replaces AccountApiClient with simpler service function approach
 */

import { httpUtils } from "../lib/http-utils";
import type {
  AddWalletResponse,
  ConnectWalletResponse,
  UpdateEmailResponse,
  UserCryptoWallet,
  UserProfileResponse,
} from "../types/user.types";
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
 * Account Service Error
 */
export class AccountServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: AccountServiceErrorDetails
  ) {
    super(message);
    this.name = "AccountServiceError";
  }
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
export const connectWallet = (
  walletAddress: string
): Promise<ConnectWalletResponse> =>
  callAccountApi(() =>
    accountApiClient.post<ConnectWalletResponse>("/users/connect-wallet", {
      wallet: walletAddress,
    })
  );

/**
 * Get complete user profile
 */
export const getUserProfile = (userId: string): Promise<UserProfileResponse> =>
  callAccountApi(() =>
    accountApiClient.get<UserProfileResponse>(`/users/${userId}`)
  );

/**
 * Update user email
 */
export const updateUserEmail = (
  userId: string,
  email: string
): Promise<UpdateEmailResponse> =>
  callAccountApi(() =>
    accountApiClient.put<UpdateEmailResponse>(`/users/${userId}/email`, {
      email,
    })
  );

/**
 * Remove user email (unsubscribe from email-based reports)
 */
export const removeUserEmail = (userId: string): Promise<UpdateEmailResponse> =>
  callAccountApi(() =>
    accountApiClient.delete<UpdateEmailResponse>(`/users/${userId}/email`)
  );

/**
 * Delete user account
 * Cannot delete users with active subscriptions
 */
export const deleteUser = (userId: string): Promise<UpdateEmailResponse> =>
  callAccountApi(() =>
    accountApiClient.delete<UpdateEmailResponse>(`/users/${userId}`)
  );

// Wallet Management Operations

/**
 * Get all user wallets
 */
export const getUserWallets = (userId: string): Promise<UserCryptoWallet[]> =>
  callAccountApi(() =>
    accountApiClient.get<UserCryptoWallet[]>(`/users/${userId}/wallets`)
  );

/**
 * Add wallet to user bundle
 */
export const addWalletToBundle = (
  userId: string,
  walletAddress: string,
  label?: string
): Promise<AddWalletResponse> =>
  callAccountApi(() =>
    accountApiClient.post<AddWalletResponse>(`/users/${userId}/wallets`, {
      wallet: walletAddress,
      label,
    })
  );

/**
 * Remove wallet from user bundle
 */
export const removeWalletFromBundle = (
  userId: string,
  walletId: string
): Promise<{ message: string }> =>
  callAccountApi(() =>
    accountApiClient.delete<{ message: string }>(
      `/users/${userId}/wallets/${walletId}`
    )
  );

/**
 * Update wallet label
 */
export const updateWalletLabel = (
  userId: string,
  walletAddress: string,
  label: string
): Promise<{ message: string }> =>
  callAccountApi(() =>
    accountApiClient.put<{ message: string }>(
      `/users/${userId}/wallets/${walletAddress}/label`,
      {
        label,
      }
    )
  );

// Utility Functions

/**
 * Health check for account service
 */
export const checkAccountServiceHealth = (): Promise<{
  status: string;
  timestamp: string;
}> =>
  callAccountApi(() =>
    accountApiClient.get<{
      status: string;
      timestamp: string;
    }>("/health")
  );

/**
 * Get user tokens for a specific chain
 */
export const getUserTokens = (
  accountAddress: string,
  chainName: string
): Promise<
  Array<{
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
  }>
> =>
  callAccountApi(() =>
    backendApiClient.get<
      Array<{
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
      }>
    >(`/user/${accountAddress}/${chainName}/tokens`)
  );
