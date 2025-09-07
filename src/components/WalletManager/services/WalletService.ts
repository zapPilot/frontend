import {
  addWalletToBundle,
  getUserWallets,
  removeWalletFromBundle,
  transformWalletData,
  updateUserEmail,
  removeUserEmail,
  updateWalletLabel,
  type WalletData,
} from "../../../services/userService";

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
   * Update user email for subscription
   */
  static async updateUserEmailSubscription(
    userId: string,
    email: string
  ): Promise<void> {
    await updateUserEmail(userId, email);
  }

  /**
   * Unsubscribe user email (DELETE /users/:userId/email)
   */
  static async unsubscribeUserEmail(userId: string): Promise<void> {
    await removeUserEmail(userId);
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
