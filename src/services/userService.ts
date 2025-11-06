/**
 * User Service for Account-Engine API Integration
 * Provides wallet bundle management and user profile operations
 */

import { handleHTTPError } from "@/lib/http-utils";

import {
  AddWalletResponse,
  ConnectWalletResponse,
  ServiceResponse,
  UpdateEmailResponse,
  UserCryptoWallet,
  UserProfileResponse,
} from "../types/user.types";
import {
  AccountServiceError,
  addWalletToBundle as addWalletToBundleService,
  connectWallet as connectWalletService,
  deleteUser as deleteUserService,
  getUserProfile as getUserProfileService,
  getUserWallets as getUserWalletsService,
  removeUserEmail as removeUserEmailService,
  removeWalletFromBundle as removeWalletFromBundleService,
  updateUserEmail as updateUserEmailService,
  updateWalletLabel as updateWalletLabelService,
} from "./accountService";

// Using the new service-specific AccountApiClient

/**
 * Connect wallet and create/retrieve user
 * Creates new user if wallet doesn't exist, returns existing user otherwise
 */
export const connectWallet = async (
  wallet: string
): Promise<ServiceResponse<ConnectWalletResponse>> => {
  try {
    const data = await connectWalletService(wallet);

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
    const data = await getUserProfileService(userId);

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
    const data = await getUserWalletsService(userId);

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
    const data = await addWalletToBundleService(userId, wallet, label);

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
    const data = await removeWalletFromBundleService(userId, walletId);

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
    const data = await updateUserEmailService(userId, email);

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
 * Remove user's email (unsubscribe)
 */
export const removeUserEmail = async (
  userId: string
): Promise<ServiceResponse<UpdateEmailResponse>> => {
  try {
    const data = await removeUserEmailService(userId);

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
 * Delete user account
 * Cannot delete users with active subscriptions
 */
export const deleteUser = async (
  userId: string
): Promise<ServiceResponse<UpdateEmailResponse>> => {
  try {
    const data = await deleteUserService(userId);

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
 * Update wallet label
 */
export const updateWalletLabel = async (
  userId: string,
  walletAddress: string,
  label: string
): Promise<ServiceResponse<{ message: string }>> => {
  try {
    const data = await updateWalletLabelService(userId, walletAddress, label);

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
    label: wallet.label || "Wallet",
    isMain: false, // Legacy field - no longer meaningful
    isActive: false, // Legacy field - no longer meaningful
    createdAt: wallet.created_at,
  }));
};

/**
 * Error handling specific to wallet operations
 */
export const handleWalletError = (error: unknown): string => {
  // Use service-specific error handling first
  // Check both instanceof and name property for better test compatibility
  if (
    error instanceof AccountServiceError ||
    (error instanceof Error && error.name === "AccountServiceError")
  ) {
    // AccountService already provides enhanced error messages
    return (error as Error).message;
  }

  // Fallback to generic error handling
  return handleHTTPError(error);
};

// Export convenience type for component usage
export type WalletData = ReturnType<typeof transformWalletData>[0];
