/**
 * Web3 Components Index
 *
 * Centralized exports for all Web3-related components
 */

// Core wallet components
export { WalletButton } from "./WalletButton";
export { ChainSelector } from "./ChainSelector";
export { SimpleConnectButton } from "./SimpleConnectButton";
export { ChainSwitcher } from "./ChainSwitcher";
export { HeaderWalletControls } from "./HeaderWalletControls";

// Legacy components for backward compatibility

// Re-export types for convenience
export type { WalletAccount, Chain, ProviderType } from "@/types/wallet";
