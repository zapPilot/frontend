/**
 * User Service for Account-Engine API Integration
 * Provides wallet bundle management and user profile operations
 */

import { APIError, createApiClient, handleAPIError } from "../lib/api-client";
import {
  AddWalletDto,
  AddWalletResponse,
  ConnectWalletResponse,
  ServiceResponse,
  UpdateEmailDto,
  UpdateEmailResponse,
  UserCryptoWallet,
  UserProfileResponse,
} from "../types/user.types";

const accountEngineApi = createApiClient.accountApi;

/**
 * Connect wallet and create/retrieve user
 * Creates new user if wallet doesn't exist, returns existing user otherwise
 */
export const connectWallet = async (
  wallet: string
): Promise<ServiceResponse<ConnectWalletResponse>> => {
  try {
    const data = await accountEngineApi.get<ConnectWalletResponse>(
      `/users/connect-wallet?wallet=${encodeURIComponent(wallet)}`
    );

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleAPIError(error),
      success: false,
    };
  }
};

/**
 * Get complete user profile including wallets and subscription
 */
export const getUserProfile = async (
  userId: string
): Promise<ServiceResponse<UserProfileResponse>> => {
  try {
    const data = await accountEngineApi.get<UserProfileResponse>(
      `/users/${userId}`
    );

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleAPIError(error),
      success: false,
    };
  }
};

/**
 * Get all visible wallets for a user
 * Returns wallets ordered by main wallet first
 */
export const getUserWallets = async (
  userId: string
): Promise<ServiceResponse<UserCryptoWallet[]>> => {
  try {
    const data = await accountEngineApi.get<UserCryptoWallet[]>(
      `/users/${userId}/wallets`
    );

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleAPIError(error),
      success: false,
    };
  }
};

/**
 * Add a new wallet to user's bundle
 * Wallet will be marked as non-main with optional custom label
 */
export const addWalletToBundle = async (
  userId: string,
  wallet: string,
  label?: string
): Promise<ServiceResponse<AddWalletResponse>> => {
  try {
    const data = await accountEngineApi.post<AddWalletResponse>(
      `/users/${userId}/wallets`,
      { wallet, label } as AddWalletDto
    );

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleAPIError(error),
      success: false,
    };
  }
};

/**
 * Remove wallet from user's bundle (soft delete)
 * Cannot remove main wallet
 */
export const removeWalletFromBundle = async (
  userId: string,
  walletId: string
): Promise<ServiceResponse<{ message: string }>> => {
  try {
    const data = await accountEngineApi.delete<{ message: string }>(
      `/users/${userId}/wallets/${walletId}`
    );

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleAPIError(error),
      success: false,
    };
  }
};

/**
 * Update user's email address
 */
export const updateUserEmail = async (
  userId: string,
  email: string
): Promise<ServiceResponse<UpdateEmailResponse>> => {
  try {
    const data = await accountEngineApi.put<UpdateEmailResponse>(
      `/users/${userId}/email`,
      { email } as UpdateEmailDto
    );

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleAPIError(error),
      success: false,
    };
  }
};

/**
 * Validate wallet address format
 */
export const validateWalletAddress = (address: string): boolean => {
  // Ethereum wallet address: 42 characters, starts with 0x, followed by 40 hex characters
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethRegex.test(address);
};

/**
 * Transform UserCryptoWallet to component-friendly format
 * Maintains compatibility with existing WalletManager component structure
 */
export const transformWalletData = (wallets: UserCryptoWallet[]) => {
  return wallets.map(wallet => ({
    id: wallet.id,
    address: wallet.wallet,
    label:
      wallet.label || (wallet.is_main ? "Primary Wallet" : "Additional Wallet"),
    isMain: wallet.is_main,
    isActive: wallet.is_main, // Only main wallet is considered active for now
    isVisible: wallet.is_visible,
    createdAt: wallet.created_at,
  }));
};

/**
 * Get main wallet address from wallet list
 */
export const getMainWallet = (
  wallets: UserCryptoWallet[]
): UserCryptoWallet | null => {
  return wallets.find(wallet => wallet.is_main) || null;
};

/**
 * Error handling specific to wallet operations
 */
export const handleWalletError = (error: unknown): string => {
  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        if (error.message.includes("42 characters")) {
          return "Invalid wallet address format. Address must be 42 characters long.";
        }
        if (error.message.includes("main wallet")) {
          return "Cannot remove the main wallet from your bundle.";
        }
        break;
      case 404:
        return "User or wallet not found.";
      case 409:
        if (error.message.includes("already exists")) {
          return "This wallet is already in your bundle.";
        }
        if (error.message.includes("email")) {
          return "This email address is already in use.";
        }
        break;
    }
  }

  return handleAPIError(error);
};

// Export convenience type for component usage
export type WalletData = ReturnType<typeof transformWalletData>[0];
