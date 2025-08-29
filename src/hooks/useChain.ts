/**
 * Enhanced useChain Hook
 *
 * Chain switching functionality with multi-chain support,
 * validation, and network status monitoring.
 */

"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useWalletContext } from "@/providers/WalletContext";
import { chainUtils } from "@/config/wallet";
import type { Chain, WalletError } from "@/types/wallet";
import { httpRequest, handleHTTPError } from "@/lib/http-utils";
import { chainLogger } from "@/utils/logger";

/**
 * Chain hook configuration
 */
interface UseChainConfig {
  /** Preferred chain ID to switch to */
  preferredChainId?: number;
  /** Auto-switch to preferred chain on connection */
  autoSwitchToPreferred?: boolean;
  /** Enable chain validation */
  enableValidation?: boolean;
  /** Network status monitoring interval (ms) */
  networkStatusInterval?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Callback fired on chain change */
  onChainChange?: (chain: Chain) => void;
  /** Callback fired on network status change */
  onNetworkStatusChange?: (isOnline: boolean) => void;
  /** Callback fired on unsupported chain */
  onUnsupportedChain?: (chainId: number) => void;
}

/**
 * Network status information
 */
interface NetworkStatus {
  isOnline: boolean;
  latency: number | null;
  lastChecked: number;
  isStable: boolean;
  consecutiveFailures: number;
}

/**
 * Chain hook return type
 */
interface UseChainReturn {
  // Current chain
  chain: Chain | null;
  chainId: number | null;

  // Chain validation
  isSupported: boolean;
  isPreferred: boolean;

  // Chain operations
  switchChain: (chainId: number) => Promise<void>;
  switchToPreferred: () => Promise<void>;
  addChain: (chain: Chain) => Promise<void>;

  // Chain information
  supportedChains: Chain[];
  mainnetChains: Chain[];

  // Network status
  networkStatus: NetworkStatus;

  // Utility methods
  getChainName: (chainId?: number) => string;
  getChainSymbol: (chainId?: number) => string;
  getChainIcon: (chainId?: number) => string | undefined;
  getBlockExplorer: (chainId?: number) => string | undefined;
  formatChainForDisplay: (chainId?: number) => {
    name: string;
    symbol: string;
    icon: string | undefined;
  };

  // Validation methods
  validateChain: (chainId: number) => {
    isValid: boolean;
    isSupported: boolean;
    chain: Chain | null;
    error?: string;
  };

  // Status
  isSwitching: boolean;
  error: WalletError | null;
  clearError: () => void;
}

/**
 * Enhanced useChain Hook
 *
 * Provides comprehensive chain management with validation,
 * network monitoring, and multi-chain support.
 */
export function useChain(config: UseChainConfig = {}): UseChainReturn {
  const {
    preferredChainId,
    autoSwitchToPreferred = false,
    enableValidation = true,
    networkStatusInterval = 30000,
    debug = false,
    onChainChange,
    onNetworkStatusChange,
    onUnsupportedChain,
  } = config;

  // Get wallet context
  const walletContext = useWalletContext();

  // Local state
  const [isSwitching, setIsSwitching] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    latency: null,
    lastChecked: Date.now(),
    isStable: true,
    consecutiveFailures: 0,
  });

  // Refs for cleanup
  const networkMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const latencyCheckRef = useRef<AbortController | null>(null);

  // Extract values from context
  const {
    chain,
    account,
    switchChain: contextSwitchChain,
    supportedChains,
    error,
    clearError: contextClearError,
  } = walletContext;

  // Derived values
  const chainId = chain?.id || null;
  const isSupported = chainId ? chainUtils.isChainSupported(chainId) : false;
  const isPreferred = chainId === preferredChainId;
  const mainnetChains = chainUtils.getMainnetChains();

  // Auto-switch to preferred chain
  useEffect(() => {
    if (
      autoSwitchToPreferred &&
      preferredChainId &&
      account?.isConnected &&
      chainId !== preferredChainId &&
      !isSwitching
    ) {
      log("Auto-switching to preferred chain", {
        current: chainId,
        preferred: preferredChainId,
      });
      switchChain(preferredChainId);
    }
  }, [
    autoSwitchToPreferred,
    preferredChainId,
    account?.isConnected,
    chainId,
    isSwitching,
  ]);

  // Monitor chain changes
  useEffect(() => {
    if (chain && onChainChange) {
      onChainChange(chain);
    }
  }, [chain, onChainChange]);

  // Monitor unsupported chains
  useEffect(() => {
    if (enableValidation && chainId && !isSupported && onUnsupportedChain) {
      onUnsupportedChain(chainId);
    }
  }, [enableValidation, chainId, isSupported, onUnsupportedChain]);

  // Network status monitoring
  useEffect(() => {
    if (networkStatusInterval > 0) {
      startNetworkMonitoring();
    }

    return () => {
      stopNetworkMonitoring();
    };
  }, [networkStatusInterval]);

  // Online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        consecutiveFailures: 0,
      }));

      if (onNetworkStatusChange) {
        onNetworkStatusChange(true);
      }
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isStable: false,
      }));

      if (onNetworkStatusChange) {
        onNetworkStatusChange(false);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onNetworkStatusChange]);

  // Enhanced switch chain
  const switchChain = useCallback(
    async (targetChainId: number) => {
      if (!account?.isConnected) {
        throw new Error("Wallet not connected");
      }

      if (chainId === targetChainId) {
        log("Already on target chain", { chainId: targetChainId });
        return;
      }

      // Validate chain if enabled
      if (enableValidation) {
        const validation = validateChain(targetChainId);
        if (!validation.isValid) {
          throw new Error(validation.error || "Invalid chain");
        }
      }

      setIsSwitching(true);

      try {
        await contextSwitchChain(targetChainId);
        log("Chain switched successfully", {
          from: chainId,
          to: targetChainId,
        });
      } catch (error) {
        log("Chain switch failed", {
          from: chainId,
          to: targetChainId,
          error,
        });
        throw error;
      } finally {
        setIsSwitching(false);
      }
    },
    [account?.isConnected, chainId, enableValidation, contextSwitchChain]
  );

  // Switch to preferred chain
  const switchToPreferred = useCallback(async () => {
    if (!preferredChainId) {
      throw new Error("No preferred chain configured");
    }

    await switchChain(preferredChainId);
  }, [preferredChainId, switchChain]);

  // Add chain (placeholder for future implementation)
  const addChain = useCallback(async () => {
    // This would be implemented to add custom chains
    // For now, throw not implemented error
    throw new Error("Add chain functionality not implemented yet");
  }, []);

  // Utility methods
  const getChainName = useCallback(
    (targetChainId?: number): string => {
      const id = targetChainId || chainId;
      return id ? chainUtils.getChainName(id) : "Unknown Network";
    },
    [chainId]
  );

  const getChainSymbol = useCallback(
    (targetChainId?: number): string => {
      const id = targetChainId || chainId;
      return id ? chainUtils.getChainSymbol(id) : "UNKNOWN";
    },
    [chainId]
  );

  const getChainIcon = useCallback(
    (targetChainId?: number): string | undefined => {
      const id = targetChainId || chainId;
      if (!id) return undefined;

      const targetChain = chainUtils.getChainById(id);
      return targetChain?.iconUrl;
    },
    [chainId]
  );

  const getBlockExplorer = useCallback(
    (targetChainId?: number): string | undefined => {
      const id = targetChainId || chainId;
      if (!id) return undefined;

      const targetChain = chainUtils.getChainById(id);
      return targetChain?.blockExplorers.default.url;
    },
    [chainId]
  );

  const formatChainForDisplay = useCallback(
    (targetChainId?: number) => {
      const id = targetChainId || chainId;
      return chainUtils.formatChainForDisplay(id || 1);
    },
    [chainId]
  );

  // Validation methods
  const validateChain = useCallback((targetChainId: number) => {
    const targetChain = chainUtils.getChainById(targetChainId);

    if (!targetChain) {
      return {
        isValid: false,
        isSupported: false,
        chain: null,
        error: `Chain ${targetChainId} not found`,
      };
    }

    if (!targetChain.isSupported) {
      return {
        isValid: false,
        isSupported: false,
        chain: targetChain,
        error: `Chain ${targetChain.name} is not supported`,
      };
    }

    return {
      isValid: true,
      isSupported: true,
      chain: targetChain,
    };
  }, []);

  // Network monitoring
  const startNetworkMonitoring = useCallback(() => {
    if (networkMonitorRef.current) {
      clearInterval(networkMonitorRef.current);
    }

    networkMonitorRef.current = setInterval(async () => {
      await checkNetworkStatus();
    }, networkStatusInterval);

    // Initial check
    checkNetworkStatus();
  }, [networkStatusInterval]);

  const stopNetworkMonitoring = useCallback(() => {
    if (networkMonitorRef.current) {
      clearInterval(networkMonitorRef.current);
      networkMonitorRef.current = null;
    }

    if (latencyCheckRef.current) {
      latencyCheckRef.current.abort();
      latencyCheckRef.current = null;
    }
  }, []);

  const checkNetworkStatus = useCallback(async () => {
    if (!chain?.id) return;

    const chainConfig = chainUtils.getChainById(chain.id);
    if (!chainConfig?.rpcUrls?.default?.http?.[0]) return;

    // Cancel previous check
    if (latencyCheckRef.current) {
      latencyCheckRef.current.abort();
    }

    latencyCheckRef.current = new AbortController();
    const startTime = Date.now();

    try {
      // Simple network check - try to fetch a lightweight endpoint using HTTP utils
      await httpRequest(chainConfig.rpcUrls.default.http[0], {
        method: "POST",
        body: {
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        },
        signal: latencyCheckRef.current.signal,
      });

      const latency = Date.now() - startTime;
      const isOnline = true; // If we reach here, the request was successful

      setNetworkStatus(prev => ({
        ...prev,
        isOnline,
        latency,
        lastChecked: Date.now(),
        isStable: isOnline && latency < 2000,
        consecutiveFailures: isOnline ? 0 : prev.consecutiveFailures + 1,
      }));

      log("Network status checked", {
        isOnline,
        latency,
        chain: chain.name,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return; // Request was aborted
      }

      const latency = Date.now() - startTime;
      const errorMessage = handleHTTPError(error);

      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        latency,
        lastChecked: Date.now(),
        isStable: false,
        consecutiveFailures: prev.consecutiveFailures + 1,
      }));

      log("Network status check failed", { error, errorMessage });
    }
  }, [chain]);

  // Enhanced clear error
  const clearError = useCallback(() => {
    contextClearError();

    // Reset switching state if error occurred during chain switch
    if (isSwitching) {
      setIsSwitching(false);
    }
  }, [contextClearError, isSwitching]);

  // Debug logging
  const log = useCallback(
    (message: string, data?: unknown) => {
      if (debug) {
        chainLogger.debug(message, data);
      }
    },
    [debug]
  );

  return {
    // Current chain
    chain,
    chainId,

    // Chain validation
    isSupported,
    isPreferred,

    // Chain operations
    switchChain,
    switchToPreferred,
    addChain,

    // Chain information
    supportedChains,
    mainnetChains,

    // Network status
    networkStatus,

    // Utility methods
    getChainName,
    getChainSymbol,
    getChainIcon,
    getBlockExplorer,
    formatChainForDisplay,

    // Validation methods
    validateChain,

    // Status
    isSwitching,
    error,
    clearError,
  };
}

/**
 * Default export
 */
export default useChain;
