/**
 * Hooks Index
 *
 * Centralized exports for all custom hooks
 */

// Main wallet hook
export { useWallet } from "./useWallet";
export { useChain } from "./useChain";
export { useWalletEvents } from "./useWalletEvents";

// Legacy compatibility
export { useWalletConnection } from "./useWallet";

// Portfolio hooks
export {
  useWalletPortfolioState,
  usePortfolioViewToggles,
} from "./useWalletPortfolioState";
export { usePortfolio } from "./usePortfolio";

// UI/Interaction hooks
export { useDropdown } from "./useDropdown";

// Re-export types for convenience
export type {
  WalletAccount,
  Chain,
  WalletError,
  SupportedChainId,
  WalletProviderInterface,
} from "@/types/wallet";
