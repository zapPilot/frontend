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
import { apiClient } from "../lib/api-client";

// Configuration
const ACCOUNT_API_CONFIG = {
  baseURL: process.env["NEXT_PUBLIC_ACCOUNT_API_URL"] || "http://127.0.0.1:3004",
  timeout: 8000,
  retries: 2,
  headers: {
    "X-Service": "account-api",
  },
};

// Configure apiClient for account service if needed
const getAccountApiClient = () => {
  // Use existing apiClient with account-specific configuration
  return apiClient;
};

/**
 * Account Service Error
 */
export class AccountServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "AccountServiceError";
  }
}

/**
 * Create enhanced error messages for common account API errors
 */
const createAccountServiceError = (error: any): AccountServiceError => {
  const status = error.status || error.response?.status || 500;
  let message = error.message || "Account service error";

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

  return new AccountServiceError(
    message,
    status,
    error.code,
    error.details
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
    const client = getAccountApiClient();
    const response = await client.post<ConnectWalletResponse>(
      `${ACCOUNT_API_CONFIG.baseURL}/users/connect-wallet`,
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
    const client = getAccountApiClient();
    return await client.get<UserProfileResponse>(
      `${ACCOUNT_API_CONFIG.baseURL}/users/${userId}`
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
    const client = getAccountApiClient();
    return await client.put<UpdateEmailResponse>(
      `${ACCOUNT_API_CONFIG.baseURL}/users/${userId}/email`,
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
    const client = getAccountApiClient();
    return await client.get<UserCryptoWallet[]>(
      `${ACCOUNT_API_CONFIG.baseURL}/users/${userId}/wallets`
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
    const client = getAccountApiClient();
    return await client.post<AddWalletResponse>(
      `${ACCOUNT_API_CONFIG.baseURL}/users/${userId}/wallets`,
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
    const client = getAccountApiClient();
    return await client.delete<{ message: string }>(
      `${ACCOUNT_API_CONFIG.baseURL}/users/${userId}/wallets/${walletId}`
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
    const client = getAccountApiClient();
    return await client.put<{ message: string }>(
      `${ACCOUNT_API_CONFIG.baseURL}/users/${userId}/wallets/${walletId}`,
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
    const client = getAccountApiClient();
    return await client.get<{ status: string; timestamp: string }>(
      `${ACCOUNT_API_CONFIG.baseURL}/health`
    );
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