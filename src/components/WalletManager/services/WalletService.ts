import { transformWalletData, type WalletData } from "../../../lib/walletUtils";
import {
  addWalletToBundle,
  getUserWallets,
  removeUserEmail as removeUserEmailRequest,
  removeWalletFromBundle,
  updateUserEmail,
  updateWalletLabel as updateWalletLabelRequest,
} from "../../../services/accountService";

/**
 * Load wallets for a specific user and normalise the API response.
 */
export async function loadWallets(userId: string): Promise<WalletData[]> {
  try {
    const wallets = await getUserWallets(userId);
    return transformWalletData(wallets);
  } catch {
    // Return empty array if fetching wallets fails
    return [];
  }
}

/**
 * Add a wallet to a user's bundle.
 */
export async function addWallet(
  userId: string,
  address: string,
  label: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await addWalletToBundle(userId, address, label);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Remove a wallet from the user's bundle.
 */
export async function removeWallet(
  userId: string,
  walletId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await removeWalletFromBundle(userId, walletId);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update a wallet label within the user's bundle.
 */
export async function updateWalletLabel(
  userId: string,
  walletAddress: string,
  newLabel: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateWalletLabelRequest(userId, walletAddress, newLabel);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Subscribe a user to email updates for bundle activity.
 */
export async function updateUserEmailSubscription(
  userId: string,
  email: string
): Promise<void> {
  await updateUserEmail(userId, email);
}

/**
 * Remove the user's email subscription.
 */
export async function unsubscribeUserEmail(userId: string): Promise<void> {
  await removeUserEmailRequest(userId);
}
