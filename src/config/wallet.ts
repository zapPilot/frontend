/**
 * Wallet configuration for flexible provider abstraction
 *
 * This module provides centralized configuration for wallet providers,
 * supported chains, and environment-specific settings.
 */

import { WalletConfig, Chain, ProviderType } from "@/types/wallet";

/**
 * Supported blockchain networks
 */
export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: 1,
    name: "Ethereum",
    symbol: "ETH",
    isSupported: true,
    icon: "/chains/ethereum.svg",
    rpcUrl: "https://mainnet.infura.io/v3/",
    blockExplorer: "https://etherscan.io",
    isTestnet: false,
  },
  {
    id: 42161,
    name: "Arbitrum One",
    symbol: "ARB",
    isSupported: true,
    icon: "/chains/arbitrum.svg",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    isTestnet: false,
  },
  {
    id: 8453,
    name: "Base",
    symbol: "BASE",
    isSupported: true,
    icon: "/chains/base.svg",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    isTestnet: false,
  },
  {
    id: 10,
    name: "Optimism",
    symbol: "OP",
    isSupported: true,
    icon: "/chains/optimism.svg",
    rpcUrl: "https://mainnet.optimism.io",
    blockExplorer: "https://optimistic.etherscan.io",
    isTestnet: false,
  },
  // Testnets (enabled in development)
  {
    id: 11155111,
    name: "Sepolia",
    symbol: "SEP",
    isSupported: process.env.NODE_ENV === "development",
    icon: "/chains/ethereum.svg",
    rpcUrl: "https://sepolia.infura.io/v3/",
    blockExplorer: "https://sepolia.etherscan.io",
    isTestnet: true,
  },
  {
    id: 421614,
    name: "Arbitrum Sepolia",
    symbol: "ARB",
    isSupported: process.env.NODE_ENV === "development",
    icon: "/chains/arbitrum.svg",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    isTestnet: true,
  },
];

/**
 * Chain ID mappings for easy reference
 */
export const CHAIN_IDS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  BASE: 8453,
  OPTIMISM: 10,
  SEPOLIA: 11155111,
  ARBITRUM_SEPOLIA: 421614,
} as const;

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
    enableTestnets:
      isDevelopment || process.env["NEXT_PUBLIC_ENABLE_TESTNETS"] === "true",
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
    enableTestnets: getEnvConfig().enableTestnets,
  },
  features: {
    enableMultiChain: true,
  },
};

/**
 * Utility functions for chain management
 */
export const chainUtils = {
  /**
   * Get chain by ID
   */
  getChainById: (chainId: number): Chain | undefined => {
    return SUPPORTED_CHAINS.find(chain => chain.id === chainId);
  },

  /**
   * Check if chain is supported
   */
  isChainSupported: (chainId: number): boolean => {
    const chain = chainUtils.getChainById(chainId);
    return chain ? chain.isSupported : false;
  },

  /**
   * Get only supported chains
   */
  getSupportedChains: (): Chain[] => {
    return SUPPORTED_CHAINS.filter(chain => chain.isSupported);
  },

  /**
   * Get mainnet chains only
   */
  getMainnetChains: (): Chain[] => {
    return SUPPORTED_CHAINS.filter(
      chain => chain.isSupported && !chain.isTestnet
    );
  },

  /**
   * Get testnet chains only
   */
  getTestnetChains: (): Chain[] => {
    return SUPPORTED_CHAINS.filter(
      chain => chain.isSupported && chain.isTestnet
    );
  },

  /**
   * Get chain display name
   */
  getChainName: (chainId: number): string => {
    const chain = chainUtils.getChainById(chainId);
    return chain ? chain.name : `Chain ${chainId}`;
  },

  /**
   * Get chain symbol
   */
  getChainSymbol: (chainId: number): string => {
    const chain = chainUtils.getChainById(chainId);
    return chain ? chain.symbol : "UNKNOWN";
  },

  /**
   * Format chain for display
   */
  formatChainForDisplay: (
    chainId: number
  ): { name: string; symbol: string; icon?: string } => {
    const chain = chainUtils.getChainById(chainId);
    if (!chain) {
      return { name: `Chain ${chainId}`, symbol: "UNKNOWN" };
    }

    return {
      name: chain.name,
      symbol: chain.symbol,
      ...(chain.icon && { icon: chain.icon }),
    };
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
 * Feature flags for development
 */
export const FEATURE_FLAGS = {
  ENABLE_MULTI_CHAIN: WALLET_CONFIG.features.enableMultiChain,
  ENABLE_TESTNETS: WALLET_CONFIG.environment.enableTestnets,
  ENABLE_DEBUG_LOGGING: WALLET_CONFIG.environment.isDevelopment,
} as const;

/**
 * Default export
 */
export default WALLET_CONFIG;
