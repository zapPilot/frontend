/**
 * Hooks Index
 *
 * Centralized exports for all custom hooks
 */

// Main wallet hook
export { useWallet } from "./useWallet";
export { useChain } from "./useChain";
export { useWalletEvents } from "./useWalletEvents";

// Portfolio hooks
export {
  useWalletPortfolioState,
  usePortfolioViewToggles,
} from "./useWalletPortfolioState";

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
