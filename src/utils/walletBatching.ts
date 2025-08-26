/**
 * Simple wallet batching utility - replaces complex useWalletCapabilities
 */

import type { Account } from "thirdweb/wallets";

/**
 * Wallet account interface for compatibility
 */
interface WalletAccount {
  wallet?: {
    id?: string;
  };
}

interface WalletBatchConfig {
  batchSize: number;
  estimatedTime: number; // milliseconds
}

const WALLET_BATCH_CONFIGS: Record<string, WalletBatchConfig> & {
  default: WalletBatchConfig;
} = {
  metamask: { batchSize: 15, estimatedTime: 25000 },
  walletconnect: { batchSize: 8, estimatedTime: 35000 },
  coinbase: { batchSize: 12, estimatedTime: 30000 },
  rainbow: { batchSize: 10, estimatedTime: 30000 },
  default: { batchSize: 10, estimatedTime: 30000 },
};

/**
 * Get wallet batch configuration based on wallet type
 */
export function getWalletBatchConfig(
  account: Account | WalletAccount | undefined
): WalletBatchConfig {
  const walletType = detectSimpleWalletType(account);
  return WALLET_BATCH_CONFIGS[walletType] ?? WALLET_BATCH_CONFIGS.default;
}

/**
 * Simple wallet type detection
 */
function detectSimpleWalletType(
  account: Account | WalletAccount | undefined
): string {
  // Handle different account types
  const walletId =
    (account as WalletAccount)?.wallet?.id ||
    ((account as Account)?.address ? "metamask" : undefined); // fallback for Account type

  if (!walletId) return "default";

  const lowercaseWalletId = walletId.toLowerCase();

  if (lowercaseWalletId.includes("metamask")) return "metamask";
  if (lowercaseWalletId.includes("walletconnect")) return "walletconnect";
  if (lowercaseWalletId.includes("coinbase")) return "coinbase";
  if (lowercaseWalletId.includes("rainbow")) return "rainbow";

  return "default";
}

/**
 * Get simple wallet name for display
 */
export function getSimpleWalletName(
  account: Account | WalletAccount | undefined
): string {
  const walletType = detectSimpleWalletType(account);

  switch (walletType) {
    case "metamask":
      return "MetaMask";
    case "walletconnect":
      return "WalletConnect";
    case "coinbase":
      return "Coinbase Wallet";
    case "rainbow":
      return "Rainbow";
    default:
      return "Wallet";
  }
}

/**
 * Create transaction batches with specified batch size
 */
export function createTransactionBatches<T>(
  transactions: T[],
  batchSize: number
): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < transactions.length; i += batchSize) {
    batches.push(transactions.slice(i, i + batchSize));
  }
  return batches;
}
