/**
 * Modern WalletButton Component
 *
 * Provider-agnostic wallet connection button with comprehensive features:
 * - Account display with dropdown
 * - Address copying and explorer links
 * - Loading states and error handling
 * - Modern UI with proper styling
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  User,
  LogOut,
  Copy,
  ExternalLink,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Settings,
  Zap,
} from "lucide-react";

import { useWallet } from "@/hooks/useWallet";
import { useChain } from "@/hooks/useChain";

/**
 * WalletButton component props
 */
interface WalletButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  showFullAddress?: boolean;
  showBalance?: boolean;
  showChainIndicator?: boolean;
  showProviderIcon?: boolean;
  disabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Account dropdown item component
 */
interface DropdownItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
  disabled?: boolean;
}

function DropdownItem({
  icon: Icon,
  label,
  description,
  onClick,
  variant = "default",
  disabled = false,
}: DropdownItemProps) {
  const variantStyles = {
    default: "hover:bg-gray-800 text-white",
    danger: "hover:bg-red-900/50 text-red-400 hover:text-red-300",
    success: "hover:bg-green-900/50 text-green-400 hover:text-green-300",
  };

  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200
        ${variantStyles[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1 text-left">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-gray-400">{description}</div>
        )}
      </div>
    </motion.button>
  );
}

/**
 * Connection status indicator
 */
interface StatusIndicatorProps {
  isConnected: boolean;
  isConnecting: boolean;
  hasError: boolean;
  networkStatus?: {
    isOnline: boolean;
    isStable: boolean;
  };
}

function StatusIndicator({
  isConnected,
  isConnecting,
  hasError,
  networkStatus,
}: StatusIndicatorProps) {
  if (isConnecting) {
    return (
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-xs text-yellow-500">Connecting...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-xs text-red-500">Error</span>
      </div>
    );
  }

  if (isConnected) {
    const isNetworkHealthy = networkStatus?.isOnline && networkStatus?.isStable;

    return (
      <div className="flex items-center space-x-1">
        <div
          className={`w-2 h-2 rounded-full ${
            isNetworkHealthy ? "bg-green-500 animate-pulse" : "bg-yellow-500"
          }`}
        />
        <span
          className={`text-xs ${
            isNetworkHealthy ? "text-green-500" : "text-yellow-500"
          }`}
        >
          {isNetworkHealthy ? "Connected" : "Unstable"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 bg-gray-500 rounded-full" />
      <span className="text-xs text-gray-500">Disconnected</span>
    </div>
  );
}

/**
 * WalletButton Component
 */
export function WalletButton({
  className = "",
  variant = "primary",
  size = "md",
  showFullAddress = false,
  showBalance = false,
  showChainIndicator = true,
  showProviderIcon = true,
  disabled = false,
  onConnect,
  onDisconnect,
  onError,
}: WalletButtonProps) {
  // Hooks
  const wallet = useWallet({
    autoConnect: true,
    retryOnFailure: true,
    ...(onConnect && { onConnect }),
    ...(onDisconnect && { onDisconnect }),
    ...(onError && { onError }),
  });

  const chain = useChain({
    enableValidation: true,
    networkStatusInterval: 30000,
  });

  // Local state
  const [showDropdown, setShowDropdown] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {};
  }, [showDropdown]);

  // Handle copy address
  const handleCopyAddress = async () => {
    const success = await wallet.copyAddress();
    if (success) {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  // Handle retry connection
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await wallet.retry();
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    setShowDropdown(false);
    await wallet.disconnect();
  };

  // Button styles
  const getButtonStyles = () => {
    const baseStyles =
      "flex items-center justify-center space-x-2 font-medium rounded-xl transition-all duration-200 relative overflow-hidden";

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl",
      secondary:
        "bg-gray-900/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-white backdrop-blur-sm",
      ghost: "hover:bg-gray-800 text-gray-300 hover:text-white",
      outline:
        "border-2 border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white",
    };

    const sizeStyles = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-3 text-base",
      lg: "px-6 py-4 text-lg",
    };

    return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`;
  };

  // Loading states
  if (wallet.isConnecting || isRetrying) {
    return (
      <button
        disabled
        className={`${getButtonStyles()} opacity-50 cursor-not-allowed ${className}`}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4"
        >
          <Zap className="w-4 h-4" />
        </motion.div>
        <span>{isRetrying ? "Retrying..." : "Connecting..."}</span>
      </button>
    );
  }

  // Error state with retry option
  if (wallet.error && wallet.canRetry) {
    return (
      <button
        onClick={handleRetry}
        disabled={disabled}
        className={`${getButtonStyles()} border-red-500 text-red-400 hover:bg-red-900/20 ${className}`}
      >
        <AlertCircle className="w-4 h-4" />
        <span>Retry Connection</span>
      </button>
    );
  }

  // Connected state - show account dropdown
  if (wallet.isConnected && wallet.account) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled}
          className={getButtonStyles()}
        >
          {/* Account avatar */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>

          {/* Account info */}
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {wallet.formatAddress(
                wallet.account.address,
                showFullAddress ? 42 : 8
              )}
            </span>
            {showBalance && wallet.account.balance && (
              <span className="text-xs text-gray-400">
                {parseFloat(wallet.account.balance).toFixed(4)}{" "}
                {chain.getChainSymbol()}
              </span>
            )}
          </div>

          {/* Chain indicator */}
          {showChainIndicator && chain.chain && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-400">{chain.chain.name}</span>
            </div>
          )}

          {/* Provider icon */}
          {showProviderIcon && (
            <div className="text-xs text-gray-400">
              {wallet.getProviderName()}
            </div>
          )}

          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              showDropdown ? "rotate-180" : ""
            }`}
          />
        </motion.button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-xl z-50"
            >
              {/* Account header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {wallet.formatAddress(wallet.account.address, 16)}
                    </div>
                    {wallet.account.displayName && (
                      <div className="text-xs text-purple-400">
                        {wallet.account.displayName}
                      </div>
                    )}
                    <StatusIndicator
                      isConnected={wallet.isConnected}
                      isConnecting={wallet.isConnecting}
                      hasError={!!wallet.error}
                      networkStatus={chain.networkStatus}
                    />
                  </div>
                </div>
              </div>

              {/* Account actions */}
              <div className="p-2">
                <DropdownItem
                  icon={copiedAddress ? CheckCircle : Copy}
                  label={copiedAddress ? "Copied!" : "Copy Address"}
                  description="Copy wallet address to clipboard"
                  onClick={handleCopyAddress}
                  variant={copiedAddress ? "success" : "default"}
                />

                <DropdownItem
                  icon={ExternalLink}
                  label="View in Explorer"
                  description={`Open on ${chain.chain?.name || "block explorer"}`}
                  onClick={() => wallet.openInExplorer()}
                  disabled={!chain.chain?.blockExplorer}
                />

                <DropdownItem
                  icon={Settings}
                  label="Switch Network"
                  description="Change blockchain network"
                  onClick={() => {
                    setShowDropdown(false);
                    // This could open a chain selector modal
                  }}
                />

                <hr className="my-2 border-gray-700" />

                <DropdownItem
                  icon={LogOut}
                  label="Disconnect"
                  description="Disconnect from wallet"
                  onClick={handleDisconnect}
                  variant="danger"
                />
              </div>

              {/* Footer info */}
              <div className="p-3 border-t border-gray-700 bg-gray-800/30">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Provider: {wallet.getProviderName()}</span>
                  {chain.chain && <span>Network: {chain.chain.name}</span>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Disconnected state - show connect button
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={wallet.connect}
      disabled={disabled}
      className={`${getButtonStyles()} ${className}`}
    >
      <Wallet className="w-5 h-5" />
      <span>Connect Wallet</span>

      {/* Animated background effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}

/**
 * Default export
 */
export default WalletButton;
