/**
 * Web3 Components Index
 *
 * Centralized exports for all Web3-related components
 */

// Core wallet components
export { WalletButton } from "./WalletButton";
export { ChainSelector } from "./ChainSelector";

// Legacy components for backward compatibility
export { WalletConnectButton } from "./WalletConnectButton";

// Re-export types for convenience
export type { WalletAccount, Chain, ProviderType } from "@/types/wallet";
