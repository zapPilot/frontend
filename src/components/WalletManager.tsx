"use client";

import { GRADIENTS } from "@/constants/design-system";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Plus,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { useToast } from "../hooks/useToast";
import {
  addWalletToBundle,
  getUserProfile,
  getUserWallets,
  handleWalletError,
  removeWalletFromBundle,
  transformWalletData,
  updateUserEmail,
  validateWalletAddress,
  WalletData,
} from "../services/userService";
import { GlassCard, GradientButton } from "./ui";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { RefreshButton } from "./ui/LoadingState";
import { UnifiedLoading } from "./ui/UnifiedLoading";

interface WalletManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Local operation states
interface OperationState {
  isLoading: boolean;
  error: string | null;
}

interface WalletOperations {
  adding: OperationState;
  removing: { [walletId: string]: OperationState };
  editing: { [walletId: string]: OperationState };
  subscribing: OperationState;
}

const WalletManagerComponent = ({ isOpen, onClose }: WalletManagerProps) => {
  const queryClient = useQueryClient();
  const { userInfo, loading, error, isConnected, connectedWallet, refetch } =
    useUser();
  const { showToast } = useToast();

  // Component state
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [operations, setOperations] = useState<WalletOperations>({
    adding: { isLoading: false, error: null },
    removing: {},
    editing: {},
    subscribing: { isLoading: false, error: null },
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const primaryWallet = connectedWallet;
  const userId = userInfo?.userId;

  // Local UI state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newWallet, setNewWallet] = useState({ address: "", label: "" });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);
  const [isEditingSubscription, setIsEditingSubscription] = useState(false);

  // Load wallets when component opens or user changes
  useEffect(() => {
    if (isOpen && userId && isConnected) {
      loadWallets();
    }
  }, [isOpen, userId, isConnected]);

  // Auto-refresh data periodically
  useEffect(() => {
    if (!isOpen || !isConnected || !userId) return;

    const interval = setInterval(() => {
      loadWallets(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, isConnected, userId]);

  // Load user profile to determine existing subscription email
  useEffect(() => {
    const loadProfile = async () => {
      if (!isOpen || !userId) return;
      try {
        const profile = await getUserProfile(userId);
        if (profile.success && profile.data?.user?.email) {
          setSubscribedEmail(profile.data.user.email);
          setEmail(profile.data.user.email);
        } else {
          setSubscribedEmail(null);
        }
      } catch {
        // Ignore profile fetch errors in this context
      }
    };
    loadProfile();
  }, [isOpen, userId]);

  // Load wallets from API
  const loadWallets = useCallback(
    async (silent = false) => {
      if (!userId) return;

      if (!silent) {
        setIsRefreshing(true);
      }

      try {
        const response = await getUserWallets(userId);
        if (response.success && response.data) {
          const transformedWallets = transformWalletData(response.data);
          setWallets(transformedWallets);
        } else {
          setWallets([]);
        }
      } catch {
        // Handle silently - error state is managed by response.success
      } finally {
        if (!silent) {
          setIsRefreshing(false);
        }
      }
    },
    [userId]
  );

  // Utility function to format wallet address
  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Handle wallet deletion
  const handleDeleteWallet = useCallback(
    async (walletId: string) => {
      if (!userId) return;

      // Set loading state for this specific wallet
      setOperations(prev => ({
        ...prev,
        removing: {
          ...prev.removing,
          [walletId]: { isLoading: true, error: null },
        },
      }));

      try {
        const response = await removeWalletFromBundle(userId, walletId);
        if (response.success) {
          // Remove wallet from local state immediately (optimistic update)
          setWallets(prev => prev.filter(wallet => wallet.id !== walletId));

          // Invalidate and refetch user data
          queryClient.invalidateQueries({ queryKey: ["user-wallets", userId] });
          refetch();
        } else {
          setOperations(prev => ({
            ...prev,
            removing: {
              ...prev.removing,
              [walletId]: {
                isLoading: false,
                error: response.error || "Failed to remove wallet",
              },
            },
          }));
        }
      } catch (error) {
        const errorMessage = handleWalletError(error);
        setOperations(prev => ({
          ...prev,
          removing: {
            ...prev.removing,
            [walletId]: { isLoading: false, error: errorMessage },
          },
        }));
      }
    },
    [userId, queryClient, refetch]
  );

  // Handle editing label
  const handleEditLabel = useCallback(
    async (walletId: string, newLabel: string) => {
      if (!userId || !newLabel.trim()) {
        setEditingId(null);
        setEditLabel("");
        return;
      }

      // Set loading state for this specific wallet edit
      setOperations(prev => ({
        ...prev,
        editing: {
          ...prev.editing,
          [walletId]: { isLoading: true, error: null },
        },
      }));

      try {
        // Update local state immediately (optimistic update)
        setWallets(prev =>
          prev.map(wallet =>
            wallet.id === walletId ? { ...wallet, label: newLabel } : wallet
          )
        );

        setEditingId(null);
        setEditLabel("");

        // Note: The account-engine API doesn't have a direct label update endpoint
        // This would need to be implemented on the backend or handled differently
        // For now, we'll show the optimistic update

        setOperations(prev => ({
          ...prev,
          editing: {
            ...prev.editing,
            [walletId]: { isLoading: false, error: null },
          },
        }));
      } catch (error) {
        const errorMessage = handleWalletError(error);
        setOperations(prev => ({
          ...prev,
          editing: {
            ...prev.editing,
            [walletId]: { isLoading: false, error: errorMessage },
          },
        }));
      }
    },
    [userId]
  );

  // Handle adding new wallet
  const handleAddWallet = useCallback(async () => {
    if (!userId || !newWallet.address || !newWallet.label) {
      setValidationError("Please fill in all fields");
      return;
    }

    // Validate wallet address format
    if (!validateWalletAddress(newWallet.address)) {
      setValidationError(
        "Invalid wallet address format. Must be a 42-character Ethereum address starting with 0x"
      );
      return;
    }

    setValidationError(null);
    setOperations(prev => ({
      ...prev,
      adding: { isLoading: true, error: null },
    }));

    try {
      const response = await addWalletToBundle(
        userId,
        newWallet.address,
        newWallet.label
      );

      if (response.success) {
        // Reset form and close adding mode
        setIsAdding(false);
        setNewWallet({ address: "", label: "" });

        // Refresh wallets list
        await loadWallets();

        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: ["user-wallets", userId] });
        refetch();

        setOperations(prev => ({
          ...prev,
          adding: { isLoading: false, error: null },
        }));
      } else {
        setOperations(prev => ({
          ...prev,
          adding: {
            isLoading: false,
            error: response.error || "Failed to add wallet",
          },
        }));
      }
    } catch (error) {
      const errorMessage = handleWalletError(error);
      setOperations(prev => ({
        ...prev,
        adding: { isLoading: false, error: errorMessage },
      }));
    }
  }, [userId, newWallet, loadWallets, queryClient, refetch]);

  const handleSubscribe = useCallback(async () => {
    if (!userId || !email) {
      setOperations(prev => ({
        ...prev,
        subscribing: {
          isLoading: false,
          error: "Please enter a valid email address.",
        },
      }));
      return;
    }

    setOperations(prev => ({
      ...prev,
      subscribing: { isLoading: true, error: null },
    }));

    try {
      await updateUserEmail(userId, email);
      setOperations(prev => ({
        ...prev,
        subscribing: { isLoading: false, error: null },
      }));
      setSubscribedEmail(email);
      setIsEditingSubscription(false);
      showToast({
        type: "success",
        title: "Subscription updated",
        message: `You'll receive weekly PnL reports at ${email}.`,
      });
    } catch (error) {
      const errorMessage = handleWalletError(error);
      setOperations(prev => ({
        ...prev,
        subscribing: { isLoading: false, error: errorMessage },
      }));
    }
  }, [userId, email, showToast]);

  // Handle copy to clipboard
  const handleCopyAddress = useCallback(
    async (address: string, walletId: string) => {
      try {
        await navigator.clipboard.writeText(address);
        setCopiedId(walletId);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        // Handle silently - copy operation failed
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
                <RefreshButton
                  isLoading={loading || isRefreshing}
                  onClick={() => loadWallets()}
                  size="md"
                  title="Refresh Bundle"
                />
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {(loading || isRefreshing) && (
              <div className="text-center py-8">
                <div className="flex justify-center mb-3">
                  <UnifiedLoading
                    variant="skeleton-inline"
                    width="8rem"
                    aria-label="Loading wallet data"
                  />
                </div>
                <p className="text-gray-400 text-sm">
                  {isRefreshing
                    ? "Refreshing wallets..."
                    : "Loading bundle wallets..."}
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-6 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-3" />
                <p className="text-red-400 text-sm mb-3">{error}</p>
                <button
                  onClick={refetch}
                  className="px-3 py-1 text-xs bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Wallet List */}
            {!loading && !isRefreshing && !error && (
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
                        {!wallet.isMain && (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(wallet.id);
                                setEditLabel(wallet.label);
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Edit Label"
                              disabled={
                                operations.editing[wallet.id]?.isLoading
                              }
                            >
                              {operations.editing[wallet.id]?.isLoading ? (
                                <LoadingSpinner size="sm" color="gray" />
                              ) : (
                                <Edit3 className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteWallet(wallet.id)}
                              className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
                              title="Remove from Bundle"
                              disabled={
                                operations.removing[wallet.id]?.isLoading
                              }
                            >
                              {operations.removing[wallet.id]?.isLoading ? (
                                <LoadingSpinner size="sm" color="red" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-red-400" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Show operation errors */}
                    {operations.removing[wallet.id]?.error && (
                      <div className="mt-2 p-2 bg-red-600/10 border border-red-600/20 rounded-lg">
                        <p className="text-xs text-red-300">
                          {operations.removing[wallet.id]?.error}
                        </p>
                      </div>
                    )}
                    {operations.editing[wallet.id]?.error && (
                      <div className="mt-2 p-2 bg-red-600/10 border border-red-600/20 rounded-lg">
                        <p className="text-xs text-red-300">
                          {operations.editing[wallet.id]?.error}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Add New Wallet - Only show if not loading */}
            {!loading && !isRefreshing && !error && (
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

                      {/* Show validation error */}
                      {validationError && (
                        <div className="p-2 bg-red-600/10 border border-red-600/20 rounded-lg mb-3">
                          <p className="text-xs text-red-300">
                            {validationError}
                          </p>
                        </div>
                      )}

                      {/* Show add operation error */}
                      {operations.adding.error && (
                        <div className="p-2 bg-red-600/10 border border-red-600/20 rounded-lg mb-3">
                          <p className="text-xs text-red-300">
                            {operations.adding.error}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <GradientButton
                          onClick={handleAddWallet}
                          gradient="from-green-600 to-emerald-600"
                          className="flex-1"
                          disabled={operations.adding.isLoading}
                        >
                          {operations.adding.isLoading ? (
                            <div className="flex items-center space-x-2">
                              <LoadingSpinner size="sm" color="white" />
                              <span>Adding...</span>
                            </div>
                          ) : (
                            "Add to Bundle"
                          )}
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

            {/* PnL Subscription */}
            {!loading && !isRefreshing && !error && isConnected && userId && (
              <div className="p-4 glass-morphism rounded-xl mb-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Weekly PnL Reports
                </h3>
                {subscribedEmail && !isEditingSubscription ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-300">
                      ✅ You&apos;re subscribed to weekly PnL reports
                      <span className="text-gray-400"> at </span>
                      <span className="text-white font-medium">
                        {subscribedEmail}
                      </span>
                      .
                    </p>
                    <button
                      onClick={() => {
                        setIsEditingSubscription(true);
                        setEmail(subscribedEmail);
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg glass-morphism hover:bg-white/10 transition-colors"
                    >
                      ✏️ Update email
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-gray-800/50 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
                      />
                      <GradientButton
                        onClick={handleSubscribe}
                        gradient="from-blue-600 to-cyan-600"
                        disabled={operations.subscribing.isLoading}
                      >
                        {operations.subscribing.isLoading ? (
                          <LoadingSpinner size="sm" color="white" />
                        ) : subscribedEmail ? (
                          "Save"
                        ) : (
                          "Subscribe"
                        )}
                      </GradientButton>
                      {subscribedEmail && (
                        <button
                          onClick={() => {
                            setIsEditingSubscription(false);
                            setEmail(subscribedEmail);
                            setOperations(prev => ({
                              ...prev,
                              subscribing: { isLoading: false, error: null },
                            }));
                          }}
                          className="px-3 py-2 text-xs glass-morphism rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {operations.subscribing.error && (
                      <div className="mt-2 p-2 bg-red-600/10 border border-red-600/20 rounded-lg">
                        <p className="text-xs text-red-300">
                          {operations.subscribing.error}
                        </p>
                      </div>
                    )}
                  </>
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
