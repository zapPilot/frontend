/**
 * Bundle Service - Handles bundle metadata and sharing functionality
 *
 * Architecture: Service layer for async API calls only
 * Pure utilities moved to @/lib/bundle for better separation of concerns
 */

import { formatAddress } from "@/utils/formatters";
import { logger } from "@/utils/logger";

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
export async function getBundleUser(
  userId: string
): Promise<BundleUser | null> {
  try {
    return {
      userId,
      displayName: formatAddress(userId),
    };
  } catch (error) {
    bundleLogger.error("Failed to fetch bundle user:", error);
    return null;
  }
}
