"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
// useActiveAccount not needed here - using UserContext instead
import { GRADIENTS } from "@/constants/design-system";
import { useUser } from "../contexts/UserContext";
import { GlassCard, GradientButton } from "./ui";

// Remove DEMO_WALLET constant - now using real connected wallet

interface WalletManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletManagerComponent = ({ isOpen, onClose }: WalletManagerProps) => {
  // Get user info from context (includes wallet connection and user data)
  const {
    userInfo,
    loading,
    error,
    isConnected,
    connectedWallet,
    fetchUserInfo,
  } = useUser();

  // Transform userInfo into format expected by the component
  const wallets = userInfo
    ? [
        // Primary wallet (always first)
        {
          id: userInfo.primaryWallet,
          address: userInfo.primaryWallet,
          label: "Primary Wallet",
          isMain: true,
          isActive: true,
          isVisible: true,
        },
        // Additional wallets
        ...userInfo.additionalWallets.map((wallet, index) => ({
          id: wallet.wallet_address,
          address: wallet.wallet_address,
          label: wallet.label || `Wallet ${index + 2}`,
          isMain: wallet.is_main,
          isActive: false, // Only primary is active for now
          isVisible: wallet.is_visible,
        })),
      ]
    : [];

  const totalWallets = userInfo?.totalWallets || 0;
  const visibleWallets = userInfo?.totalVisibleWallets || 0;
  const primaryWallet = connectedWallet;

  // Local UI state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newWallet, setNewWallet] = useState({ address: "", label: "" });

  // Auto-refresh data periodically
  useEffect(() => {
    if (!isOpen || !isConnected) return;

    const interval = setInterval(() => {
      fetchUserInfo();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isOpen, isConnected, fetchUserInfo]);

  // Utility function to format wallet address
  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Handle wallet deletion
  const handleDeleteWallet = useCallback((walletId: string) => {
    // TODO: Implement actual wallet deletion via API
    console.log("Deleting wallet:", walletId);
  }, []);

  // Handle setting active wallet
  const handleSetActive = useCallback(
    (walletId: string) => {
      // TODO: Implement setting active wallet via API
      console.log("Setting active wallet:", walletId);
      // For now, just refresh user info to get updated state
      fetchUserInfo();
    },
    [fetchUserInfo]
  );

  // Handle editing label
  const handleEditLabel = useCallback((walletId: string, newLabel: string) => {
    // TODO: Implement actual wallet label editing via API
    console.log("Editing wallet label:", walletId, newLabel);
    setEditingId(null);
    setEditLabel("");
  }, []);

  // Handle adding new wallet
  const handleAddWallet = useCallback(() => {
    if (!newWallet.address || !newWallet.label) return;

    // TODO: Implement actual wallet addition via API
    console.log("Adding wallet:", newWallet);
    setIsAdding(false);
    setNewWallet({ address: "", label: "" });
  }, [newWallet]);

  // Handle copy to clipboard
  const handleCopyAddress = useCallback(
    async (address: string, walletId: string) => {
      try {
        await navigator.clipboard.writeText(address);
        setCopiedId(walletId);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        console.error("Failed to copy address:", err);
      }
    },
    []
  );

  // Early return if modal is closed
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-lg flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <GlassCard className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-r ${GRADIENTS.PRIMARY} flex items-center justify-center`}
                >
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Bundle Wallets
                  </h2>
                  <p className="text-sm text-gray-400">
                    {!isConnected
                      ? "No wallet connected"
                      : `${primaryWallet?.slice(0, 6)}...${primaryWallet?.slice(-4)} bundle`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchUserInfo}
                  disabled={loading}
                  className="p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
                  title="Refresh Bundle"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-gray-300 ${loading ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-400 text-sm">
                  Loading bundle wallets...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-6 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-3" />
                <p className="text-red-400 text-sm mb-3">{error}</p>
                <button
                  onClick={fetchUserInfo}
                  className="px-3 py-1 text-xs bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Wallet List */}
            {!loading && !error && (
              <div className="space-y-3 mb-6">
                {wallets.map(wallet => (
                  <motion.div
                    key={wallet.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      wallet.isActive
                        ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30"
                        : "glass-morphism border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    {/* {JSON.stringify(wallet)} */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {editingId === wallet.id ? (
                            <input
                              type="text"
                              value={editLabel}
                              onChange={e => setEditLabel(e.target.value)}
                              onBlur={() =>
                                handleEditLabel(wallet.id, editLabel)
                              }
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  handleEditLabel(wallet.id, editLabel);
                                }
                                if (e.key === "Escape") {
                                  setEditingId(null);
                                  setEditLabel("");
                                }
                              }}
                              className="bg-gray-800/50 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-purple-500 outline-none"
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`font-medium ${
                                wallet.isActive ? "text-white" : "text-gray-300"
                              }`}
                            >
                              {wallet.label}
                            </span>
                          )}
                          {wallet.isActive && (
                            <span className="px-2 py-1 text-xs bg-purple-600/30 text-purple-300 rounded-full">
                              Active
                            </span>
                          )}
                          {wallet.isMain && (
                            <span className="px-2 py-1 text-xs bg-blue-600/30 text-blue-300 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span className="font-mono">
                            {formatAddress(wallet?.address || "")}
                          </span>
                          <button
                            onClick={() =>
                              handleCopyAddress(wallet.address, wallet.id)
                            }
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            {copiedId === wallet.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <a
                            href={`https://debank.com/profile/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!wallet.isActive && (
                          <button
                            onClick={() => handleSetActive(wallet.id)}
                            className="px-3 py-1 text-xs bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors"
                          >
                            Set Active
                          </button>
                        )}
                        {!wallet.isMain && (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(wallet.id);
                                setEditLabel(wallet.label);
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Edit Label"
                            >
                              <Edit3 className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteWallet(wallet.id)}
                              className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
                              title="Remove from Bundle"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Add New Wallet - Only show if not loading */}
            {!loading && !error && (
              <>
                {isAdding ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 glass-morphism rounded-xl mb-4"
                  >
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Wallet Label (e.g., Trading Wallet)"
                        value={newWallet.label}
                        onChange={e =>
                          setNewWallet(prev => ({
                            ...prev,
                            label: e.target.value,
                          }))
                        }
                        className="w-full bg-gray-800/50 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Wallet Address (0x...)"
                        value={newWallet.address}
                        onChange={e =>
                          setNewWallet(prev => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        className="w-full bg-gray-800/50 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none font-mono text-sm"
                      />
                      <div className="flex space-x-2">
                        <GradientButton
                          onClick={handleAddWallet}
                          gradient="from-green-600 to-emerald-600"
                          className="flex-1"
                        >
                          Add to Bundle
                        </GradientButton>
                        <button
                          onClick={() => {
                            setIsAdding(false);
                            setNewWallet({ address: "", label: "" });
                          }}
                          className="px-4 py-2 glass-morphism rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <GradientButton
                    onClick={() => setIsAdding(true)}
                    gradient={GRADIENTS.PRIMARY}
                    icon={Plus}
                    className="w-full mb-4"
                  >
                    Add New Wallet
                  </GradientButton>
                )}
              </>
            )}

            {/* Enhanced Summary */}
            {!loading && !error && (
              <div className="p-4 glass-morphism rounded-xl">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Bundle Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Total Wallets:</span>
                    <span className="text-white ml-2 font-medium">
                      {totalWallets}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Visible:</span>
                    <span className="text-green-400 ml-2 font-medium">
                      {visibleWallets}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Active Wallet:</span>
                    <span className="text-purple-300 ml-2 font-medium">
                      {wallets.find(w => w.isActive)?.label || "None"}
                    </span>
                  </div>
                </div>
                {!isConnected && (
                  <div className="mt-3 p-2 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
                    <p className="text-xs text-yellow-300">
                      💡 Connect a wallet to view your bundle wallets and user
                      data from the quant-engine.
                    </p>
                  </div>
                )}
                {isConnected && userInfo && (
                  <div className="mt-3 p-2 bg-green-600/10 border border-green-600/20 rounded-lg">
                    <p className="text-xs text-green-300">
                      ✅ Connected to {userInfo.email} - Real data from
                      quant-engine
                    </p>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const WalletManager = memo(WalletManagerComponent);
