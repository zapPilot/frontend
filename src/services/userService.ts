/**
 * User Service for Account-Engine API Integration
 * Provides wallet bundle management and user profile operations
 */

import { handleAPIError } from "../lib/api-client";
import { accountApiClient, AccountApiError } from "../lib/clients";
import {
  AddWalletResponse,
  ConnectWalletResponse,
  ServiceResponse,
  UpdateEmailResponse,
  UserCryptoWallet,
  UserProfileResponse,
} from "../types/user.types";

// Using the new service-specific AccountApiClient

/**
 * Connect wallet and create/retrieve user
 * Creates new user if wallet doesn't exist, returns existing user otherwise
 */
export const connectWallet = async (
  wallet: string
): Promise<ServiceResponse<ConnectWalletResponse>> => {
  try {
    const data = await accountApiClient.connectWallet(wallet);

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleWalletError(error),
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
    const data = await accountApiClient.getUserProfile(userId);

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleWalletError(error),
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
    const data = await accountApiClient.getUserWallets(userId);

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleWalletError(error),
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
    const data = await accountApiClient.addWalletToBundle(
      userId,
      wallet,
      label
    );

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleWalletError(error),
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
    const data = await accountApiClient.removeWalletFromBundle(
      userId,
      walletId
    );

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleWalletError(error),
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
    const data = await accountApiClient.updateUserEmail(userId, email);

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: handleWalletError(error),
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
  // Use service-specific error handling first
  if (error instanceof AccountApiError) {
    // AccountApiClient already provides enhanced error messages
    return error.message;
  }

  // Fallback to generic error handling
  return handleAPIError(error);
};

// Export convenience type for component usage
export type WalletData = ReturnType<typeof transformWalletData>[0];
