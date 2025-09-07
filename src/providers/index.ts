/**
 * Providers Index - Clean barrel exports
 */

// Provider components
export { Web3Provider } from "./Web3Provider";
export { WalletProvider, useWalletProvider } from "./WalletProvider";
export { QueryProvider } from "./QueryProvider";
export { SimpleWeb3Provider } from "./SimpleWeb3Provider";

// Re-export wallet types and utilities
export type {
  WalletAccount,
  Chain,
  WalletError,
  ConnectionStatus,
  WalletProviderInterface,
  SupportedChainId,
  ProviderType,
} from "@/types/wallet";

export { SUPPORTED_CHAINS, CHAIN_INFO, chainUtils } from "@/types/wallet";
