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
export { usePortfolio } from "./usePortfolio";
export { useStrategyPortfolio } from "./useStrategyPortfolio";
export { useDustZap } from "./useDustZap";

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
