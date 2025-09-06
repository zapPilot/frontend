/**
 * Bundle Service - Handles bundle metadata and sharing functionality
 */

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

class BundleService {
  /**
   * Get user information for a bundle
   */
  async getBundleUser(userId: string): Promise<BundleUser | null> {
    try {
      // TODO: Replace with actual API call to get user info
      // For now, return basic user info based on userId
      return {
        userId,
        displayName: this.generateDisplayName(userId),
      };
    } catch (error) {
      console.error("Failed to fetch bundle user:", error);
      return null;
    }
  }

  /**
   * Generate a display name from userId
   */
  private generateDisplayName(userId: string): string {
    if (userId.length <= 6) return userId;
    return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
  }

  /**
   * Generate bundle URL for sharing
   */
  generateBundleUrl(userId: string): string {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({ userId });
    return `${baseUrl}/bundle?${params.toString()}`;
  }

  /**
   * Parse bundle URL to extract userId
   */
  parseBundleUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("userId");
    } catch {
      return null;
    }
  }

  /**
   * Check if current user owns the bundle
   */
  isOwnBundle(bundleUserId: string, currentUserId?: string | null): boolean {
    return !!currentUserId && currentUserId === bundleUserId;
  }

  /**
   * Get bundle metadata
   */
  async getBundleMetadata(userId: string): Promise<BundleMetadata | null> {
    try {
      const user = await this.getBundleUser(userId);
      if (!user) return null;

      return {
        user,
        isPublic: true, // All bundles are public based on requirements
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Failed to fetch bundle metadata:", error);
      return null;
    }
  }
}

// Export singleton instance
export const bundleService = new BundleService();