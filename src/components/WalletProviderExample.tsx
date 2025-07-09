/**
 * Wallet Provider Example Component
 *
 * Demonstrates the new Provider Abstraction Layer functionality
 * including provider switching, error handling, and event system.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useWalletConnection, useWalletContext } from "@/providers";
import {
  WalletEventType,
  type ProviderType,
  type WalletEvent,
} from "@/types/wallet";

export function WalletProviderExample() {
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
  } = useWalletContext();

  const [availableProviders, setAvailableProviders] = useState<ProviderType[]>(
    []
  );
  const [eventHistory, setEventHistory] = useState<WalletEvent[]>([]);

  // Get available providers on mount
  useEffect(() => {
    setAvailableProviders(getAvailableProviders());
  }, [getAvailableProviders]);

  // Subscribe to wallet events
  useEffect(() => {
    const unsubscribeAccount = addEventListener(
      WalletEventType.ACCOUNT_CHANGED,
      event => {
        setEventHistory(prev => [...prev.slice(-9), event]);
      }
    );

    const unsubscribeChain = addEventListener(
      WalletEventType.CHAIN_CHANGED,
      event => {
        setEventHistory(prev => [...prev.slice(-9), event]);
      }
    );

    const unsubscribeConnection = addEventListener(
      WalletEventType.CONNECTION_CHANGED,
      event => {
        setEventHistory(prev => [...prev.slice(-9), event]);
      }
    );

    const unsubscribeProvider = addEventListener(
      WalletEventType.PROVIDER_CHANGED,
      event => {
        setEventHistory(prev => [...prev.slice(-9), event]);
      }
    );

    return () => {
      unsubscribeAccount();
      unsubscribeChain();
      unsubscribeConnection();
      unsubscribeProvider();
    };
  }, [addEventListener]);

  const handleProviderSwitch = async (newProvider: ProviderType) => {
    try {
      await switchProvider(newProvider);
    } catch {
      // Error will be handled by wallet context
    }
  };

  const handleChainSwitch = async (chainId: number) => {
    try {
      await switchChain(chainId);
    } catch {
      // Error will be handled by wallet context
    }
  };

  const formatEventType = (type: WalletEventType): string => {
    switch (type) {
      case "accountChanged":
        return "👤 Account";
      case "chainChanged":
        return "🔗 Chain";
      case "connectionChanged":
        return "🔌 Connection";
      case "providerChanged":
        return "🔄 Provider";
      default:
        return "📨 Event";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Wallet Provider Abstraction Layer Demo
      </h2>

      {/* Provider Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Provider Management
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Current Provider:{" "}
              <span className="font-bold text-blue-600">{providerType}</span>
            </label>
            <div className="flex gap-2">
              {availableProviders.map(provider => (
                <button
                  key={provider}
                  onClick={() => handleProviderSwitch(provider)}
                  disabled={provider === providerType}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    provider === providerType
                      ? "bg-blue-100 text-blue-800 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Connection Status
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isConnected ? "✅ Connected" : "❌ Disconnected"}
            </span>
          </div>

          {account && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Account:
              </span>
              <span className="text-sm font-mono text-gray-800">
                {account.address?.slice(0, 6)}...{account.address?.slice(-4)}
              </span>
            </div>
          )}

          {chain && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Chain:</span>
              <span className="text-sm text-gray-800">
                {chain.name} ({chain.id})
              </span>
            </div>
          )}

          <div className="flex gap-2">
            {isConnected ? (
              <button
                onClick={disconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chain Switching */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Chain Management
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleChainSwitch(1)}
            disabled={!isConnected}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Ethereum (1)
          </button>
          <button
            onClick={() => handleChainSwitch(42161)}
            disabled={!isConnected}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Arbitrum (42161)
          </button>
          <button
            onClick={() => handleChainSwitch(8453)}
            disabled={!isConnected}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Base (8453)
          </button>
          <button
            onClick={() => handleChainSwitch(10)}
            disabled={!isConnected}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Optimism (10)
          </button>
        </div>
      </div>

      {/* Error Handling */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
              <p className="text-xs text-red-600 mt-1">Type: {error.type}</p>
            </div>
            <button
              onClick={clearError}
              className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Event History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Event History</h3>
          <button
            onClick={clearEvents}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            Clear Events
          </button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {eventHistory.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No events yet</p>
          ) : (
            eventHistory.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
              >
                <span className="text-sm">
                  {formatEventType(event.type)} Changed
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Provider Type: {providerType}</div>
          <div>Available Providers: {availableProviders.join(", ")}</div>
          <div>Total Events: {events.length}</div>
          <div>Connected: {isConnected ? "Yes" : "No"}</div>
          <div>Loading: {isConnecting || isDisconnecting ? "Yes" : "No"}</div>
        </div>
      </div>
    </div>
  );
}

export default WalletProviderExample;
