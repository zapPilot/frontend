"use client";

import { GRADIENTS, Z_INDEX } from "@/constants/design-system";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Copy,
  Edit3,
  ExternalLink,
  MoreVertical,
  Plus,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useState, type JSX } from "react";
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
  updateWalletLabel,
  validateWalletAddress,
  WalletData,
} from "../services/userService";
import { GlassCard, GradientButton } from "./ui";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { UnifiedLoading } from "./ui/UnifiedLoading";
import { Portal } from "./ui/Portal";

export interface WalletManagerProps {
  isOpen: boolean;
  onClose: () => void;
  urlUserId?: string;
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

const WalletManagerComponent = ({
  isOpen,
  onClose,
  urlUserId,
}: WalletManagerProps) => {
  const queryClient = useQueryClient();
  const { userInfo, loading, error, isConnected, refetch } = useUser();
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

  // User identification logic
  const realUserId = userInfo?.userId; // Authenticated user (for operations)
  const viewingUserId = urlUserId || realUserId; // Which user's bundle to view
  const isOwner = realUserId && realUserId === viewingUserId; // Can user edit?

  // Local UI state
  const [isAdding, setIsAdding] = useState(false);
  const [editingWallet, setEditingWallet] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [, setCopiedId] = useState<string | null>(null);
  const [newWallet, setNewWallet] = useState({ address: "", label: "" });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);
  const [isEditingSubscription, setIsEditingSubscription] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Load user profile to determine existing subscription email
  useEffect(() => {
    const loadProfile = async () => {
      if (!isOpen || !viewingUserId) return;
      try {
        const profile = await getUserProfile(viewingUserId);
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
  }, [isOpen, viewingUserId]);

  // Load wallets from API
  const loadWallets = useCallback(
    async (silent = false) => {
      if (!viewingUserId) return;

      if (!silent) {
        setIsRefreshing(true);
      }

      try {
        const response = await getUserWallets(viewingUserId);
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
    [viewingUserId]
  );

  // Load wallets when component opens or user changes
  useEffect(() => {
    if (isOpen && viewingUserId) {
      loadWallets();
    }
  }, [isOpen, viewingUserId, loadWallets]);

  // Auto-refresh data periodically (only for connected users viewing their own data)
  useEffect(() => {
    if (!isOpen || !isConnected || !viewingUserId || !isOwner) return;

    const interval = setInterval(() => {
      loadWallets(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, isConnected, viewingUserId, isOwner, loadWallets]);

  // Utility function to format wallet address
  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Handle wallet deletion
  const handleDeleteWallet = useCallback(
    async (walletId: string) => {
      if (!realUserId) return;

      // Set loading state for this specific wallet
      setOperations(prev => ({
        ...prev,
        removing: {
          ...prev.removing,
          [walletId]: { isLoading: true, error: null },
        },
      }));

      try {
        const response = await removeWalletFromBundle(realUserId, walletId);
        if (response.success) {
          // Remove wallet from local state immediately (optimistic update)
          setWallets(prev => prev.filter(wallet => wallet.id !== walletId));

          // Invalidate and refetch user data
          queryClient.invalidateQueries({
            queryKey: ["user-wallets", realUserId],
          });
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
    [realUserId, queryClient, refetch]
  );

  // Handle editing label
  const handleEditLabel = useCallback(
    async (walletId: string, newLabel: string) => {
      if (!realUserId || !newLabel.trim()) {
        setEditingWallet(null);
        return;
      }

      // Find the wallet to get its address
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) {
        setEditingWallet(null);
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
          prev.map(w => (w.id === walletId ? { ...w, label: newLabel } : w))
        );

        setEditingWallet(null);
        setOpenDropdown(null);

        // Call the API to update wallet label
        const response = await updateWalletLabel(
          realUserId,
          wallet.address,
          newLabel
        );

        if (!response.success) {
          // Revert optimistic update on API failure
          setWallets(prev =>
            prev.map(w =>
              w.id === walletId ? { ...w, label: wallet.label } : w
            )
          );

          setOperations(prev => ({
            ...prev,
            editing: {
              ...prev.editing,
              [walletId]: {
                isLoading: false,
                error: response.error || "Failed to update wallet label",
              },
            },
          }));
          return;
        }

        setOperations(prev => ({
          ...prev,
          editing: {
            ...prev.editing,
            [walletId]: { isLoading: false, error: null },
          },
        }));
      } catch (error) {
        // Revert optimistic update on error
        setWallets(prev =>
          prev.map(w => (w.id === walletId ? { ...w, label: wallet.label } : w))
        );

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
    [realUserId, wallets]
  );

  // Handle adding new wallet
  const handleAddWallet = useCallback(async () => {
    if (!realUserId || !newWallet.address || !newWallet.label) {
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
        realUserId,
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
        queryClient.invalidateQueries({
          queryKey: ["user-wallets", realUserId],
        });
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
  }, [realUserId, newWallet, loadWallets, queryClient, refetch]);

  const handleSubscribe = useCallback(async () => {
    if (!realUserId || !email) {
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
      await updateUserEmail(realUserId, email);
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
  }, [realUserId, email, showToast]);

  // Handle copy to clipboard
  const handleCopyAddress = useCallback(
    async (address: string, walletId: string) => {
      try {
        await navigator.clipboard.writeText(address);
        setCopiedId(walletId);
        setOpenDropdown(null);
        showToast({
          type: "success",
          title: "Address Copied",
          message: `${formatAddress(address)} copied to clipboard`,
        });
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showToast({
          type: "success",
          title: "Address Copied",
          message: `${formatAddress(address)} copied to clipboard`,
        });
      }
    },
    [formatAddress, showToast]
  );

  // All wallets (no longer separating primary and secondary)
  const allWallets = wallets;

  // Action menu component
  const WalletActionMenu = ({ wallet }: { wallet: WalletData }) => {
    const isOpen = openDropdown === wallet.id;

    return (
      <div className="relative">
        <button
          onClick={e => {
            e.stopPropagation();
            if (isOpen) {
              setOpenDropdown(null);
              setMenuPosition(null);
              return;
            }
            const rect = (
              e.currentTarget as HTMLElement
            ).getBoundingClientRect();
            const MENU_WIDTH = 192; // w-48
            const estimatedHeight = 210; // rough height for options
            const openUp =
              rect.bottom + estimatedHeight > window.innerHeight - 8;
            const top = openUp
              ? Math.max(8, rect.top - estimatedHeight - 4)
              : rect.bottom + 4;
            // Align right edge to button right, clamp within viewport
            const preferredLeft = rect.right - MENU_WIDTH;
            const left = Math.max(
              8,
              Math.min(preferredLeft, window.innerWidth - MENU_WIDTH - 8)
            );
            setMenuPosition({ top, left });
            setOpenDropdown(wallet.id);
          }}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={`Actions for ${wallet.label}`}
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && menuPosition && (
          <Portal>
            <div
              className={`w-48 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl ${Z_INDEX.TOAST}`}
              style={{
                position: "fixed",
                top: menuPosition.top,
                left: menuPosition.left,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    handleCopyAddress(wallet.address, wallet.id);
                    setOpenDropdown(null);
                    setMenuPosition(null);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Address
                </button>
                <a
                  href={`https://debank.com/profile/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                  onClick={() => {
                    setOpenDropdown(null);
                    setMenuPosition(null);
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  View on DeBank
                </a>
                <div className="border-t border-gray-700 my-1" />
                <button
                  onClick={() => {
                    setEditingWallet({
                      id: wallet.id,
                      label: wallet.label,
                    });
                    setOpenDropdown(null);
                    setMenuPosition(null);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Label
                </button>
                <button
                  onClick={() => {
                    handleDeleteWallet(wallet.id);
                    setOpenDropdown(null);
                    setMenuPosition(null);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-600/20 transition-colors flex items-center gap-2"
                  disabled={operations.removing[wallet.id]?.isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove from Bundle
                </button>
              </div>
            </div>
          </Portal>
        )}
      </div>
    );
  };

  // Wallet card component
  const WalletCard = ({ wallet }: { wallet: WalletData }) => (
    <motion.div
      key={wallet.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border transition-all duration-200 glass-morphism border-gray-700 hover:border-gray-600"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white truncate">
              {wallet.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <code className="font-mono text-xs sm:text-sm truncate">
              {formatAddress(wallet.address)}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {operations.editing[wallet.id]?.isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <LoadingSpinner size="sm" />
              <span className="hidden sm:inline">Updating...</span>
            </div>
          )}
          {operations.removing[wallet.id]?.isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <LoadingSpinner size="sm" />
              <span className="hidden sm:inline">Removing...</span>
            </div>
          )}
          {isOwner && <WalletActionMenu wallet={wallet} />}
        </div>
      </div>

      {/* Show operation errors */}
      {(operations.removing[wallet.id]?.error ||
        operations.editing[wallet.id]?.error) && (
        <div className="mt-3 p-2 bg-red-600/10 border border-red-600/20 rounded-lg">
          <p className="text-xs text-red-300">
            {operations.removing[wallet.id]?.error ||
              operations.editing[wallet.id]?.error}
          </p>
        </div>
      )}
    </motion.div>
  );

  // Edit wallet modal
  const EditWalletModal = (): JSX.Element | null => {
    const [newLabel, setNewLabel] = useState(editingWallet?.label || "");

    if (!editingWallet) return null;

    const handleSave = () => {
      handleEditLabel(editingWallet.id, newLabel);
    };

    const handleClose = () => {
      setEditingWallet(null);
      setNewLabel("");
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 ${Z_INDEX.MODAL} bg-gray-950/80 backdrop-blur-lg flex items-center justify-center p-4`}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Edit Wallet Label
              </h3>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Update the display name for{" "}
              {formatAddress(
                wallets.find(w => w.id === editingWallet.id)?.address || ""
              )}
            </p>

            <div className="space-y-4">
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="Enter wallet label"
                className="w-full bg-gray-800/50 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleClose();
                }}
              />

              <div className="flex gap-3">
                <GradientButton
                  onClick={handleSave}
                  gradient="from-green-600 to-emerald-600"
                  className="flex-1"
                  disabled={
                    !newLabel.trim() ||
                    !!operations.editing[editingWallet.id]?.isLoading
                  }
                >
                  {operations.editing[editingWallet.id]?.isLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" color="white" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </GradientButton>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 glass-morphism rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    );
  };

  // Click outside handler for dropdown
  useEffect(() => {
    if (!openDropdown) return;

    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdown]);

  // Early return if modal is closed
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 ${Z_INDEX.MODAL} bg-gray-950/80 backdrop-blur-lg flex items-center justify-center p-4`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <GlassCard className="p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-r ${GRADIENTS.PRIMARY} flex items-center justify-center`}
                >
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2
                    id="wallet-manager-title"
                    className="text-xl font-bold text-white"
                  >
                    Bundle Wallets
                  </h2>
                  <p
                    id="wallet-manager-description"
                    className="text-sm text-gray-400"
                  >
                    {!isConnected
                      ? "No wallet connected"
                      : isOwner
                        ? "Manage your wallet bundle"
                        : "Viewing wallet bundle"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-200"
                  aria-label="Close wallet manager"
                >
                  <X className="w-5 h-5 text-gray-300 hover:bg-white/10 transition-color" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {(loading || isRefreshing) && (
              <div className="p-6 text-center">
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
              <div className="p-6 text-center">
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

            {/* All Wallets Section */}
            {!loading && !isRefreshing && !error && (
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-300">
                    Bundle Wallets ({allWallets.length})
                  </h3>
                </div>

                {allWallets.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-xl">
                    <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-300 mb-4">
                      {isOwner
                        ? "Add wallets to your bundle"
                        : "No wallets in this bundle"}
                    </p>
                    {isOwner && (
                      <GradientButton
                        onClick={() => setIsAdding(true)}
                        gradient={GRADIENTS.PRIMARY}
                        icon={Plus}
                      >
                        Add Your First Wallet
                      </GradientButton>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allWallets.map(wallet => (
                      <WalletCard key={wallet.id} wallet={wallet} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add New Wallet Section - Only show if we have wallets and user is owner */}
            {!loading &&
              !isRefreshing &&
              !error &&
              allWallets.length > 0 &&
              isOwner && (
                <div className="p-6 border-b border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-300 mb-4">
                    Add Another Wallet
                  </h3>
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
                      className="w-full"
                    >
                      Add Another Wallet
                    </GradientButton>
                  )}
                </div>
              )}

            {/* PnL Subscription */}
            {!loading && !isRefreshing && !error && isOwner && (
              <div className="p-6 bg-gray-900/20">
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

        {/* Edit Wallet Modal */}
        <EditWalletModal />
      </motion.div>
    </AnimatePresence>
  );
};

export const WalletManager = memo(WalletManagerComponent);
