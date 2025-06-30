"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Wallet,
  Copy,
  ExternalLink,
  Edit3,
  Trash2,
  Check,
} from "lucide-react";
import { useState, useCallback, memo } from "react";
import { GlassCard, GradientButton } from "./ui";

interface WalletAddress {
  id: string;
  address: string;
  label: string;
  isActive: boolean;
}

interface WalletManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletManagerComponent = ({ isOpen, onClose }: WalletManagerProps) => {
  const [wallets, setWallets] = useState<WalletAddress[]>([
    {
      id: "1",
      address: "0x742d35Cc8C6C26fCd1d6Fa33b3b4A9df6B7A8e9F",
      label: "Main Wallet",
      isActive: true,
    },
    {
      id: "2",
      address: "0x8Ba1f109551bD432803012645Hac136c22C8e9F",
      label: "Trading Wallet",
      isActive: false,
    },
  ]);

  const [newWallet, setNewWallet] = useState({ address: "", label: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAddWallet = useCallback(() => {
    if (newWallet.address && newWallet.label) {
      const wallet: WalletAddress = {
        id: Date.now().toString(),
        address: newWallet.address,
        label: newWallet.label,
        isActive: false,
      };
      setWallets(prev => [...prev, wallet]);
      setNewWallet({ address: "", label: "" });
      setIsAdding(false);
    }
  }, [newWallet]);

  const handleDeleteWallet = useCallback((id: string) => {
    setWallets(prev => prev.filter(w => w.id !== id));
  }, []);

  const handleSetActive = useCallback((id: string) => {
    setWallets(prev => prev.map(w => ({ ...w, isActive: w.id === id })));
  }, []);

  const handleEditLabel = useCallback((id: string, newLabel: string) => {
    setWallets(prev =>
      prev.map(w => (w.id === id ? { ...w, label: newLabel } : w))
    );
    setEditingId(null);
    setEditLabel("");
  }, []);

  const handleCopyAddress = useCallback(async (address: string, id: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(address);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // Failed to copy address - silently ignore
    }
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Wallet Manager
                  </h2>
                  <p className="text-sm text-gray-400">
                    Track multiple wallets in one place
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-200"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* Wallet List */}
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
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {editingId === wallet.id ? (
                          <input
                            type="text"
                            value={editLabel}
                            onChange={e => setEditLabel(e.target.value)}
                            onBlur={() => handleEditLabel(wallet.id, editLabel)}
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
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span className="font-mono">
                          {formatAddress(wallet.address)}
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
                        <button className="p-1 hover:bg-white/10 rounded transition-colors">
                          <ExternalLink className="w-3 h-3" />
                        </button>
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
                      <button
                        onClick={() => {
                          setEditingId(wallet.id);
                          setEditLabel(wallet.label);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteWallet(wallet.id)}
                        className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add New Wallet */}
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
                      setNewWallet(prev => ({ ...prev, label: e.target.value }))
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
                      Add Wallet
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
                gradient="from-purple-600 to-blue-600"
                icon={Plus}
                className="w-full"
              >
                Add New Wallet
              </GradientButton>
            )}

            {/* Summary */}
            <div className="mt-6 p-4 glass-morphism rounded-xl">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Portfolio Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Wallets:</span>
                  <span className="text-white ml-2 font-medium">
                    {wallets.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Active Wallet:</span>
                  <span className="text-purple-300 ml-2 font-medium">
                    {wallets.find(w => w.isActive)?.label || "None"}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const WalletManager = memo(WalletManagerComponent);
