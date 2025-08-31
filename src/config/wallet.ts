/**
 * Simplified Wallet Configuration
 *
 * Basic configuration for ThirdWeb integration without multi-provider complexity.
 */

import { chainUtils } from "@/types/wallet";

// Basic environment configuration
const getEnvConfig = () => ({
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  thirdwebClientId: process.env["NEXT_PUBLIC_THIRDWEB_CLIENT_ID"] || "",
});

// Simple wallet configuration
export const WALLET_CONFIG = {
  thirdwebClientId: getEnvConfig().thirdwebClientId,
  environment: {
    isDevelopment: getEnvConfig().isDevelopment,
    isProduction: getEnvConfig().isProduction,
  },
};

// Export chain utilities for compatibility
export { chainUtils };

// Chain IDs for compatibility
export const CHAIN_IDS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  BASE: 8453,
  OPTIMISM: 10,
} as const;

export default WALLET_CONFIG;
