/**
 * Wallet configuration for flexible provider abstraction
 *
 * This module provides centralized configuration for wallet providers,
 * supported chains, and environment-specific settings.
 */

import { ProviderType, WalletConfig } from "@/types/wallet";

// Import from unified chain configuration

/**
 * Default provider configuration
 */
export const DEFAULT_PROVIDER: ProviderType = "thirdweb";

/**
 * Environment variables and configuration
 */
const getEnvConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  return {
    isDevelopment,
    isProduction,
    thirdwebClientId: process.env["NEXT_PUBLIC_THIRDWEB_CLIENT_ID"] || "",
    walletConnectProjectId:
      process.env["NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"] || "",
    rainbowkitProjectId: process.env["NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID"] || "",
    appName: process.env["NEXT_PUBLIC_APP_NAME"] || "Zap Pilot",
    appDescription:
      process.env["NEXT_PUBLIC_APP_DESCRIPTION"] ||
      "Intent-based DeFi execution engine",
    appUrl: process.env["NEXT_PUBLIC_APP_URL"] || "https://zap-pilot.com",
    appIcon: process.env["NEXT_PUBLIC_APP_ICON"] || "/logo.svg",
  };
};

/**
 * Complete wallet configuration
 */
export const WALLET_CONFIG: WalletConfig = {
  defaultProvider: DEFAULT_PROVIDER,
  supportedChains: SUPPORTED_CHAINS,
  providers: {
    thirdweb: {
      clientId: getEnvConfig().thirdwebClientId,
      supportedWallets: [
        "metamask",
        "coinbase",
        "walletConnect",
        "rainbow",
        "trust",
        "injected",
      ],
      activeChain: CHAIN_IDS.ARBITRUM,
    },
    rainbowkit: {
      projectId: getEnvConfig().rainbowkitProjectId,
      appName: getEnvConfig().appName,
      appDescription: getEnvConfig().appDescription,
    },
    wagmi: {
      // Wagmi configuration will be provider-specific
    },
    walletconnect: {
      projectId: getEnvConfig().walletConnectProjectId,
      metadata: {
        name: getEnvConfig().appName,
        description: getEnvConfig().appDescription,
        url: getEnvConfig().appUrl,
        icons: [getEnvConfig().appIcon],
      },
    },
  },
  environment: {
    isDevelopment: getEnvConfig().isDevelopment,
    isProduction: getEnvConfig().isProduction,
  },
  features: {
    enableMultiChain: true,
  },
};

/**
 * Provider-specific utilities
 */
export const providerUtils = {
  /**
   * Get provider configuration
   */
  getProviderConfig: (providerType: ProviderType) => {
    return WALLET_CONFIG.providers[
      providerType as keyof typeof WALLET_CONFIG.providers
    ];
  },

  /**
   * Check if provider is configured
   */
  isProviderConfigured: (providerType: ProviderType): boolean => {
    const config = providerUtils.getProviderConfig(providerType);
    if (!config) return false;

    switch (providerType) {
      case "thirdweb":
        return !!(config as { clientId?: string }).clientId;
      case "rainbowkit":
        return !!(config as { projectId?: string }).projectId;
      case "walletconnect":
        return !!(config as { projectId?: string }).projectId;
      default:
        return true;
    }
  },

  /**
   * Get available providers
   */
  getAvailableProviders: (): ProviderType[] => {
    return Object.keys(WALLET_CONFIG.providers).filter(provider =>
      providerUtils.isProviderConfigured(provider as ProviderType)
    ) as ProviderType[];
  },
};

/**
 * Validation utilities
 */
export const validationUtils = {
  /**
   * Validate wallet address
   */
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  /**
   * Validate chain ID
   */
  isValidChainId: (chainId: number): boolean => {
    return chainId > 0 && Number.isInteger(chainId);
  },

  /**
   * Validate provider type
   */
  isValidProviderType: (providerType: string): providerType is ProviderType => {
    return [
      "thirdweb",
      "rainbowkit",
      "wagmi",
      "walletconnect",
      "custom",
    ].includes(providerType);
  },
};

/**
 * Default export
 */
export default WALLET_CONFIG;
