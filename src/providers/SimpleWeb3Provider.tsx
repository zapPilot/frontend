"use client";

import { ReactNode } from "react";
import { AutoConnect, ThirdwebProvider } from "thirdweb/react";

import { DEFAULT_WALLETS } from "@/config/wallets";
import THIRDWEB_CLIENT from "@/utils/thirdweb";

interface SimpleWeb3ProviderProps {
  children: ReactNode;
}

/**
 * Simplified Web3Provider using ThirdWeb's built-in provider
 *
 * This replaces the complex provider abstraction with a simple ThirdWeb setup
 * based on the working implementation from all-weather-frontend
 */
export function SimpleWeb3Provider({ children }: SimpleWeb3ProviderProps) {
  return (
    <ThirdwebProvider>
      <AutoConnect client={THIRDWEB_CLIENT} wallets={DEFAULT_WALLETS} />
      {children}
    </ThirdwebProvider>
  );
}
