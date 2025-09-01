"use client";

import { ReactNode } from "react";
import { ThirdwebProvider } from "thirdweb/react";

// Import simplified wallet provider
import { WalletProvider } from "./WalletProvider";

interface Web3ProviderProps {
  children: ReactNode;
}

/**
 * Web3Provider - Simplified provider for ThirdWeb integration
 *
 * Provides direct ThirdWeb integration without abstraction layers.
 * Much simpler than the previous multi-provider setup.
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <ThirdwebProvider>
      <WalletProvider>{children}</WalletProvider>
    </ThirdwebProvider>
  );
}
