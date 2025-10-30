/**
 * Web3 Components Index
 *
 * Centralized exports for all Web3-related components
 */

// Core wallet components
export { ChainSwitcher } from "./ChainSwitcher";
export { HeaderWalletControls } from "./HeaderWalletControls";
export { SimpleConnectButton } from "./SimpleConnectButton";

// Legacy components for backward compatibility

// Re-export types for convenience
export type { Chain, WalletAccount } from "@/types/wallet";
