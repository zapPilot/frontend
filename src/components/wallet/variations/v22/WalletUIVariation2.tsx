"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Copy,
  LogOut,
  Plus,
  Settings as SettingsIcon,
  Trash2,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ConnectWalletButton } from "@/components/WalletManager/components/ConnectWalletButton";
import { formatAddress } from "@/lib/formatters";
import { useWalletProvider } from "@/providers/WalletProvider";

interface WalletUIVariation2Props {
  onOpenWalletManager: () => void;
  onOpenSettings: () => void;
}

/**
 * Variation 2: Progressive Disclosure with Primary Action
 * Prominent primary action adapts to context + secondary actions in separate menus.
 */
export function WalletUIVariation2({
  onOpenWalletManager,
  onOpenSettings,
}: WalletUIVariation2Props) {
  const {
    connectedWallets,
    switchActiveWallet,
    hasMultipleWallets,
    account,
    isConnected,
    disconnect,
  } = useWalletProvider();

  const [showAddressMenu, setShowAddressMenu] = useState(false);
  const [showSwitcherMenu, setShowSwitcherMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isSwitchingWallet, setIsSwitchingWallet] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const addressMenuRef = useRef<HTMLDivElement>(null);
  const switcherMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addressMenuRef.current &&
        !addressMenuRef.current.contains(event.target as Node)
      ) {
        setShowAddressMenu(false);
      }
      if (
        switcherMenuRef.current &&
        !switcherMenuRef.current.contains(event.target as Node)
      ) {
        setShowSwitcherMenu(false);
      }
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node)
      ) {
        setShowSettingsMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAddressMenu(false);
        setShowSwitcherMenu(false);
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
      setShowSwitcherMenu(false);
    } finally {
      setIsSwitchingWallet(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setShowAddressMenu(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* NOT CONNECTED: Large Gradient Button */}
      {!isConnected && (
        <div className="h-11 px-6">
          <ConnectWalletButton className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 text-white font-semibold rounded-xl transition-all duration-200" />
        </div>
      )}

      {/* CONNECTED: Address Dropdown */}
      {isConnected && account?.address && (
        <div className="relative" ref={addressMenuRef}>
          <button
            data-testid="v2-address-button"
            onClick={() => setShowAddressMenu(!showAddressMenu)}
            className="h-10 px-4 bg-gray-800 hover:bg-gray-750 border border-purple-500/30 hover:border-purple-500/50 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-mono text-gray-200">
              {formatAddress(account.address)}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${showAddressMenu ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showAddressMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50"
              >
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase">
                      Address
                    </span>
                    <button
                      onClick={() => handleCopyAddress(account.address)}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
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
                  <div className="font-mono text-sm text-white break-all">
                    {account.address}
                  </div>
                  {account.balance && (
                    <div className="text-xs text-gray-500 mt-2">
                      Balance: {account.balance} ETH
                    </div>
                  )}
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowAddressMenu(false);
                      // TODO: Navigate to bundle
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                  >
                    View My Bundle
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* CONNECTED: Multi-Wallet Switcher (only if multiple wallets) */}
      {isConnected && hasMultipleWallets && (
        <div className="relative" ref={switcherMenuRef}>
          <button
            data-testid="v2-switcher-button"
            onClick={() => setShowSwitcherMenu(!showSwitcherMenu)}
            className="h-10 px-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 hover:border-purple-500/60 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
          >
            <Zap className="w-4 h-4 text-purple-300" />
            <span className="px-1.5 py-0.5 bg-purple-500 text-white rounded-full text-xs font-bold min-w-[20px] text-center">
              {connectedWallets.length}
            </span>
          </button>

          <AnimatePresence>
            {showSwitcherMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50"
              >
                <div className="p-4 border-b border-gray-800">
                  <div className="text-xs text-gray-400 uppercase mb-3">
                    Switch Wallet
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {connectedWallets.map(wallet => (
                      <div
                        key={wallet.address}
                        className={`p-3 rounded-lg border ${
                          wallet.isActive
                            ? "bg-purple-500/10 border-purple-500/30"
                            : "bg-gray-800/30 border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono text-sm text-white">
                              {formatAddress(wallet.address)}
                            </div>
                            {wallet.isActive && (
                              <div className="text-xs text-purple-400 font-bold mt-1 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Active
                              </div>
                            )}
                          </div>
                          {!wallet.isActive && (
                            <button
                              onClick={() => handleSwitchWallet(wallet.address)}
                              disabled={isSwitchingWallet}
                              className="text-xs font-medium text-purple-400 hover:text-purple-300 px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition-colors disabled:opacity-50"
                            >
                              {isSwitchingWallet ? "..." : "Switch"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <ConnectWalletButton className="flex-1 text-sm" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* CONNECTED: Settings Icon */}
      {isConnected && (
        <div className="relative" ref={settingsMenuRef}>
          <button
            data-testid="v2-settings-button"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500/50 flex items-center justify-center text-gray-400 hover:text-purple-400 transition-all duration-200"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showSettingsMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50"
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onOpenWalletManager();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-gray-800 transition-colors flex items-center gap-3"
                  >
                    <Wallet className="w-4 h-4 text-purple-400" />
                    Manage All Wallets
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-gray-800 transition-colors flex items-center gap-3"
                  >
                    <SettingsIcon className="w-4 h-4 text-purple-400" />
                    Google Calendar
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      // TODO: Email preferences
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-gray-800 transition-colors flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email Preferences
                  </button>
                </div>
                <div className="border-t border-gray-800 py-1">
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      // TODO: Delete account flow
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
