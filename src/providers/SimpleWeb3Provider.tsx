"use client";

import { ReactNode } from "react";
import { ThirdwebProvider } from "thirdweb/react";

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
  return <ThirdwebProvider>{children}</ThirdwebProvider>;
}

export default SimpleWeb3Provider;
