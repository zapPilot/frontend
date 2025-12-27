/**
 * Bundle Service - Handles bundle metadata and sharing functionality
 */

import { formatAddress } from "@/utils/formatters";
import { logger } from "@/utils/logger";

export interface BundleUser {
  userId: string;
  displayName?: string;
  avatar?: string;
}

const bundleLogger = logger.createContextLogger("BundleService");

/**
 * Get user information for a bundle
 */
export const getBundleUser = async (
  userId: string
): Promise<BundleUser | null> => {
  try {
    // ZAP-206: Pending API implementation for user info
    // Currently returns basic user info based on userId
    return {
      userId,
      displayName: formatAddress(userId),
    };
  } catch (error) {
    bundleLogger.error("Failed to fetch bundle user:", error);
    return null;
  }
};

/**
 * Generate bundle URL for sharing
 * @param userId - User wallet address (required)
 * @param walletId - Specific wallet address (optional, V22 Phase 2A)
 * @param baseUrl - Base URL (optional, defaults to relative path for SSR consistency)
 *
 * Note: Returns relative path by default to avoid SSR hydration mismatch.
 * Pass explicit baseUrl for absolute URLs (e.g., for sharing to external services).
 */
export const generateBundleUrl = (
  userId: string,
  walletId?: string,
  baseUrl?: string
): string => {
  const params = new URLSearchParams({ userId });

  if (walletId) {
    params.set("walletId", walletId);
  }

  const path = `/bundle?${params.toString()}`;

  // Only prefix with baseUrl if explicitly provided
  // This avoids SSR hydration mismatch (server has no window.location)
  if (baseUrl) {
    return `${baseUrl}${path}`;
  }

  return path;
};

/**
 * Check if current user owns the bundle
 */
export const isOwnBundle = (
  bundleUserId: string,
  currentUserId?: string | null
): boolean => !!currentUserId && currentUserId === bundleUserId;
