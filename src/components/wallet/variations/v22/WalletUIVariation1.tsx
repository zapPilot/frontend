"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, LogOut, Plus, Settings, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ConnectWalletButton } from "@/components/WalletManager/components/ConnectWalletButton";
import { formatAddress } from "@/lib/formatters";
import { useWalletProvider } from "@/providers/WalletProvider";

interface WalletUIVariation1Props {
  onOpenWalletManager: () => void;
  onOpenSettings: () => void;
}

/**
 * Variation 1: Unified Wallet Menu
 * Single entry point for ALL wallet operations that adapts to user state.
 */
export function WalletUIVariation1({
  onOpenWalletManager,
  onOpenSettings,
}: WalletUIVariation1Props) {
  const {
    connectedWallets,
    switchActiveWallet,
    hasMultipleWallets,
    account,
    isConnected,
    disconnect,
  } = useWalletProvider();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwitchingWallet, setIsSwitchingWallet] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleSwitchWallet = async (address: string) => {
    setIsSwitchingWallet(true);
    try {
      await switchActiveWallet(address);
    } finally {
      setIsSwitchingWallet(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsMenuOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Unified Menu Button */}
      <button
        data-testid="unified-wallet-menu-button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="h-10 px-4 bg-gray-800/50 hover:bg-gray-800 border border-purple-500/20 hover:border-purple-500/40 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium text-gray-200 hover:text-white"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
      >
        <Wallet className="w-4 h-4 text-purple-400" />
        {!isConnected && <span>Connect Wallet</span>}
        {isConnected && account?.address && (
          <>
            <span className="font-mono">{formatAddress(account.address)}</span>
            {hasMultipleWallets && (
              <span className="ml-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-bold">
                {connectedWallets.length}
              </span>
            )}
          </>
        )}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            data-testid="unified-wallet-menu-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/10 backdrop-blur-xl z-50 overflow-hidden"
            role="menu"
            aria-label="Wallet menu"
          >
            {/* Not Connected State */}
            {!isConnected && (
              <div className="p-4">
                <div className="text-sm text-gray-400 mb-3">
                  Connect your wallet to get started
                </div>
                <ConnectWalletButton className="w-full" />
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      // TODO: Link to help/FAQ
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Why connect a wallet?
                  </button>
                </div>
              </div>
            )}

            {/* Connected State - Single Wallet */}
            {isConnected && account?.address && !hasMultipleWallets && (
              <div className="py-2">
                {/* Address & Copy */}
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">
                      Connected Wallet
                    </span>
                    <button
                      onClick={() => handleCopyAddress(account.address)}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedAddress === account.address ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-sm text-white">
                    {account.address}
                  </div>
                  {account.balance && (
                    <div className="text-xs text-gray-500 mt-1">
                      Balance: {account.balance} ETH
                    </div>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      // TODO: Navigate to bundle view
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-purple-500/10 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <Wallet className="w-4 h-4 text-purple-400" />
                    View My Bundle
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenWalletManager();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-purple-500/10 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4 text-purple-400" />
                    Manage Wallets
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-purple-500/10 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4 text-purple-400" />
                    Settings
                  </button>
                </div>

                {/* Disconnect */}
                <div className="border-t border-gray-800 py-1">
                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            {/* Connected State - Multiple Wallets */}
            {isConnected && hasMultipleWallets && (
              <div className="py-2">
                {/* Wallet List */}
                <div className="px-4 py-2 border-b border-gray-800">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                    Connected Wallets
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {connectedWallets.map(wallet => (
                      <div
                        key={wallet.address}
                        className={`p-3 rounded-lg border transition-all ${
                          wallet.isActive
                            ? "bg-purple-500/10 border-purple-500/30"
                            : "bg-gray-800/30 border-gray-700/50 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${wallet.isActive ? "bg-purple-400 animate-pulse" : "bg-gray-600"}`}
                            />
                            <span className="font-mono text-sm text-white">
                              {formatAddress(wallet.address)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyAddress(wallet.address)}
                            className="text-xs text-gray-400 hover:text-purple-300 transition-colors"
                          >
                            {copiedAddress === wallet.address ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {wallet.isActive ? (
                          <div className="text-xs text-purple-400 font-bold flex items-center gap-1">
                            Active Wallet
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSwitchWallet(wallet.address)}
                            disabled={isSwitchingWallet}
                            className="text-xs text-purple-400 hover:text-purple-300 font-medium disabled:opacity-50 disabled:cursor-wait transition-colors"
                          >
                            {isSwitchingWallet ? "Switching..." : "Switch to this wallet"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Wallet */}
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <ConnectWalletButton className="flex-1 text-sm" />
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenWalletManager();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-purple-500/10 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4 text-purple-400" />
                    Manage Wallets
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-purple-500/10 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4 text-purple-400" />
                    Settings
                  </button>
                </div>

                {/* Disconnect All */}
                <div className="border-t border-gray-800 py-1">
                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect All
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
