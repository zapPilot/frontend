/**
 * Enhanced Wallet Context
 *
 * Provides centralized wallet state management with provider abstraction,
 * event system for cross-component communication, and error boundary integration.
 * Supports dynamic provider switching and comprehensive error handling.
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from "react";

import {
  WalletError,
  WalletErrorType,
  WalletEventType,
  WalletConnectionStatus,
  type WalletProvider,
  type WalletAccount,
  type Chain,
  type ProviderType,
  type WalletEvent,
} from "@/types/wallet";

import { WalletProviderFactory } from "./WalletProviderFactory";
import { WALLET_CONFIG, chainUtils } from "@/config/wallet";

/**
 * Wallet Context State
 */
interface WalletContextState {
  // Provider management
  provider: WalletProvider | null;
  providerType: ProviderType;
  isProviderInitialized: boolean;

  // Account management
  account: WalletAccount | null;
  isConnected: boolean;

  // Chain management
  chain: Chain | null;
  supportedChains: Chain[];

  // Connection status
  connectionStatus: WalletConnectionStatus;
  isConnecting: boolean;
  isDisconnecting: boolean;

  // Error handling
  error: WalletError | null;
  lastError: WalletError | null;

  // Event system
  events: WalletEvent[];
  lastEvent: WalletEvent | null;
}

/**
 * Wallet Context Actions
 */
interface WalletContextActions {
  // Provider management
  switchProvider: (providerType: ProviderType) => Promise<void>;
  getAvailableProviders: () => ProviderType[];

  // Connection management
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;

  // Chain management
  switchChain: (chainId: number) => Promise<void>;
  isChainSupported: (chainId: number) => boolean;

  // Error handling
  clearError: () => void;
  clearAllErrors: () => void;

  // Event system
  addEventListener: (
    type: WalletEventType,
    listener: (event: WalletEvent) => void
  ) => () => void;
  removeEventListener: (
    type: WalletEventType,
    listener: (event: WalletEvent) => void
  ) => void;
  clearEvents: () => void;

  // Utility methods
  signMessage: (message: string) => Promise<string>;
  signTypedData: (
    domain: Record<string, unknown>,
    types: Record<string, unknown>,
    value: Record<string, unknown>
  ) => Promise<string>;

  // Debug methods
  getDebugInfo: () => Record<string, unknown>;
}

/**
 * Combined Wallet Context
 */
type WalletContextValue = WalletContextState & WalletContextActions;

/**
 * Wallet Context
 */
const WalletContext = createContext<WalletContextValue | null>(null);

/**
 * Wallet Provider Props
 */
interface WalletProviderProps {
  children: ReactNode;
  defaultProvider?: ProviderType;
  enableDebug?: boolean;
  onError?: (error: WalletError) => void | undefined;
  onProviderChange?: (provider: WalletProvider | null) => void | undefined;
  onAccountChange?: (account: WalletAccount | null) => void | undefined;
  onChainChange?: (chain: Chain | null) => void | undefined;
}

/**
 * Wallet Provider Component
 *
 * Provides wallet functionality through React Context with provider abstraction,
 * comprehensive error handling, and event system integration.
 */
export function WalletProvider({
  children,
  defaultProvider = WALLET_CONFIG.defaultProvider,
  enableDebug = WALLET_CONFIG.environment.isDevelopment,
  onError,
  onProviderChange,
  onAccountChange,
  onChainChange,
}: WalletProviderProps) {
  // Factory instance
  const factoryRef = useRef<WalletProviderFactory | null>(null);

  // State management
  const [state, setState] = useState<WalletContextState>({
    provider: null,
    providerType: defaultProvider,
    isProviderInitialized: false,
    account: null,
    isConnected: false,
    chain: null,
    supportedChains: chainUtils.getSupportedChains(),
    connectionStatus: WalletConnectionStatus.DISCONNECTED,
    isConnecting: false,
    isDisconnecting: false,
    error: null,
    lastError: null,
    events: [],
    lastEvent: null,
  });

  // Event listeners registry
  const eventListenersRef = useRef<
    Map<WalletEventType, Array<(event: WalletEvent) => void>>
  >(new Map());

  // Initialize factory
  useEffect(() => {
    if (!factoryRef.current) {
      factoryRef.current = WalletProviderFactory.getInstance({
        defaultProvider,
        debug: enableDebug,
      });
    }
  }, [defaultProvider, enableDebug]);

  // Initialize default provider
  useEffect(() => {
    if (factoryRef.current && !state.provider) {
      initializeProvider(defaultProvider);
    }
  }, [defaultProvider, state.provider]);

  // Provider initialization
  const initializeProvider = useCallback(
    async (providerType: ProviderType) => {
      if (!factoryRef.current) return;

      try {
        log("Initializing provider", { providerType });

        setState(prev => ({
          ...prev,
          connectionStatus: WalletConnectionStatus.CONNECTING,
          error: null,
        }));

        const provider =
          await factoryRef.current.setActiveProvider(providerType);

        // Setup provider event listeners
        setupProviderEventListeners(provider);

        setState(prev => ({
          ...prev,
          provider,
          providerType,
          isProviderInitialized: true,
          connectionStatus: WalletConnectionStatus.DISCONNECTED,
          supportedChains: provider.getSupportedChains(),
        }));

        // Notify external listeners
        onProviderChange?.(provider);

        log("Provider initialized successfully", { providerType });
      } catch (error) {
        const walletError =
          error instanceof WalletError
            ? error
            : new WalletError(
                WalletErrorType.PROVIDER_ERROR,
                `Failed to initialize provider: ${error instanceof Error ? error.message : "Unknown error"}`,
                error instanceof Error ? error : undefined
              );

        handleError(walletError);
        log("Provider initialization failed", {
          providerType,
          error: walletError,
        });
      }
    },
    [onProviderChange]
  );

  // Setup provider event listeners
  const setupProviderEventListeners = useCallback(
    (provider: WalletProvider) => {
      // Account change listener
      provider.onAccountChanged(account => {
        setState(prev => ({
          ...prev,
          account,
          isConnected: account?.isConnected || false,
          connectionStatus: account?.isConnected
            ? WalletConnectionStatus.CONNECTED
            : WalletConnectionStatus.DISCONNECTED,
        }));

        onAccountChange?.(account);
        emitEvent(WalletEventType.ACCOUNT_CHANGED, account);
      });

      // Chain change listener
      provider.onChainChanged(chain => {
        setState(prev => ({ ...prev, chain }));
        onChainChange?.(chain);
        emitEvent(WalletEventType.CHAIN_CHANGED, chain);
      });

      // Connection status listener
      provider.onConnectionChanged(isConnected => {
        setState(prev => ({
          ...prev,
          isConnected,
          connectionStatus: isConnected
            ? WalletConnectionStatus.CONNECTED
            : WalletConnectionStatus.DISCONNECTED,
          isConnecting: false,
          isDisconnecting: false,
        }));

        emitEvent(WalletEventType.CONNECTION_CHANGED, isConnected);
      });
    },
    [onAccountChange, onChainChange]
  );

  // Actions
  const switchProvider = useCallback(
    async (providerType: ProviderType) => {
      if (!factoryRef.current) {
        throw new WalletError(
          WalletErrorType.PROVIDER_ERROR,
          "Provider factory not initialized"
        );
      }

      try {
        log("Switching provider", {
          from: state.providerType,
          to: providerType,
        });

        const provider = await factoryRef.current.switchProvider(providerType);

        // Update state
        setState(prev => ({
          ...prev,
          provider,
          providerType,
          account: provider.account,
          isConnected: provider.account?.isConnected || false,
          chain: provider.chain,
          supportedChains: provider.getSupportedChains(),
          connectionStatus: provider.account?.isConnected
            ? WalletConnectionStatus.CONNECTED
            : WalletConnectionStatus.DISCONNECTED,
        }));

        // Setup new provider event listeners
        setupProviderEventListeners(provider);

        // Notify external listeners
        onProviderChange?.(provider);
        emitEvent(WalletEventType.PROVIDER_CHANGED, providerType);

        log("Provider switched successfully", { providerType });
      } catch (error) {
        const walletError =
          error instanceof WalletError
            ? error
            : new WalletError(
                WalletErrorType.PROVIDER_ERROR,
                `Failed to switch provider: ${error instanceof Error ? error.message : "Unknown error"}`,
                error instanceof Error ? error : undefined
              );

        handleError(walletError);
        throw walletError;
      }
    },
    [state.providerType, setupProviderEventListeners, onProviderChange]
  );

  const connect = useCallback(async () => {
    if (!state.provider) {
      throw new WalletError(
        WalletErrorType.PROVIDER_ERROR,
        "No provider available"
      );
    }

    try {
      setState(prev => ({
        ...prev,
        isConnecting: true,
        connectionStatus: WalletConnectionStatus.CONNECTING,
        error: null,
      }));

      await state.provider.connect();

      log("Wallet connected successfully");
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionStatus: WalletConnectionStatus.ERROR,
      }));

      const walletError =
        error instanceof WalletError
          ? error
          : new WalletError(
              WalletErrorType.CONNECTION_FAILED,
              `Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}`,
              error instanceof Error ? error : undefined
            );

      handleError(walletError);
      throw walletError;
    }
  }, [state.provider]);

  const disconnect = useCallback(async () => {
    if (!state.provider) {
      throw new WalletError(
        WalletErrorType.PROVIDER_ERROR,
        "No provider available"
      );
    }

    try {
      setState(prev => ({
        ...prev,
        isDisconnecting: true,
        connectionStatus: WalletConnectionStatus.DISCONNECTING,
      }));

      await state.provider.disconnect();

      log("Wallet disconnected successfully");
    } catch (error) {
      setState(prev => ({
        ...prev,
        isDisconnecting: false,
        connectionStatus: WalletConnectionStatus.ERROR,
      }));

      const walletError =
        error instanceof WalletError
          ? error
          : new WalletError(
              WalletErrorType.PROVIDER_ERROR,
              `Failed to disconnect: ${error instanceof Error ? error.message : "Unknown error"}`,
              error instanceof Error ? error : undefined
            );

      handleError(walletError);
      throw walletError;
    }
  }, [state.provider]);

  const switchChain = useCallback(
    async (chainId: number) => {
      if (!state.provider) {
        throw new WalletError(
          WalletErrorType.PROVIDER_ERROR,
          "No provider available"
        );
      }

      try {
        await state.provider.switchChain(chainId);
        log("Chain switched successfully", { chainId });
      } catch (error) {
        const walletError =
          error instanceof WalletError
            ? error
            : new WalletError(
                WalletErrorType.NETWORK_ERROR,
                `Failed to switch chain: ${error instanceof Error ? error.message : "Unknown error"}`,
                error instanceof Error ? error : undefined
              );

        handleError(walletError);
        throw walletError;
      }
    },
    [state.provider]
  );

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!state.provider) {
        throw new WalletError(
          WalletErrorType.PROVIDER_ERROR,
          "No provider available"
        );
      }

      if (!state.provider.signMessage) {
        throw new WalletError(
          WalletErrorType.PROVIDER_ERROR,
          "Provider does not support message signing"
        );
      }

      try {
        return await state.provider.signMessage(message);
      } catch (error) {
        const walletError =
          error instanceof WalletError
            ? error
            : new WalletError(
                WalletErrorType.PROVIDER_ERROR,
                `Failed to sign message: ${error instanceof Error ? error.message : "Unknown error"}`,
                error instanceof Error ? error : undefined
              );

        handleError(walletError);
        throw walletError;
      }
    },
    [state.provider]
  );

  const signTypedData = useCallback(
    async (
      domain: Record<string, unknown>,
      types: Record<string, unknown>,
      value: Record<string, unknown>
    ): Promise<string> => {
      if (!state.provider) {
        throw new WalletError(
          WalletErrorType.PROVIDER_ERROR,
          "No provider available"
        );
      }

      if (!state.provider.signTypedData) {
        throw new WalletError(
          WalletErrorType.PROVIDER_ERROR,
          "Provider does not support typed data signing"
        );
      }

      try {
        return await state.provider.signTypedData(domain, types, value);
      } catch (error) {
        const walletError =
          error instanceof WalletError
            ? error
            : new WalletError(
                WalletErrorType.PROVIDER_ERROR,
                `Failed to sign typed data: ${error instanceof Error ? error.message : "Unknown error"}`,
                error instanceof Error ? error : undefined
              );

        handleError(walletError);
        throw walletError;
      }
    },
    [state.provider]
  );

  // Error handling
  const handleError = useCallback(
    (error: WalletError) => {
      setState(prev => ({
        ...prev,
        error,
        lastError: error,
      }));

      onError?.(error);
      log("Error occurred", { error });
    },
    [onError]
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setState(prev => ({ ...prev, error: null, lastError: null }));
  }, []);

  // Event system
  const emitEvent = useCallback((type: WalletEventType, payload: unknown) => {
    const event: WalletEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };

    setState(prev => ({
      ...prev,
      events: [...prev.events.slice(-99), event], // Keep last 100 events
      lastEvent: event,
    }));

    // Notify event listeners
    const listeners = eventListenersRef.current.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in event listener:", error);
      }
    });
  }, []);

  const addEventListener = useCallback(
    (type: WalletEventType, listener: (event: WalletEvent) => void) => {
      const listeners = eventListenersRef.current.get(type) || [];
      listeners.push(listener);
      eventListenersRef.current.set(type, listeners);

      // Return unsubscribe function
      return () => {
        const currentListeners = eventListenersRef.current.get(type) || [];
        const index = currentListeners.indexOf(listener);
        if (index > -1) {
          currentListeners.splice(index, 1);
          eventListenersRef.current.set(type, currentListeners);
        }
      };
    },
    []
  );

  const removeEventListener = useCallback(
    (type: WalletEventType, listener: (event: WalletEvent) => void) => {
      const listeners = eventListenersRef.current.get(type) || [];
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
        eventListenersRef.current.set(type, listeners);
      }
    },
    []
  );

  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, events: [], lastEvent: null }));
  }, []);

  // Utility methods
  const getAvailableProviders = useCallback((): ProviderType[] => {
    return factoryRef.current?.getAvailableProviders() || [];
  }, []);

  const isChainSupported = useCallback((chainId: number): boolean => {
    return chainUtils.isChainSupported(chainId);
  }, []);

  const getDebugInfo = useCallback((): Record<string, unknown> => {
    return {
      provider: state.provider
        ? {
            type: state.provider.type,
            name: state.provider.name,
            isInitialized: state.provider.isInitialized,
          }
        : null,
      state: {
        ...state,
        provider: state.provider ? "[WalletProvider]" : null,
      },
      factory: factoryRef.current ? "[WalletProviderFactory]" : null,
      eventListeners: Array.from(eventListenersRef.current.entries()).map(
        ([type, listeners]) => ({
          type,
          listenerCount: listeners.length,
        })
      ),
    };
  }, [state]);

  // Context value
  const contextValue = useMemo<WalletContextValue>(
    () => ({
      // State
      ...state,

      // Actions
      switchProvider,
      getAvailableProviders,
      connect,
      disconnect,
      switchChain,
      isChainSupported,
      clearError,
      clearAllErrors,
      addEventListener,
      removeEventListener,
      clearEvents,
      signMessage,
      signTypedData,
      getDebugInfo,
    }),
    [
      state,
      switchProvider,
      getAvailableProviders,
      connect,
      disconnect,
      switchChain,
      isChainSupported,
      clearError,
      clearAllErrors,
      addEventListener,
      removeEventListener,
      clearEvents,
      signMessage,
      signTypedData,
      getDebugInfo,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (factoryRef.current) {
        factoryRef.current.cleanup();
      }
    };
  }, []);

  // Debug logging
  const log = useCallback(
    (message: string, data?: unknown) => {
      if (enableDebug) {
        console.log(`[WalletContext] ${message}`, data || "");
      }
    },
    [enableDebug]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Wallet Context Hook
 *
 * Hook to access the wallet context functionality
 */
export function useWalletContext(): WalletContextValue {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }

  return context;
}

/**
 * Wallet Connection Hook
 *
 * Simplified hook for basic wallet connection functionality
 */
export function useWalletConnection() {
  const context = useWalletContext();

  return {
    account: context.account,
    chain: context.chain,
    isConnected: context.isConnected,
    isConnecting: context.isConnecting,
    isDisconnecting: context.isDisconnecting,
    connectionStatus: context.connectionStatus,
    connect: context.connect,
    disconnect: context.disconnect,
    switchChain: context.switchChain,
    error: context.error,
    clearError: context.clearError,
  };
}

/**
 * Export types for convenience
 */
export type { WalletContextValue, WalletContextState, WalletContextActions };

/**
 * Export error types
 */
export {
  WalletError,
  WalletErrorType,
  WalletEventType,
  WalletConnectionStatus,
} from "@/types/wallet";
