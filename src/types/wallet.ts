/**
 * Core wallet integration types for flexible provider abstraction
 *
 * This module provides TypeScript interfaces that abstract wallet provider
 * implementations, enabling easy switching between different wallet providers
 * (ThirdWeb, RainbowKit, Wagmi, etc.) without changing application code.
 */

/**
 * Represents a connected wallet account with standardized information
 */
export interface WalletAccount {
  /** The wallet address (checksummed) */
  address: string;
  /** Whether the wallet is currently connected */
  isConnected: boolean;
  /** Optional ENS name or other identifier */
  displayName?: string;
  /** Optional avatar URL */
  avatar?: string;
  /** Balance in native token (ETH, MATIC, etc.) */
  balance?: string;
}

/**
 * Represents a blockchain network/chain with standardized information
 */
export interface Chain {
  /** Chain ID (e.g., 1 for Ethereum, 42161 for Arbitrum) */
  id: number;
  /** Human-readable chain name */
  name: string;
  /** Chain symbol (e.g., 'ETH', 'ARB') */
  symbol: string;
  /** Whether this chain is supported by the application */
  isSupported: boolean;
  /** Optional chain icon URL */
  icon?: string;
  /** RPC URL for this chain */
  rpcUrl?: string;
  /** Block explorer URL */
  blockExplorer?: string;
  /** Whether this is a testnet */
  isTestnet?: boolean;
}

/**
 * Available wallet provider types
 */
export type ProviderType =
  | "thirdweb"
  | "rainbowkit"
  | "wagmi"
  | "walletconnect"
  | "custom";

/**
 * Abstraction layer for wallet provider implementations
 *
 * This interface allows the application to work with any wallet provider
 * by implementing these standardized methods and properties.
 */
export interface WalletProvider {
  /** Provider identifier */
  type: ProviderType;
  /** Provider display name */
  name: string;
  /** Whether the provider is initialized and ready */
  isInitialized: boolean;

  // Account management
  /** Currently connected account */
  account: WalletAccount | null;
  /** Connect to a wallet */
  connect: () => Promise<void>;
  /** Disconnect from current wallet */
  disconnect: () => Promise<void>;
  /** Whether connection is in progress */
  isConnecting: boolean;
  /** Whether disconnection is in progress */
  isDisconnecting: boolean;

  // Chain management
  /** Currently active chain */
  chain: Chain | null;
  /** Switch to a different chain */
  switchChain: (chainId: number) => Promise<void>;
  /** Get list of supported chains */
  getSupportedChains: () => Chain[];

  // Events
  /** Subscribe to account changes */
  onAccountChanged: (callback: (account: WalletAccount | null) => void) => void;
  /** Subscribe to chain changes */
  onChainChanged: (callback: (chain: Chain | null) => void) => void;
  /** Subscribe to connection status changes */
  onConnectionChanged: (callback: (isConnected: boolean) => void) => void;

  // Provider-specific methods
  /** Get the underlying provider instance */
  getProvider: () => unknown;
  /** Sign a message */
  signMessage?: (message: string) => Promise<string>;
  /** Sign typed data */
  signTypedData?: (
    domain: Record<string, unknown>,
    types: Record<string, unknown>,
    value: Record<string, unknown>
  ) => Promise<string>;
}

/**
 * Configuration for wallet provider setup
 */
export interface WalletConfig {
  /** Default provider to use */
  defaultProvider: ProviderType;
  /** List of supported chains */
  supportedChains: Chain[];
  /** Provider-specific configurations */
  providers: {
    thirdweb?: {
      clientId: string;
      supportedWallets?: string[];
      activeChain?: number;
    };
    rainbowkit?: {
      projectId: string;
      appName: string;
      appDescription?: string;
    };
    wagmi?: {
      publicClient?: unknown;
      webSocketPublicClient?: unknown;
    };
    walletconnect?: {
      projectId: string;
      metadata: {
        name: string;
        description: string;
        url: string;
        icons: string[];
      };
    };
  };
  /** Environment-specific settings */
  environment: {
    isDevelopment: boolean;
    isProduction: boolean;
    enableTestnets: boolean;
  };
  /** Feature flags */
  features: {
    enableSmartWallets: boolean;
    enableGaslessTransactions: boolean;
    enableMultiChain: boolean;
  };
}

/**
 * Hook return type for wallet connection functionality
 */
export interface WalletConnectionHooks {
  // Account management
  account: WalletAccount | null;

  // Chain management
  chain: Chain | null;
  switchChain: (chainId: number) => Promise<void>;

  // Connection management
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isDisconnecting: boolean;

  // Provider information
  provider: WalletProvider | null;
  providerType: ProviderType;

  // Utility methods
  isChainSupported: (chainId: number) => boolean;
  getSupportedChains: () => Chain[];

  // Error handling
  error: Error | null;
  clearError: () => void;
}

/**
 * Wallet connection error types
 */
export enum WalletErrorType {
  CONNECTION_FAILED = "CONNECTION_FAILED",
  CHAIN_NOT_SUPPORTED = "CHAIN_NOT_SUPPORTED",
  USER_REJECTED = "USER_REJECTED",
  WALLET_NOT_FOUND = "WALLET_NOT_FOUND",
  NETWORK_ERROR = "NETWORK_ERROR",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Standardized wallet error class
 */
export class WalletError extends Error {
  constructor(
    public type: WalletErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "WalletError";
  }
}

/**
 * Wallet event types for subscription
 */
export enum WalletEventType {
  ACCOUNT_CHANGED = "accountChanged",
  CHAIN_CHANGED = "chainChanged",
  CONNECTION_CHANGED = "connectionChanged",
  PROVIDER_CHANGED = "providerChanged",
}

/**
 * Event payload for wallet events
 */
export interface WalletEvent<T = unknown> {
  type: WalletEventType;
  payload: T;
  timestamp: number;
}

/**
 * Wallet connection status
 */
export enum WalletConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTING = "disconnecting",
  ERROR = "error",
}
