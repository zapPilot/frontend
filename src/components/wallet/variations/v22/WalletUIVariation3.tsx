"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Link as LinkIcon,
  LogOut,
  Mail,
  MoreVertical,
  Plus,
  Trash2,
  Wallet as WalletIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ConnectWalletButton } from "@/components/WalletManager/components/ConnectWalletButton";
import { formatAddress } from "@/lib/formatters";
import { useWalletProvider } from "@/providers/WalletProvider";

interface WalletUIVariation3Props {
  onOpenWalletManager: () => void;
  onOpenSettings: () => void;
}

/**
 * Variation 3: Split Actions with Clear Labeling
 * Explicit labeled buttons with semantic separation of status display vs action menu.
 */
export function WalletUIVariation3({
  onOpenWalletManager,
  onOpenSettings,
}: WalletUIVariation3Props) {
  const {
    connectedWallets,
    switchActiveWallet,
    hasMultipleWallets,
    account,
    isConnected,
    disconnect,
  } = useWalletProvider();

  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [showManageMenu, setShowManageMenu] = useState(false);
  const [isSwitchingWallet, setIsSwitchingWallet] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const selectorRef = useRef<HTMLDivElement>(null);
  const manageMenuRef = useRef<HTMLDivElement>(null);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setShowWalletSelector(false);
      }
      if (
        manageMenuRef.current &&
        !manageMenuRef.current.contains(event.target as Node)
      ) {
        setShowManageMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowWalletSelector(false);
        setShowManageMenu(false);
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
      setShowWalletSelector(false);
    } finally {
      setIsSwitchingWallet(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setShowManageMenu(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* NOT CONNECTED: Large Connect Button */}
      {!isConnected && (
        <div className="h-11 px-6 flex items-center gap-2 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 hover:scale-102 shadow-lg text-white font-semibold rounded-xl transition-all duration-200">
          <LinkIcon className="w-4 h-4 text-gray-300" />
          <ConnectWalletButton className="flex-1" />
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}

      {/* CONNECTED: Status Display (Single Wallet) */}
      {isConnected && account?.address && !hasMultipleWallets && (
        <div
          className="h-10 px-4 bg-gray-800/80 backdrop-blur-sm border-l-2 border-purple-500 rounded-lg flex items-center gap-2"
          title={account.address}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <div className="flex items-col">
            <span className="text-xs text-gray-400 mr-1">Wallet:</span>
            <span className="font-mono text-sm text-white">
              {formatAddress(account.address)}
            </span>
          </div>
        </div>
      )}

      {/* CONNECTED: Active Wallet Selector (Multiple Wallets) */}
      {isConnected && hasMultipleWallets && (
        <div className="relative" ref={selectorRef}>
          <button
            data-testid="v3-wallet-selector"
            onClick={() => setShowWalletSelector(!showWalletSelector)}
            className="h-10 px-4 bg-purple-900/30 hover:bg-purple-900/40 border border-purple-500/50 hover:border-purple-500/70 rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="text-xs text-purple-400 font-bold uppercase tracking-wide">
              Active:
            </span>
            <span className="font-mono text-sm text-white">
              {account?.address && formatAddress(account.address)}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${showWalletSelector ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showWalletSelector && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-96 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50"
              >
                <div className="p-4 border-b border-gray-800">
                  <div className="text-sm font-bold text-white uppercase tracking-wide mb-3">
                    Select Active Wallet
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {connectedWallets.map(wallet => (
                      <div
                        key={wallet.address}
                        className={`p-4 rounded-lg border transition-all ${
                          wallet.isActive
                            ? "bg-purple-500/10 border-purple-500/30 shadow-sm"
                            : "bg-gray-800/30 border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {wallet.isActive && (
                                <Check className="w-4 h-4 text-purple-400" />
                              )}
                              <span className="text-xs text-gray-400 uppercase">
                                {wallet.isActive ? "Current Wallet" : "Wallet"}
                              </span>
                            </div>
                            <div className="font-mono text-sm text-white break-all">
                              {wallet.address}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {wallet.isActive ? (
                            <div className="text-xs text-purple-400 font-bold">
                              ✓ Active Wallet
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSwitchWallet(wallet.address)}
                              disabled={isSwitchingWallet}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                            >
                              {isSwitchingWallet
                                ? "Switching..."
                                : "Switch to this wallet"}
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyAddress(wallet.address)}
                            className="ml-auto px-2 py-1 text-xs text-gray-400 hover:text-purple-300 transition-colors"
                          >
                            {copiedAddress === wallet.address ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg px-4 py-2">
                    <Plus className="w-4 h-4" />
                    <ConnectWalletButton className="flex-1" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* CONNECTED: Manage Menu */}
      {isConnected && (
        <div className="relative" ref={manageMenuRef}>
          <button
            data-testid="v3-manage-button"
            onClick={() => setShowManageMenu(!showManageMenu)}
            className="h-10 px-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
          >
            <span>Manage</span>
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          <AnimatePresence>
            {showManageMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-72 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50"
              >
                {/* Account Management Section */}
                <div className="p-4 border-b border-gray-800">
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-3">
                    Account Management
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowManageMenu(false);
                        onOpenWalletManager();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <WalletIcon className="w-4 h-4 text-purple-400" />
                      All Wallets
                      <svg
                        className="w-3 h-3 ml-auto text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setShowManageMenu(false);
                        // TODO: Email settings
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <Mail className="w-4 h-4 text-purple-400" />
                      Email Settings
                      <svg
                        className="w-3 h-3 ml-auto text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setShowManageMenu(false);
                        onOpenSettings();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <Calendar className="w-4 h-4 text-purple-400" />
                      Google Calendar
                      <svg
                        className="w-3 h-3 ml-auto text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="p-4 border-b border-gray-800">
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-3">
                    Actions
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        if (account?.address) {
                          void handleCopyAddress(account.address);
                        }
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                    >
                      {copiedAddress && account?.address && copiedAddress === account.address ? (
                        <>
                          <Check className="w-4 h-4 text-green-400" />
                          <span>Address Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-purple-400" />
                          <span>Copy Address</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowManageMenu(false);
                        // TODO: Navigate to bundle
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <LinkIcon className="w-4 h-4 text-purple-400" />
                      View Bundle
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4 text-purple-400" />
                      Disconnect
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-4">
                  <button
                    onClick={() => {
                      setShowManageMenu(false);
                      // TODO: Delete account confirmation
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3"
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
