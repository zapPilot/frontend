/**
 * Account Service
 * Service functions for user management and wallet operations (port 3004)
 * Replaces AccountApiClient with simpler service function approach
 */

import type {
  AddWalletResponse,
  ConnectWalletResponse,
  UpdateEmailResponse,
  UserCryptoWallet,
  UserProfileResponse,
} from "../types/user.types";
import { httpUtils } from "../lib/http-utils";

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

// User Management Operations

/**
 * Connect wallet and create/retrieve user
 */
export const connectWallet = async (
  walletAddress: string
): Promise<ConnectWalletResponse> => {
  try {
    const response = await httpUtils.accountApi.post<ConnectWalletResponse>(
      "/users/connect-wallet",
      {
        wallet: walletAddress,
      }
    );
    return response;
  } catch (error) {
    throw createAccountServiceError(error);
  }
};

/**
 * Get complete user profile
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfileResponse> => {
  try {
    return await httpUtils.accountApi.get<UserProfileResponse>(
      `/users/${userId}`
    );
  } catch (error) {
    throw createAccountServiceError(error);
  }
};

/**
 * Update user email
 */
export const updateUserEmail = async (
  userId: string,
  email: string
): Promise<UpdateEmailResponse> => {
  try {
    return await httpUtils.accountApi.put<UpdateEmailResponse>(
      `/users/${userId}/email`,
      { email }
    );
  } catch (error) {
    throw createAccountServiceError(error);
  }
};

// Wallet Management Operations

/**
 * Get all user wallets
 */
export const getUserWallets = async (
  userId: string
): Promise<UserCryptoWallet[]> => {
  try {
    return await httpUtils.accountApi.get<UserCryptoWallet[]>(
      `/users/${userId}/wallets`
    );
  } catch (error) {
    throw createAccountServiceError(error);
  }
};

/**
 * Add wallet to user bundle
 */
export const addWalletToBundle = async (
  userId: string,
  walletAddress: string,
  label?: string
): Promise<AddWalletResponse> => {
  try {
    return await httpUtils.accountApi.post<AddWalletResponse>(
      `/users/${userId}/wallets`,
      {
        wallet: walletAddress,
        label,
      }
    );
  } catch (error) {
    throw createAccountServiceError(error);
  }
};

/**
 * Remove wallet from user bundle
 */
export const removeWalletFromBundle = async (
  userId: string,
  walletId: string
): Promise<{ message: string }> => {
  try {
    return await httpUtils.accountApi.delete<{ message: string }>(
      `/users/${userId}/wallets/${walletId}`
    );
  } catch (error) {
    throw createAccountServiceError(error);
  }
};

/**
 * Update wallet label
 */
export const updateWalletLabel = async (
  userId: string,
  walletId: string,
  label: string
): Promise<{ message: string }> => {
  try {
    return await httpUtils.accountApi.put<{ message: string }>(
      `/users/${userId}/wallets/${walletId}`,
      {
        label,
      }
    );
  } catch (error) {
    throw createAccountServiceError(error);
  }
};

// Utility Functions

/**
 * Health check for account service
 */
export const checkAccountServiceHealth = async (): Promise<{
  status: string;
  timestamp: string;
}> => {
  try {
    return await httpUtils.accountApi.get<{
      status: string;
      timestamp: string;
    }>("/health");
  } catch (error) {
    throw createAccountServiceError(error);
  }
};

/**
 * Get user tokens for a specific chain
 */
export const getUserTokens = async (
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
> => {
  try {
    return await httpUtils.backendApi.get<
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
    >(`/user/${accountAddress}/${chainName}/tokens`);
  } catch (error) {
    throw createAccountServiceError(error);
  }
};

/**
 * Validate wallet address format client-side before API call
 */
export const validateWalletAddress = (address: string): boolean => {
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethRegex.test(address);
};
