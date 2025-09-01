/**
 * Providers Index
 *
 * Simplified export point for wallet provider functionality.
 * Clean interface for importing simplified wallet components and hooks.
 */

// Main provider components
import { Web3Provider } from "./Web3Provider";
import { WalletProvider, useWalletProvider } from "./WalletProvider";

// Export all the components
export { Web3Provider } from "./Web3Provider";
export { WalletProvider, useWalletProvider } from "./WalletProvider";

// Re-export simplified types
export type {
  WalletAccount,
  Chain,
  WalletError,
  ConnectionStatus,
  WalletProviderInterface,
  SupportedChainId,
  ProviderType,
} from "@/types/wallet";

// Re-export chain utilities
export { SUPPORTED_CHAINS, CHAIN_INFO, chainUtils } from "@/types/wallet";

/**
 * Main exports for the app
 */
export const ProviderExports = {
  Web3Provider,
  WalletProvider,
  useWalletProvider,
};

export default ProviderExports;
