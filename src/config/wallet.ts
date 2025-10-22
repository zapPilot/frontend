/**
 * Simplified Wallet Configuration
 *
 * Basic configuration for ThirdWeb integration without multi-provider complexity.
 */

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

export default WALLET_CONFIG;
