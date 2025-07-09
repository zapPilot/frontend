"use client";

import { ReactNode } from "react";
import { ThirdwebProvider } from "thirdweb/react";

// Import new configuration and wallet context
import { WALLET_CONFIG } from "@/config/wallet";
import { WalletProvider, WalletError } from "./WalletContext";

interface Web3ProviderProps {
  children: ReactNode;
  /** Default provider to use (optional) */
  defaultProvider?:
    | "thirdweb"
    | "rainbowkit"
    | "wagmi"
    | "walletconnect"
    | "custom";
  /** Enable debug logging (optional) */
  enableDebug?: boolean;
  /** Error handler callback (optional) */
  onError?: (error: WalletError) => void | undefined;
}

/**
 * Web3Provider - Enhanced provider abstraction layer for wallet connections
 *
 * This component provides a multi-layered abstraction:
 * 1. ThirdWebProvider - Handles ThirdWeb SDK initialization
 * 2. WalletProvider - Provides standardized wallet interface across providers
 * 3. Provider Factory - Manages provider switching and lifecycle
 *
 * Features:
 * - Dynamic provider switching (ThirdWeb, RainbowKit, etc.)
 * - Standardized wallet interface
 * - Comprehensive error handling
 * - Event system for cross-component communication
 * - Backward compatibility with existing hooks
 *
 * To add new providers:
 * 1. Create adapter in providers/adapters/
 * 2. Register in WalletProviderFactory
 * 3. Update configuration in config/wallet.ts
 */
export function Web3Provider({
  children,
  defaultProvider = "thirdweb",
  enableDebug = WALLET_CONFIG.environment.isDevelopment,
  onError,
}: Web3ProviderProps) {
  return (
    <ThirdwebProvider>
      <WalletProvider
        defaultProvider={defaultProvider}
        enableDebug={enableDebug}
        {...(onError && { onError })}
      >
        {children}
      </WalletProvider>
    </ThirdwebProvider>
  );
}
