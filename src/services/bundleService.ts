/**
 * Bundle Service - Handles bundle metadata and sharing functionality
 */

import { logger } from "@/utils/logger";

export interface BundleUser {
  userId: string;
  displayName?: string;
  avatar?: string;
}

export interface BundleMetadata {
  user: BundleUser;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bundleLogger = logger.createContextLogger("BundleService");

const generateDisplayName = (userId: string): string => {
  if (userId.length <= 6) return userId;
  return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
};

/**
 * Get user information for a bundle
 */
export const getBundleUser = async (
  userId: string
): Promise<BundleUser | null> => {
  try {
    // TODO: Replace with actual API call to get user info
    // For now, return basic user info based on userId
    return {
      userId,
      displayName: generateDisplayName(userId),
    };
  } catch (error) {
    bundleLogger.error("Failed to fetch bundle user:", error);
    return null;
  }
};

/**
 * Generate bundle URL for sharing
 */
export const generateBundleUrl = (userId: string): string => {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({ userId });
  return `${baseUrl}/bundle?${params.toString()}`;
};

/**
 * Parse bundle URL to extract userId
 */
export const parseBundleUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("userId");
  } catch {
    return null;
  }
};

/**
 * Check if current user owns the bundle
 */
export const isOwnBundle = (
  bundleUserId: string,
  currentUserId?: string | null
): boolean => !!currentUserId && currentUserId === bundleUserId;

/**
 * Get bundle metadata
 */
export const getBundleMetadata = async (
  userId: string
): Promise<BundleMetadata | null> => {
  try {
    const user = await getBundleUser(userId);
    if (!user) return null;

    return {
      user,
      isPublic: true, // All bundles are public based on requirements
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    bundleLogger.error("Failed to fetch bundle metadata:", error);
    return null;
  }
};
