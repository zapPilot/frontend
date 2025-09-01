/**
 * Simplified Wallet Events Hook
 *
 * Basic event handling for wallet state changes using React patterns.
 * No complex event system - uses simple callbacks and React state.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "./useWallet";

// Simplified event types
export interface WalletEvent {
  type: string;
  timestamp: number;
  data?: any;
}

// Basic event stats
export interface EventStats {
  totalEvents: number;
}

// Simplified hook interface
export interface UseWalletEventsReturn {
  // Basic stats
  stats: EventStats;

  // Simple event handlers
  onAccountChange: (callback: (account: any) => void) => () => void;
  onChainChange: (callback: (chain: any) => void) => () => void;
  onConnectionChange: (callback: (isConnected: boolean) => void) => () => void;

  // Utility
  clearEvents: () => void;
}

// Configuration
interface UseWalletEventsConfig {
  enableTracking?: boolean;
  maxEvents?: number;
}

/**
 * Simplified wallet events hook
 */
export function useWalletEvents(
  config: UseWalletEventsConfig = {}
): UseWalletEventsReturn {
  const { enableTracking = true } = config;

  // Get wallet state
  const { account, chain, isConnected } = useWallet();

  // Local state
  const [stats, setStats] = useState<EventStats>({ totalEvents: 0 });

  // Callback refs
  const accountCallbacksRef = useRef<Array<(account: any) => void>>([]);
  const chainCallbacksRef = useRef<Array<(chain: any) => void>>([]);
  const connectionCallbacksRef = useRef<Array<(isConnected: boolean) => void>>(
    []
  );

  // Previous values for change detection
  const prevAccountRef = useRef(account);
  const prevChainRef = useRef(chain);
  const prevConnectionRef = useRef(isConnected);

  // Track changes and trigger callbacks
  useEffect(() => {
    if (!enableTracking) return;

    // Check account change
    if (account !== prevAccountRef.current) {
      accountCallbacksRef.current.forEach(callback => {
        try {
          callback(account);
        } catch (error) {
          console.error("Error in account change callback:", error);
        }
      });
      prevAccountRef.current = account;
      setStats(prev => ({ totalEvents: prev.totalEvents + 1 }));
    }

    // Check chain change
    if (chain !== prevChainRef.current) {
      chainCallbacksRef.current.forEach(callback => {
        try {
          callback(chain);
        } catch (error) {
          console.error("Error in chain change callback:", error);
        }
      });
      prevChainRef.current = chain;
      setStats(prev => ({ totalEvents: prev.totalEvents + 1 }));
    }

    // Check connection change
    if (isConnected !== prevConnectionRef.current) {
      connectionCallbacksRef.current.forEach(callback => {
        try {
          callback(isConnected);
        } catch (error) {
          console.error("Error in connection change callback:", error);
        }
      });
      prevConnectionRef.current = isConnected;
      setStats(prev => ({ totalEvents: prev.totalEvents + 1 }));
    }
  }, [account, chain, isConnected, enableTracking]);

  // Event handler registration
  const onAccountChange = useCallback((callback: (account: any) => void) => {
    accountCallbacksRef.current.push(callback);

    // Return unsubscribe function
    return () => {
      const index = accountCallbacksRef.current.indexOf(callback);
      if (index > -1) {
        accountCallbacksRef.current.splice(index, 1);
      }
    };
  }, []);

  const onChainChange = useCallback((callback: (chain: any) => void) => {
    chainCallbacksRef.current.push(callback);

    // Return unsubscribe function
    return () => {
      const index = chainCallbacksRef.current.indexOf(callback);
      if (index > -1) {
        chainCallbacksRef.current.splice(index, 1);
      }
    };
  }, []);

  const onConnectionChange = useCallback(
    (callback: (isConnected: boolean) => void) => {
      connectionCallbacksRef.current.push(callback);

      // Return unsubscribe function
      return () => {
        const index = connectionCallbacksRef.current.indexOf(callback);
        if (index > -1) {
          connectionCallbacksRef.current.splice(index, 1);
        }
      };
    },
    []
  );

  // Clear events
  const clearEvents = useCallback(() => {
    setStats({ totalEvents: 0 });
  }, []);

  return {
    stats,
    onAccountChange,
    onChainChange,
    onConnectionChange,
    clearEvents,
  };
}
