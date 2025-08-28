/**
 * Providers Index
 *
 * Central export point for all wallet provider functionality.
 * Provides a clean interface for importing wallet-related components and hooks.
 */

// Main provider components
import { Web3Provider } from "./Web3Provider";
import {
  WalletProvider,
  useWalletContext,
  useWalletConnection,
} from "./WalletContext";

// Provider factory and adapters
import { WalletProviderFactory } from "./WalletProviderFactory";
import { ThirdWebAdapter } from "./adapters/ThirdWebAdapter";

// Re-export configuration utilities
import { WALLET_CONFIG, CHAIN_IDS } from "@/config/wallet";

// Export all the components
export { Web3Provider } from "./Web3Provider";
export {
  WalletProvider,
  useWalletContext,
  useWalletConnection,
} from "./WalletContext";
export { WalletProviderFactory } from "./WalletProviderFactory";
export { ThirdWebAdapter } from "./adapters/ThirdWebAdapter";

// Re-export types for convenience
export type {
  WalletProvider as IWalletProvider,
  WalletAccount,
  Chain,
  ProviderType,
  WalletConfig,
} from "@/types/wallet";

// Re-export error types
export {
  WalletError,
  WalletErrorType,
  WalletEventType,
  WalletConnectionStatus,
} from "@/types/wallet";

// Re-export configuration utilities
export { WALLET_CONFIG, CHAIN_IDS, chainUtils } from "@/config/wallet";

/**
 * Convenience re-exports for backward compatibility
 */

// Legacy imports - these will continue to work
export { useWalletConnection as useWallet } from "./WalletContext";

/**
 * Default exports for common patterns
 */
export const ProviderExports = {
  Web3Provider,
  WalletProvider,
  useWalletConnection,
  useWalletContext,
  WalletProviderFactory,
  ThirdWebAdapter,
  WALLET_CONFIG,
  CHAIN_IDS,
};

export default ProviderExports;
