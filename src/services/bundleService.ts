/**
 * Bundle Service - Handles bundle metadata and sharing functionality
 *
 * Architecture: Service layer for async API calls only
 * Pure utilities moved to @/lib/bundle for better separation of concerns
 */

import { formatAddress } from "@/utils/formatters";
import { logger } from "@/utils/logger";

// Re-export utilities from lib for backward compatibility
// Prefer importing directly from @/lib/bundle in new code
export { generateBundleUrl, isOwnBundle } from "@/lib/bundle/bundleUtils";

export interface BundleUser {
  userId: string;
  displayName?: string;
  avatar?: string;
}

const bundleLogger = logger.createContextLogger("BundleService");

/**
 * Get user information for a bundle
 *
 * Service function: Performs async API call to fetch user data
 *
 * @param userId - User wallet address
 * @returns Promise resolving to user information or null on error
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
