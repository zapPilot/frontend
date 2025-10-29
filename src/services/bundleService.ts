/**
 * Bundle Service - Handles bundle metadata and sharing functionality
 */

import { logger } from "@/utils/logger";
import { formatAddress } from "@/lib/formatters";

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

const resolveBaseUrl = (providedBaseUrl?: string): string => {
  if (providedBaseUrl) {
    return providedBaseUrl;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  const envBase = process.env["NEXT_PUBLIC_SITE_URL"]?.trim();
  return envBase ?? "";
};

/**
 * Get user information for a bundle
 */
export const getBundleUser = async (
  userId: string
): Promise<BundleUser | null> => {
  try {
    // TODO(ZAP-206): Replace with actual API call to get user info
    // For now, return basic user info based on userId
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
 */
export const generateBundleUrl = (userId: string, baseUrl?: string): string => {
  const resolvedBaseUrl = resolveBaseUrl(baseUrl);
  const params = new URLSearchParams({ userId });
  const path = `/bundle?${params.toString()}`;
  return resolvedBaseUrl ? `${resolvedBaseUrl}${path}` : path;
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
