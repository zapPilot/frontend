/**
 * Wallet Integration Demo Component
 *
 * Demonstrates the new flexible wallet integration system with provider abstraction,
 * event handling, and comprehensive error management.
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Network,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowUpDown,
  Zap,
} from "lucide-react";

import { useWalletConnection, useWalletContext } from "@/providers";
import {
  WalletEventType,
  type ProviderType,
  type WalletEvent,
} from "@/types/wallet";

export function WalletIntegrationDemo() {
  const {
    account,
    chain,
    isConnected,
    isConnecting,
    isDisconnecting,
    connect,
    disconnect,
    switchChain,
    error,
    clearError,
  } = useWalletConnection();

  const {
    providerType,
    switchProvider,
    getAvailableProviders,
    addEventListener,
    events,
    clearEvents,
    supportedChains,
  } = useWalletContext();

  // Local state
  const [availableProviders, setAvailableProviders] = useState<ProviderType[]>(
    []
  );
  const [recentEvents, setRecentEvents] = useState<WalletEvent[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get available providers on mount
  useEffect(() => {
    setAvailableProviders(getAvailableProviders());
  }, [getAvailableProviders]);

  // Subscribe to wallet events
  useEffect(() => {
    const unsubscribeAccount = addEventListener(
      WalletEventType.ACCOUNT_CHANGED,
      event => {
        setRecentEvents(prev => [...prev.slice(-4), event]);
      }
    );

    const unsubscribeChain = addEventListener(
      WalletEventType.CHAIN_CHANGED,
      event => {
        setRecentEvents(prev => [...prev.slice(-4), event]);
      }
    );

    const unsubscribeConnection = addEventListener(
      WalletEventType.CONNECTION_CHANGED,
      event => {
        setRecentEvents(prev => [...prev.slice(-4), event]);
      }
    );

    const unsubscribeProvider = addEventListener(
      WalletEventType.PROVIDER_CHANGED,
      event => {
        setRecentEvents(prev => [...prev.slice(-4), event]);
      }
    );

    return () => {
      unsubscribeAccount();
      unsubscribeChain();
      unsubscribeConnection();
      unsubscribeProvider();
    };
  }, [addEventListener]);

  // Handle provider switching
  const handleProviderSwitch = async (newProvider: ProviderType) => {
    try {
      await switchProvider(newProvider);
    } catch {
      // Error will be handled by wallet context
    }
  };

  // Handle chain switching
  const handleChainSwitch = async (chainId: number) => {
    try {
      await switchChain(chainId);
    } catch {
      // Error will be handled by wallet context
    }
  };

  // Format event for display
  const formatEvent = (event: WalletEvent) => {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    return `${timestamp}: ${event.type}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Wallet Integration Demo
        </h1>
        <p className="text-gray-400 mt-2">
          Flexible wallet provider system with provider abstraction
        </p>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Error: {error.type}</p>
              <p className="text-red-300 text-sm">{error.message}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Wallet Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-400" : "bg-gray-400"}`}
            />
            <h3 className="text-lg font-semibold">Connection Status</h3>
          </div>

          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Connected</span>
              </div>
              <div className="text-sm text-gray-400">
                <p>Address: {account?.address}</p>
                <p>
                  Chain: {chain?.name} (ID: {chain?.id})
                </p>
                <p>Provider: {providerType}</p>
              </div>
              <button
                onClick={disconnect}
                disabled={isDisconnecting}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded-lg py-2 px-4 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    Disconnect
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">Disconnected</span>
              </div>
              <button
                onClick={connect}
                disabled={isConnecting}
                className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/20 rounded-lg py-2 px-4 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Chain Management */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Network className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold">Chain Management</h3>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-400">
              Current: {chain?.name || "Not connected"}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {supportedChains.map(supportedChain => (
                <button
                  key={supportedChain.id}
                  onClick={() => handleChainSwitch(supportedChain.id)}
                  disabled={!isConnected || chain?.id === supportedChain.id}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    chain?.id === supportedChain.id
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                      : "bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700"
                  } disabled:opacity-50`}
                >
                  {supportedChain.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Controls */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <Settings className="h-4 w-4" />
          Advanced Controls
          <ArrowUpDown
            className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Wallet Provider
                </label>
                <select
                  value={providerType}
                  onChange={e =>
                    handleProviderSwitch(e.target.value as ProviderType)
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  {availableProviders.map(provider => (
                    <option key={provider} value={provider}>
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-400">
                    Recent Events
                  </label>
                  <button
                    onClick={clearEvents}
                    className="text-xs text-gray-500 hover:text-gray-400"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-3 h-24 overflow-y-auto">
                  {recentEvents.length > 0 ? (
                    <div className="space-y-1">
                      {recentEvents.map((event, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-400 font-mono"
                        >
                          {formatEvent(event)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic">
                      No recent events
                    </div>
                  )}
                </div>
              </div>

              {/* Debug Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Total Events:</span>
                  <span className="text-white ml-2">{events.length}</span>
                </div>
                <div>
                  <span className="text-gray-400">Available Providers:</span>
                  <span className="text-white ml-2">
                    {availableProviders.length}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feature Highlights */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold">Integration Features</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-purple-400">
              Provider Abstraction
            </h4>
            <p className="text-gray-400">
              Switch between ThirdWeb, RainbowKit, Wagmi, and WalletConnect
              without code changes
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-purple-400">Event System</h4>
            <p className="text-gray-400">
              Real-time wallet events for account, chain, and connection changes
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-purple-400">Error Handling</h4>
            <p className="text-gray-400">
              Comprehensive error management with type-safe error boundaries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalletIntegrationDemo;
