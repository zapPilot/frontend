/**
 * Enhanced useWallet Hook
 *
 * Provider-agnostic wallet operations with comprehensive state management,
 * error handling, and event subscription capabilities.
 */

"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useWalletContext } from "@/providers/WalletContext";
import { walletLogger } from "@/utils/logger";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from "@/utils/localStorage";
import type {
  WalletAccount,
  Chain,
  WalletProvider,
  ProviderType,
  WalletError,
  WalletConnectionStatus,
} from "@/types/wallet";

/**
 * Enhanced wallet hook configuration
 */
interface UseWalletConfig {
  /** Auto-connect on mount if previously connected */
  autoConnect?: boolean;
  /** Retry connection on failure */
  retryOnFailure?: boolean;
  /** Max retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Callback fired on successful connection */
  onConnect?: (account: WalletAccount) => void;
  /** Callback fired on disconnection */
  onDisconnect?: () => void;
  /** Callback fired on error */
  onError?: (error: WalletError) => void;
  /** Callback fired on chain change */
  onChainChange?: (chain: Chain) => void;
}

/**
 * Enhanced wallet hook return type
 */
interface UseWalletReturn {
  // Account management
  account: WalletAccount | null;
  isConnected: boolean;

  // Chain management
  chain: Chain | null;
  supportedChains: Chain[];

  // Provider management
  provider: WalletProvider | null;
  providerType: ProviderType;

  // Connection state
  connectionStatus: WalletConnectionStatus;
  isConnecting: boolean;
  isDisconnecting: boolean;

  // Error handling
  error: WalletError | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  switchProvider: (providerType: ProviderType) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signTypedData: (
    domain: Record<string, unknown>,
    types: Record<string, unknown>,
    value: Record<string, unknown>
  ) => Promise<string>;

  // Utility methods
  isChainSupported: (chainId: number) => boolean;
  getChainName: (chainId: number) => string;
  formatAddress: (address: string, length?: number) => string;
  copyAddress: () => Promise<boolean>;
  openInExplorer: (address?: string) => void;
  clearError: () => void;

  // Provider utilities
  getAvailableProviders: () => ProviderType[];
  getProviderName: () => string;

  // Connection utilities
  retry: () => Promise<void>;
  canRetry: boolean;
  retryCount: number;
}

/**
 * Enhanced useWallet Hook
 *
 * Provides comprehensive wallet functionality with provider abstraction,
 * automatic retry logic, and enhanced state management.
 */
export function useWallet(config: UseWalletConfig = {}): UseWalletReturn {
  const {
    autoConnect = true,
    retryOnFailure = true,
    maxRetries = 3,
    retryDelay = 1000,
    debug = false,
    onConnect,
    onDisconnect,
    onError,
    onChainChange,
  } = config;

  // Get wallet context
  const walletContext = useWalletContext();

  // Local state for retry logic
  const [retryCount, setRetryCount] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract values from context
  const {
    account,
    chain,
    provider,
    providerType,
    supportedChains,
    connectionStatus,
    isConnecting,
    isDisconnecting,
    error,
    connect: contextConnect,
    disconnect: contextDisconnect,
    switchChain: contextSwitchChain,
    switchProvider: contextSwitchProvider,
    signMessage: contextSignMessage,
    signTypedData: contextSignTypedData,
    isChainSupported: contextIsChainSupported,
    getAvailableProviders: contextGetAvailableProviders,
    clearError: contextClearError,
  } = walletContext;

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !account?.isConnected && !isConnecting) {
      const lastConnected = getStorageItem("wallet_last_connected", null);
      if (lastConnected) {
        log("Auto-connecting to wallet");
        connect();
      }
    }
  }, [autoConnect, account?.isConnected, isConnecting]);

  // Handle external callbacks
  useEffect(() => {
    if (account?.isConnected && onConnect) {
      onConnect(account);
    }
  }, [account?.isConnected, onConnect]);

  useEffect(() => {
    if (!account?.isConnected && onDisconnect) {
      onDisconnect();
    }
  }, [account?.isConnected, onDisconnect]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (chain && onChainChange) {
      onChainChange(chain);
    }
  }, [chain, onChainChange]);

  // Enhanced connect with retry logic
  const connect = useCallback(async () => {
    try {
      setCanRetry(false);
      await contextConnect();

      // Store successful connection
      setStorageItem("wallet_last_connected", "true");

      // Reset retry count on success
      setRetryCount(0);

      log("Wallet connected successfully");
    } catch (error) {
      log("Connection failed", error);

      // Handle retry logic
      if (retryOnFailure && retryCount < maxRetries) {
        setCanRetry(true);

        // Auto-retry after delay
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connect();
        }, retryDelay);
      } else {
        setCanRetry(false);
      }

      throw error;
    }
  }, [contextConnect, retryOnFailure, retryCount, maxRetries, retryDelay]);

  // Enhanced disconnect
  const disconnect = useCallback(async () => {
    try {
      await contextDisconnect();

      // Clear stored connection
      removeStorageItem("wallet_last_connected");

      // Reset retry state
      setRetryCount(0);
      setCanRetry(false);

      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      log("Wallet disconnected successfully");
    } catch (error) {
      log("Disconnect failed", error);
      throw error;
    }
  }, [contextDisconnect]);

  // Enhanced switch chain
  const switchChain = useCallback(
    async (chainId: number) => {
      try {
        await contextSwitchChain(chainId);
        log("Chain switched successfully", { chainId });
      } catch (error) {
        log("Chain switch failed", { chainId, error });
        throw error;
      }
    },
    [contextSwitchChain]
  );

  // Enhanced switch provider
  const switchProvider = useCallback(
    async (newProviderType: ProviderType) => {
      try {
        await contextSwitchProvider(newProviderType);
        log("Provider switched successfully", {
          from: providerType,
          to: newProviderType,
        });
      } catch (error) {
        log("Provider switch failed", {
          from: providerType,
          to: newProviderType,
          error,
        });
        throw error;
      }
    },
    [contextSwitchProvider, providerType]
  );

  // Enhanced sign message
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      try {
        const signature = await contextSignMessage(message);
        log("Message signed successfully");
        return signature;
      } catch (error) {
        log("Message signing failed", { message, error });
        throw error;
      }
    },
    [contextSignMessage]
  );

  // Enhanced sign typed data
  const signTypedData = useCallback(
    async (
      domain: Record<string, unknown>,
      types: Record<string, unknown>,
      value: Record<string, unknown>
    ): Promise<string> => {
      try {
        const signature = await contextSignTypedData(domain, types, value);
        log("Typed data signed successfully");
        return signature;
      } catch (error) {
        log("Typed data signing failed", { domain, types, value, error });
        throw error;
      }
    },
    [contextSignTypedData]
  );

  // Utility methods
  const getChainName = useCallback(
    (chainId: number): string => {
      const supportedChain = supportedChains.find(c => c.id === chainId);
      return supportedChain ? supportedChain.name : `Chain ${chainId}`;
    },
    [supportedChains]
  );

  const formatAddress = useCallback(
    (address: string, length: number = 8): string => {
      if (!address) return "";
      const chars = Math.floor(length / 2);
      return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
    },
    []
  );

  const copyAddress = useCallback(async (): Promise<boolean> => {
    if (!account?.address) return false;

    try {
      await navigator.clipboard.writeText(account.address);
      log("Address copied to clipboard");
      return true;
    } catch (error) {
      log("Failed to copy address", error);
      return false;
    }
  }, [account?.address]);

  const openInExplorer = useCallback(
    (address?: string) => {
      if (!chain || !chain.blockExplorer) return;

      const targetAddress = address || account?.address;
      if (!targetAddress) return;

      const explorerUrl = `${chain.blockExplorer}/address/${targetAddress}`;
      window.open(explorerUrl, "_blank");

      log("Opened in explorer", { address: targetAddress, explorerUrl });
    },
    [chain, account?.address]
  );

  const getProviderName = useCallback((): string => {
    return provider?.name || "Unknown Provider";
  }, [provider]);

  // Manual retry function
  const retry = useCallback(async () => {
    if (canRetry && retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      await connect();
    }
  }, [canRetry, retryCount, maxRetries, connect]);

  // Enhanced clear error
  const clearError = useCallback(() => {
    contextClearError();

    // Reset retry state if error was cleared
    if (error) {
      setCanRetry(false);
      setRetryCount(0);
    }
  }, [contextClearError, error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Debug logging
  const log = useCallback(
    (message: string, data?: unknown) => {
      if (debug) {
        walletLogger.debug(message, data);
      }
    },
    [debug]
  );

  return {
    // Account management
    account,
    isConnected: account?.isConnected || false,

    // Chain management
    chain,
    supportedChains,

    // Provider management
    provider,
    providerType,

    // Connection state
    connectionStatus,
    isConnecting,
    isDisconnecting,

    // Error handling
    error,

    // Actions
    connect,
    disconnect,
    switchChain,
    switchProvider,
    signMessage,
    signTypedData,

    // Utility methods
    isChainSupported: contextIsChainSupported,
    getChainName,
    formatAddress,
    copyAddress,
    openInExplorer,
    clearError,

    // Provider utilities
    getAvailableProviders: contextGetAvailableProviders,
    getProviderName,

    // Connection utilities
    retry,
    canRetry,
    retryCount,
  };
}

/**
 * Default export
 */
export default useWallet;
