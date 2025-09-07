import {
  addWalletToBundle,
  getUserProfile,
  getUserWallets,
  removeWalletFromBundle,
  transformWalletData,
  updateUserEmail,
  updateWalletLabel,
  type WalletData,
} from "@/services/userService";

export class WalletService {
  /**
   * Load wallets for a specific user
   */
  static async loadWallets(userId: string): Promise<WalletData[]> {
    const response = await getUserWallets(userId);
    if (response.success && response.data) {
      return transformWalletData(response.data);
    }
    return [];
  }

  /**
   * Add a wallet to user's bundle
   */
  static async addWallet(
    userId: string,
    address: string,
    label: string
  ): Promise<{ success: boolean; error?: string }> {
    return addWalletToBundle(userId, address, label);
  }

  /**
   * Remove a wallet from user's bundle
   */
  static async removeWallet(
    userId: string,
    walletId: string
  ): Promise<{ success: boolean; error?: string }> {
    return removeWalletFromBundle(userId, walletId);
  }

  /**
   * Update wallet label
   */
  static async updateWalletLabel(
    userId: string,
    walletAddress: string,
    newLabel: string
  ): Promise<{ success: boolean; error?: string }> {
    return updateWalletLabel(userId, walletAddress, newLabel);
  }

  /**
   * Load user profile to get email subscription status
   */
  static async loadUserProfile(userId: string): Promise<{
    email: string | null;
    hasSubscription: boolean;
  }> {
    try {
      const profile = await getUserProfile(userId);
      if (profile.success && profile.data?.user) {
        return {
          email: profile.data.user.email || null,
          hasSubscription: !!profile.data.user.email,
        };
      }
      return { email: null, hasSubscription: false };
    } catch {
      return { email: null, hasSubscription: false };
    }
  }

  /**
   * Update user email for subscription
   */
  static async updateUserEmailSubscription(
    userId: string,
    email: string
  ): Promise<void> {
    await updateUserEmail(userId, email);
  }

  /**
   * Format wallet address for display
   */
  static formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Copy address to clipboard with fallback
   */
  static async copyToClipboard(address: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(address);
      return true;
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    }
  }
}
