/**
 * Enhanced ChainSelector Component
 *
 * Modern chain switching dropdown with comprehensive features:
 * - Chain switching with validation
 * - Network status indicators
 * - Chain logos and metadata
 * - Loading states and error handling
 * - Responsive design
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Check,
  AlertCircle,
  Wifi,
  WifiOff,
  Zap,
  Clock,
  Shield,
  TestTube,
} from "lucide-react";

import { useWallet } from "@/hooks/useWallet";
import { useChain } from "@/hooks/useChain";
import { useWalletEvents } from "@/hooks/useWalletEvents";
import { WalletEventType, type Chain } from "@/types/wallet";

/**
 * ChainSelector component props
 */
interface ChainSelectorProps {
  className?: string;
  variant?: "default" | "compact" | "minimal";
  showLabel?: boolean;
  showNetworkStatus?: boolean;
  showTestnets?: boolean;
  disabled?: boolean;
  onChainSwitch?: (chain: Chain) => void;
  onError?: (error: Error) => void;
}

/**
 * Chain option component
 */
interface ChainOptionProps {
  chain: Chain;
  isSelected: boolean;
  isDisabled: boolean;
  networkLatency?: number | null | undefined;
  onClick: () => void;
}

function ChainOption({
  chain,
  isSelected,
  isDisabled,
  networkLatency,
  onClick,
}: ChainOptionProps) {
  const getLatencyColor = (latency: number | null) => {
    if (!latency) return "text-gray-400";
    if (latency < 100) return "text-green-500";
    if (latency < 500) return "text-yellow-500";
    return "text-red-500";
  };

  const getLatencyIcon = (latency: number | null | undefined) => {
    if (!latency) return WifiOff;
    if (latency < 100) return Wifi;
    if (latency < 500) return Clock;
    return AlertCircle;
  };

  const LatencyIcon = getLatencyIcon(networkLatency);

  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
        ${
          isSelected
            ? "bg-purple-600/20 border border-purple-500/30"
            : "hover:bg-gray-800/50"
        }
        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <div className="flex items-center space-x-3">
        {/* Chain icon */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {chain.name.charAt(0)}
            </span>
          </div>

          {/* Network type indicator */}
          {chain.isTestnet && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-500 flex items-center justify-center">
              <TestTube className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Chain info */}
        <div className="flex-1 text-left">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">{chain.name}</span>
            {!chain.isSupported && (
              <span className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
                Soon
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {chain.symbol} • {chain.isTestnet ? "Testnet" : "Mainnet"}
          </div>
        </div>

        {/* Network status */}
        <div className="flex items-center space-x-2">
          {networkLatency !== undefined && (
            <div className="flex items-center space-x-1">
              <LatencyIcon
                className={`w-3 h-3 ${getLatencyColor(networkLatency)}`}
              />
              {networkLatency && (
                <span className={`text-xs ${getLatencyColor(networkLatency)}`}>
                  {networkLatency}ms
                </span>
              )}
            </div>
          )}

          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="w-4 h-4 text-green-500" />
            </motion.div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/**
 * Network status indicator
 */
interface NetworkStatusProps {
  isOnline: boolean;
  isStable: boolean;
  latency: number | null;
  consecutiveFailures: number;
}

function NetworkStatus({
  isOnline,
  isStable,
  latency,
  consecutiveFailures,
}: NetworkStatusProps) {
  const getStatusColor = () => {
    if (!isOnline) return "text-red-500";
    if (!isStable || consecutiveFailures > 0) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (!isStable) return "Unstable";
    if (consecutiveFailures > 0) return "Reconnecting";
    return "Online";
  };

  const StatusIcon = isOnline ? Wifi : WifiOff;

  return (
    <div className="flex items-center space-x-1">
      <StatusIcon className={`w-3 h-3 ${getStatusColor()}`} />
      <span className={`text-xs ${getStatusColor()}`}>{getStatusText()}</span>
      {latency && isOnline && (
        <span className="text-xs text-gray-400">({latency}ms)</span>
      )}
    </div>
  );
}

/**
 * ChainSelector Component
 */
export function ChainSelector({
  className = "",
  variant = "default",
  showLabel = true,
  showNetworkStatus = true,
  showTestnets = false,
  disabled = false,
  onChainSwitch,
  onError,
}: ChainSelectorProps) {
  // Hooks
  const wallet = useWallet();
  const chain = useChain({
    enableValidation: true,
    networkStatusInterval: 10000,
    ...(onChainSwitch && { onChainChange: onChainSwitch }),
    debug: false,
  });

  useWalletEvents({
    enableHistory: false,
    eventTypeFilter: [WalletEventType.CHAIN_CHANGED],
  });

  // Local state
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter chains based on showTestnets
  const availableChains = chain.supportedChains.filter(
    c => showTestnets || !c.isTestnet
  );

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }

    return undefined;
  }, [isOpen]);

  // Handle chain switch
  const handleChainSwitch = async (targetChain: Chain) => {
    if (
      !wallet.isConnected ||
      targetChain.id === chain.chainId ||
      !targetChain.isSupported
    ) {
      return;
    }

    setIsOpen(false);

    try {
      await chain.switchChain(targetChain.id);
    } catch (error) {
      if (onError) {
        onError(
          error instanceof Error ? error : new Error("Chain switch failed")
        );
      }
    }
  };

  // Render different variants
  const renderButton = () => {
    const currentChain = chain.chain;
    const isConnected = wallet.isConnected;
    const isSwitching = chain.isSwitching;

    if (variant === "minimal") {
      return (
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || !isConnected || isSwitching}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
            ${
              isConnected
                ? "hover:bg-gray-800/50 text-white"
                : "text-gray-400 cursor-not-allowed"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {currentChain ? (
            <>
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {currentChain.name.charAt(0)}
                </span>
              </div>
              <span className="text-sm">{currentChain.name}</span>
            </>
          ) : (
            <span className="text-sm">Select Network</span>
          )}
          <ChevronDown
            className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      );
    }

    if (variant === "compact") {
      return (
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || !isConnected || isSwitching}
          className={`
            flex items-center justify-between px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
            transition-all duration-200 min-w-[120px]
            ${
              isConnected
                ? "hover:border-gray-600 cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {currentChain ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />
              <span className="text-sm text-white">{currentChain.name}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Select</span>
          )}

          {isSwitching ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-3 h-3 text-purple-400" />
            </motion.div>
          ) : (
            <ChevronDown
              className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>
      );
    }

    // Default variant
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || !isConnected || isSwitching}
        className={`
          w-full flex items-center justify-between px-4 py-3 
          bg-gray-900/50 border border-gray-700 rounded-xl
          transition-all duration-200
          ${
            isConnected
              ? "hover:border-gray-600 cursor-pointer"
              : "opacity-50 cursor-not-allowed"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <div className="flex items-center space-x-3">
          {currentChain ? (
            <>
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {currentChain.name.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <div className="text-white font-medium">
                  {currentChain.name}
                </div>
                {showNetworkStatus && (
                  <NetworkStatus
                    isOnline={chain.networkStatus.isOnline}
                    isStable={chain.networkStatus.isStable}
                    latency={chain.networkStatus.latency}
                    consecutiveFailures={
                      chain.networkStatus.consecutiveFailures
                    }
                  />
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-400">Select Network</span>
          )}
        </div>

        {isSwitching ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-4 h-4 text-purple-400" />
          </motion.div>
        ) : (
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>
    );
  };

  if (!wallet.isConnected) {
    return (
      <div className={`flex items-center space-x-2 text-gray-400 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        {showLabel && variant === "default" && (
          <span className="text-sm">Connect wallet to switch chains</span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {showLabel && variant === "default" && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Network
        </label>
      )}

      <div className="relative">
        {renderButton()}

        {/* Dropdown menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 z-50"
            >
              <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                {/* Header */}
                <div className="p-3 border-b border-gray-700 bg-gray-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      Select Network
                    </span>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-gray-400">
                        {availableChains.length} networks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chain options */}
                <div className="p-2 space-y-1">
                  {availableChains.map(chainOption => (
                    <ChainOption
                      key={chainOption.id}
                      chain={chainOption}
                      isSelected={chainOption.id === chain.chainId}
                      isDisabled={!chainOption.isSupported}
                      networkLatency={
                        chainOption.id === chain.chainId
                          ? chain.networkStatus.latency
                          : undefined
                      }
                      onClick={() => handleChainSwitch(chainOption)}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-700 bg-gray-800/30">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {chain.isTestnet ? "Testnet" : "Mainnet"} •
                      {chain.isSupported ? "Supported" : "Unsupported"}
                    </span>
                    <span>
                      Latency: {chain.networkStatus.latency || "N/A"}ms
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Default export
 */
export default ChainSelector;
