"use client";

import { useState } from "react";
import { Wallet, User, LogOut, Copy, ExternalLink } from "lucide-react";
import { useWalletConnection } from "../../hooks/useWalletConnection";
import { chainUtils } from "../../config/wallet";

interface WalletConnectButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  showFullAddress?: boolean;
}

export function WalletConnectButton({
  className = "",
  variant = "primary",
  size = "md",
  showFullAddress = false,
}: WalletConnectButtonProps) {
  const { account, connect, disconnect, isConnecting, isDisconnecting, chain } =
    useWalletConnection();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Format address for display
  const formatAddress = (address: string) => {
    if (showFullAddress) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!account?.address) return;

    try {
      await navigator.clipboard.writeText(account.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      // Silently handle clipboard error
    }
  };

  // Open address in explorer
  const openInExplorer = () => {
    if (!account?.address || !chain) return;

    // Use chain utils to get block explorer URL
    const chainConfig = chainUtils.getChainById(chain.id);
    const explorerUrl = chainConfig?.blockExplorer;

    if (explorerUrl) {
      window.open(`${explorerUrl}/address/${account.address}`, "_blank");
    }
  };

  // Button styles based on variant and size
  const getButtonStyles = () => {
    const baseStyles =
      "flex items-center justify-center space-x-2 font-medium rounded-lg transition-all duration-200";

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white",
      secondary:
        "bg-gray-900/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-white",
      ghost: "hover:bg-gray-800 text-gray-300 hover:text-white",
    };

    const sizeStyles = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-3 text-base",
      lg: "px-6 py-4 text-lg",
    };

    return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`;
  };

  // Loading state
  if (isConnecting || isDisconnecting) {
    return (
      <button
        disabled
        className={`${getButtonStyles()} opacity-50 cursor-not-allowed ${className}`}
      >
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        <span>{isConnecting ? "Connecting..." : "Disconnecting..."}</span>
      </button>
    );
  }

  // Connected state - show account dropdown
  if (account?.isConnected) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={getButtonStyles()}
        >
          <User className="w-4 h-4" />
          <span>{formatAddress(account.address)}</span>
          {chain && (
            <div className="w-2 h-2 rounded-full bg-green-500 ml-1"></div>
          )}
        </button>

        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {formatAddress(account.address)}
                  </div>
                  {chain && (
                    <div className="text-xs text-gray-400">
                      Connected to {chain.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={copyAddress}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">
                  {copiedAddress ? "Copied!" : "Copy Address"}
                </span>
              </button>

              <button
                onClick={openInExplorer}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">View in Explorer</span>
              </button>

              <hr className="my-2 border-gray-700" />

              <button
                onClick={disconnect}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-red-900/50 rounded-lg transition-colors text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Disconnect</span>
              </button>
            </div>
          </div>
        )}

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  // Disconnected state - show connect button
  return (
    <button onClick={connect} className={`${getButtonStyles()} ${className}`}>
      <Wallet className="w-4 h-4" />
      <span>Connect Wallet</span>
    </button>
  );
}
