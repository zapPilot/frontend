/**
 * Hooks Index
 *
 * Centralized exports for all custom hooks
 */

// Enhanced wallet hooks
export { useWallet } from "./useWallet";
export { useChain } from "./useChain";
export { useWalletEvents } from "./useWalletEvents";

// Legacy hooks for backward compatibility
export { useWalletConnection } from "./useWalletConnection";

// Portfolio hooks
export { usePortfolio } from "./usePortfolio";
export { useStrategyPortfolio } from "./useStrategyPortfolio";
export { useDustZap } from "./useDustZap";

// Re-export types for convenience
export type {
  WalletAccount,
  Chain,
  ProviderType,
  WalletConnectionHooks,
} from "@/types/wallet";
