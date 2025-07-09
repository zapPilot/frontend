/**
 * useWalletEvents Hook
 *
 * Event subscription management for wallet events with real-time updates
 * and proper cleanup handling.
 */

"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useWalletContext } from "@/providers/WalletContext";
import {
  WalletEventType,
  type WalletEvent,
  type WalletAccount,
  type Chain,
  type ProviderType,
} from "@/types/wallet";

/**
 * Event listener configuration
 */
interface EventListenerConfig {
  /** Enable event history tracking */
  enableHistory?: boolean;
  /** Maximum number of events to keep in history */
  maxHistorySize?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Filter events by type */
  eventTypeFilter?: WalletEventType[];
  /** Enable automatic cleanup */
  autoCleanup?: boolean;
}

/**
 * Event statistics
 */
interface EventStats {
  totalEvents: number;
  eventsByType: Record<WalletEventType, number>;
  lastEventTime: number | null;
  subscriptionCount: number;
}

/**
 * Wallet events hook return type
 */
interface UseWalletEventsReturn {
  // Event history
  events: WalletEvent[];
  lastEvent: WalletEvent | null;

  // Event statistics
  stats: EventStats;

  // Subscription management
  addEventListener: (
    type: WalletEventType,
    listener: (event: WalletEvent) => void,
    options?: { once?: boolean }
  ) => () => void;
  removeEventListener: (
    type: WalletEventType,
    listener: (event: WalletEvent) => void
  ) => void;
  removeAllListeners: (type?: WalletEventType) => void;

  // Event utilities
  getEventsByType: (type: WalletEventType) => WalletEvent[];
  getEventsInRange: (startTime: number, endTime: number) => WalletEvent[];
  clearEvents: () => void;

  // Convenience event handlers
  onAccountChange: (
    listener: (account: WalletAccount | null) => void
  ) => () => void;
  onChainChange: (listener: (chain: Chain | null) => void) => () => void;
  onConnectionChange: (listener: (isConnected: boolean) => void) => () => void;
  onProviderChange: (
    listener: (providerType: ProviderType) => void
  ) => () => void;

  // Real-time status
  isListening: boolean;
  activeListeners: number;
}

/**
 * useWalletEvents Hook
 *
 * Provides comprehensive event subscription management for wallet events
 * with history tracking, statistics, and convenience methods.
 */
export function useWalletEvents(
  config: EventListenerConfig = {}
): UseWalletEventsReturn {
  const {
    enableHistory = true,
    maxHistorySize = 100,
    debug = false,
    eventTypeFilter,
    autoCleanup = true,
  } = config;

  // Get wallet context
  const walletContext = useWalletContext();

  // Local state
  const [events, setEvents] = useState<WalletEvent[]>([]);
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    eventsByType: {
      [WalletEventType.ACCOUNT_CHANGED]: 0,
      [WalletEventType.CHAIN_CHANGED]: 0,
      [WalletEventType.CONNECTION_CHANGED]: 0,
      [WalletEventType.PROVIDER_CHANGED]: 0,
    },
    lastEventTime: null,
    subscriptionCount: 0,
  });

  // Refs for managing subscriptions
  const listenersRef = useRef<
    Map<
      WalletEventType,
      Set<{
        listener: (event: WalletEvent) => void;
        once?: boolean;
      }>
    >
  >(new Map());
  const unsubscribersRef = useRef<Map<WalletEventType, (() => void)[]>>(
    new Map()
  );

  // Extract context values
  const {
    lastEvent,
    addEventListener: contextAddEventListener,
    clearEvents: contextClearEvents,
  } = walletContext;

  // Process incoming events
  useEffect(() => {
    if (!lastEvent) return;

    // Apply event filter if configured
    if (eventTypeFilter && !eventTypeFilter.includes(lastEvent.type)) {
      return;
    }

    // Add to history if enabled
    if (enableHistory) {
      setEvents(prev => {
        const newEvents = [...prev, lastEvent];

        // Trim history if it exceeds max size
        if (newEvents.length > maxHistorySize) {
          return newEvents.slice(-maxHistorySize);
        }

        return newEvents;
      });
    }

    // Update statistics
    setStats(prev => ({
      ...prev,
      totalEvents: prev.totalEvents + 1,
      eventsByType: {
        ...prev.eventsByType,
        [lastEvent.type]: prev.eventsByType[lastEvent.type] + 1,
      },
      lastEventTime: lastEvent.timestamp,
    }));

    // Notify local listeners
    const listeners = listenersRef.current.get(lastEvent.type);
    if (listeners) {
      const listenersToRemove: any[] = [];

      listeners.forEach(({ listener, once }) => {
        try {
          listener(lastEvent);

          // Remove one-time listeners
          if (once) {
            listenersToRemove.push({ listener, once });
          }
        } catch (error) {
          log("Error in event listener", { error, eventType: lastEvent.type });
        }
      });

      // Clean up one-time listeners
      listenersToRemove.forEach(item => {
        listeners.delete(item);
      });
    }

    log("Event processed", {
      type: lastEvent.type,
      payload: lastEvent.payload,
      timestamp: lastEvent.timestamp,
    });
  }, [lastEvent, eventTypeFilter, enableHistory, maxHistorySize]);

  // Enhanced add event listener
  const addEventListener = useCallback(
    (
      type: WalletEventType,
      listener: (event: WalletEvent) => void,
      options: { once?: boolean } = {}
    ) => {
      const { once = false } = options;

      // Add to local listeners
      if (!listenersRef.current.has(type)) {
        listenersRef.current.set(type, new Set());
      }

      const listeners = listenersRef.current.get(type)!;
      const listenerItem = { listener, once };
      listeners.add(listenerItem);

      // Subscribe to context events if this is the first listener for this type
      if (listeners.size === 1) {
        const unsubscribe = contextAddEventListener(type, listener);

        if (!unsubscribersRef.current.has(type)) {
          unsubscribersRef.current.set(type, []);
        }
        unsubscribersRef.current.get(type)!.push(unsubscribe);
      }

      // Update subscription count
      setStats(prev => ({
        ...prev,
        subscriptionCount: prev.subscriptionCount + 1,
      }));

      log("Event listener added", { type, once });

      // Return unsubscribe function
      return () => {
        listeners.delete(listenerItem);

        // Remove context subscription if no more listeners
        if (listeners.size === 0) {
          const unsubscribers = unsubscribersRef.current.get(type);
          if (unsubscribers) {
            unsubscribers.forEach(unsubscribe => unsubscribe());
            unsubscribersRef.current.delete(type);
          }
        }

        // Update subscription count
        setStats(prev => ({
          ...prev,
          subscriptionCount: Math.max(0, prev.subscriptionCount - 1),
        }));

        log("Event listener removed", { type });
      };
    },
    [contextAddEventListener]
  );

  // Enhanced remove event listener
  const removeEventListener = useCallback(
    (type: WalletEventType, listener: (event: WalletEvent) => void) => {
      const listeners = listenersRef.current.get(type);
      if (!listeners) return;

      // Find and remove the listener
      let removed = false;
      listeners.forEach(item => {
        if (item.listener === listener) {
          listeners.delete(item);
          removed = true;
        }
      });

      if (removed) {
        // Remove context subscription if no more listeners
        if (listeners.size === 0) {
          const unsubscribers = unsubscribersRef.current.get(type);
          if (unsubscribers) {
            unsubscribers.forEach(unsubscribe => unsubscribe());
            unsubscribersRef.current.delete(type);
          }
        }

        // Update subscription count
        setStats(prev => ({
          ...prev,
          subscriptionCount: Math.max(0, prev.subscriptionCount - 1),
        }));

        log("Event listener removed", { type });
      }
    },
    []
  );

  // Remove all listeners
  const removeAllListeners = useCallback((type?: WalletEventType) => {
    if (type) {
      // Remove listeners for specific type
      const listeners = listenersRef.current.get(type);
      if (listeners) {
        const count = listeners.size;
        listeners.clear();

        // Remove context subscriptions
        const unsubscribers = unsubscribersRef.current.get(type);
        if (unsubscribers) {
          unsubscribers.forEach(unsubscribe => unsubscribe());
          unsubscribersRef.current.delete(type);
        }

        // Update subscription count
        setStats(prev => ({
          ...prev,
          subscriptionCount: Math.max(0, prev.subscriptionCount - count),
        }));

        log("All listeners removed for type", { type, count });
      }
    } else {
      // Remove all listeners
      let totalCount = 0;

      listenersRef.current.forEach(listeners => {
        totalCount += listeners.size;
        listeners.clear();
      });

      // Remove all context subscriptions
      unsubscribersRef.current.forEach(unsubscribers => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      });
      unsubscribersRef.current.clear();

      // Reset subscription count
      setStats(prev => ({
        ...prev,
        subscriptionCount: 0,
      }));

      log("All listeners removed", { totalCount });
    }
  }, []);

  // Event utility methods
  const getEventsByType = useCallback(
    (type: WalletEventType): WalletEvent[] => {
      return events.filter(event => event.type === type);
    },
    [events]
  );

  const getEventsInRange = useCallback(
    (startTime: number, endTime: number): WalletEvent[] => {
      return events.filter(
        event => event.timestamp >= startTime && event.timestamp <= endTime
      );
    },
    [events]
  );

  const clearEvents = useCallback(() => {
    setEvents([]);
    setStats(prev => ({
      ...prev,
      totalEvents: 0,
      eventsByType: {
        [WalletEventType.ACCOUNT_CHANGED]: 0,
        [WalletEventType.CHAIN_CHANGED]: 0,
        [WalletEventType.CONNECTION_CHANGED]: 0,
        [WalletEventType.PROVIDER_CHANGED]: 0,
      },
      lastEventTime: null,
    }));

    // Clear context events
    contextClearEvents();

    log("Events cleared");
  }, [contextClearEvents]);

  // Convenience event handlers
  const onAccountChange = useCallback(
    (listener: (account: WalletAccount | null) => void) => {
      return addEventListener(WalletEventType.ACCOUNT_CHANGED, event => {
        listener(event.payload as WalletAccount | null);
      });
    },
    [addEventListener]
  );

  const onChainChange = useCallback(
    (listener: (chain: Chain | null) => void) => {
      return addEventListener(WalletEventType.CHAIN_CHANGED, event => {
        listener(event.payload as Chain | null);
      });
    },
    [addEventListener]
  );

  const onConnectionChange = useCallback(
    (listener: (isConnected: boolean) => void) => {
      return addEventListener(WalletEventType.CONNECTION_CHANGED, event => {
        listener(event.payload as boolean);
      });
    },
    [addEventListener]
  );

  const onProviderChange = useCallback(
    (listener: (providerType: ProviderType) => void) => {
      return addEventListener(WalletEventType.PROVIDER_CHANGED, event => {
        listener(event.payload as ProviderType);
      });
    },
    [addEventListener]
  );

  // Auto-cleanup on unmount
  useEffect(() => {
    if (autoCleanup) {
      return () => {
        removeAllListeners();
        log("Auto-cleanup completed");
      };
    }

    return () => {};
  }, [autoCleanup, removeAllListeners]);

  // Debug logging
  const log = useCallback(
    (message: string, data?: unknown) => {
      if (debug) {
        console.log(`[useWalletEvents] ${message}`, data || "");
      }
    },
    [debug]
  );

  return {
    // Event history
    events,
    lastEvent,

    // Event statistics
    stats,

    // Subscription management
    addEventListener,
    removeEventListener,
    removeAllListeners,

    // Event utilities
    getEventsByType,
    getEventsInRange,
    clearEvents,

    // Convenience event handlers
    onAccountChange,
    onChainChange,
    onConnectionChange,
    onProviderChange,

    // Real-time status
    isListening: stats.subscriptionCount > 0,
    activeListeners: stats.subscriptionCount,
  };
}

/**
 * Default export
 */
export default useWalletEvents;
