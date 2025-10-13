import {
  addWalletToBundle,
  getUserWallets,
  removeUserEmail as removeUserEmailRequest,
  removeWalletFromBundle,
  transformWalletData,
  updateUserEmail,
  updateWalletLabel as updateWalletLabelRequest,
  type WalletData,
} from "../../../services/userService";

/**
 * Load wallets for a specific user and normalise the API response.
 */
export async function loadWallets(userId: string): Promise<WalletData[]> {
  const response = await getUserWallets(userId);
  if (response.success && response.data) {
    return transformWalletData(response.data);
  }
  return [];
}

/**
 * Add a wallet to a user's bundle.
 */
export function addWallet(
  userId: string,
  address: string,
  label: string
): Promise<{ success: boolean; error?: string }> {
  return addWalletToBundle(userId, address, label);
}

/**
 * Remove a wallet from the user's bundle.
 */
export function removeWallet(
  userId: string,
  walletId: string
): Promise<{ success: boolean; error?: string }> {
  return removeWalletFromBundle(userId, walletId);
}

/**
 * Update a wallet label within the user's bundle.
 */
export function updateWalletLabel(
  userId: string,
  walletAddress: string,
  newLabel: string
): Promise<{ success: boolean; error?: string }> {
  return updateWalletLabelRequest(userId, walletAddress, newLabel);
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
