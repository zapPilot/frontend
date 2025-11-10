/**
 * Wallet Utility Functions
 * Validation, transformation, and error handling for wallet operations
 */

import { APIError, handleHTTPError } from "@/lib/http-utils";
import type { UserCryptoWallet } from "@/types/user.types";

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
  // APIError includes AccountServiceError (re-exported in accountService)
  if (
    error instanceof APIError ||
    (error instanceof Error &&
      (error.name === "APIError" || error.name === "AccountServiceError"))
  ) {
    // API error already provides enhanced error messages
    return (error as Error).message;
  }

  // Fallback to generic error handling
  return handleHTTPError(error);
};

// Export convenience type for component usage
export type WalletData = ReturnType<typeof transformWalletData>[0];
