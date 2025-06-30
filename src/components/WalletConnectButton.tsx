"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ChevronDown,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Zap,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useZeroDevWallet, SUPPORTED_CHAINS } from "../hooks/useZeroDevWallet";
import { GlassCard, GradientButton } from "./ui";
import { GRADIENTS } from "../styles/design-tokens";

interface WalletConnectButtonProps {
  className?: string;
  variant?: "default" | "compact";
}

export function WalletConnectButton({
  className = "",
  variant = "default",
}: WalletConnectButtonProps) {
  const { wallet, isConnecting, error, connect, disconnect, switchChain } =
    useZeroDevWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (!wallet) return;

    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Failed to copy address
    }
  };

  const handleNetworkSwitch = async (chainId: number) => {
    if (!wallet || wallet.chainId === chainId) return;

    setIsNetworkSwitching(true);
    try {
      await switchChain(chainId);
      setShowDropdown(false);
    } catch {
      // Network switch failed
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  const openExplorer = () => {
    if (!wallet) return;

    const explorerUrls: Record<number, string> = {
      1: "https://etherscan.io",
      42161: "https://arbiscan.io",
      8453: "https://basescan.org",
      137: "https://polygonscan.com",
    };

    const explorerUrl = explorerUrls[wallet.chainId];
    if (explorerUrl) {
      window.open(`${explorerUrl}/address/${wallet.address}`, "_blank");
    }
  };

  // Compact variant for mobile/header
  if (variant === "compact") {
    if (!wallet) {
      return (
        <button
          onClick={connect}
          disabled={isConnecting}
          className={`p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300 ${className}`}
        >
          {isConnecting ? (
            <RefreshCw className="w-5 h-5 text-gray-300 animate-spin" />
          ) : (
            <Wallet className="w-5 h-5 text-gray-300" />
          )}
        </button>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center space-x-2 p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300 ${className}`}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
            <Shield className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-white">
            {formatAddress(wallet.address)}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown content rendered below */}
      </div>
    );
  }

  // Default variant - full button
  if (!wallet) {
    return (
      <div className={className}>
        <GradientButton
          onClick={connect}
          disabled={isConnecting}
          gradient={GRADIENTS.PRIMARY}
          shadowColor="purple-500"
          className="w-full"
        >
          {isConnecting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </>
          )}
        </GradientButton>

        {error && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Features preview */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2 p-3 glass-morphism rounded-lg">
            <Shield className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-white">
                Account Abstraction
              </div>
              <div className="text-xs text-gray-400">
                Smart wallet with gasless transactions
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 glass-morphism rounded-lg">
            <Zap className="w-4 h-4 text-yellow-400" />
            <div>
              <div className="text-sm font-medium text-white">
                Zero Gas Fees
              </div>
              <div className="text-xs text-gray-400">
                Sponsored by ZeroDev paymaster
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Connected state
  return (
    <div className={`relative ${className}`}>
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Smart Wallet</div>
              <div className="text-xs text-gray-400">
                {SUPPORTED_CHAINS[
                  wallet.chainId as keyof typeof SUPPORTED_CHAINS
                ]?.name || "Unknown Network"}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 glass-morphism rounded-lg mb-4">
          <div>
            <div className="text-sm font-medium text-white">
              {formatAddress(wallet.address)}
            </div>
            <div className="text-xs text-gray-400">Account Address</div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyAddress}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
              title="Copy Address"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <button
              onClick={openExplorer}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
              title="View on Explorer"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-green-400">Connected</span>
          </div>

          <div className="flex items-center space-x-1 text-gray-400">
            <Zap className="w-3 h-3" />
            <span className="text-xs">Gasless</span>
          </div>
        </div>
      </GlassCard>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <GlassCard className="p-4">
              {/* Network Switching */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-400 mb-3">
                  SWITCH NETWORK
                </div>
                <div className="space-y-2">
                  {Object.entries(SUPPORTED_CHAINS).map(([chainId, chain]) => (
                    <button
                      key={chainId}
                      onClick={() => handleNetworkSwitch(Number(chainId))}
                      disabled={
                        wallet.chainId === Number(chainId) || isNetworkSwitching
                      }
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        wallet.chainId === Number(chainId)
                          ? "bg-purple-900/30 border border-purple-700/50"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <span className="text-sm text-white">{chain.name}</span>
                      {wallet.chainId === Number(chainId) && (
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disconnect */}
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-red-900/20 transition-colors group"
              >
                <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                <span className="text-sm text-gray-400 group-hover:text-red-300">
                  Disconnect
                </span>
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
