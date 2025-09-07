"use client";

import { memo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Wallet, X } from "lucide-react";
import { GRADIENTS, Z_INDEX } from "@/constants/design-system";
import { useUser } from "@/contexts/UserContext";
import { GlassCard } from "@/components/ui";
import { UnifiedLoading } from "@/components/ui/UnifiedLoading";

import { useWalletOperations } from "./hooks/useWalletOperations";
import { useEmailSubscription } from "./hooks/useEmailSubscription";
import { useDropdownMenu } from "./hooks/useDropdownMenu";
import { WalletList } from "./components/WalletList";
import { EmailSubscription } from "./components/EmailSubscription";
import { EditWalletModal } from "./components/EditWalletModal";
import type { WalletManagerProps } from "./types/wallet.types";

const WalletManagerComponent = ({
  isOpen,
  onClose,
  urlUserId,
  onEmailSubscribed,
}: WalletManagerProps) => {
  const { userInfo, loading, error, isConnected, refetch } = useUser();

  // User identification logic
  const realUserId = userInfo?.userId; // Authenticated user (for operations)
  const viewingUserId = urlUserId || realUserId; // Which user's bundle to view
  const isOwner = realUserId && realUserId === viewingUserId; // Can user edit?

  // Custom hooks
  const walletOperations = useWalletOperations({
    viewingUserId: viewingUserId || "",
    realUserId: realUserId || "",
    isOwner: !!isOwner,
    isOpen,
  });

  const emailSubscription = useEmailSubscription({
    viewingUserId: viewingUserId || "",
    realUserId: realUserId || "",
    isOpen,
    onEmailSubscribed,
  });

  const dropdownMenu = useDropdownMenu();

  // Handle wallet operations
  const handleWalletChange = useCallback(
    (changes: Partial<typeof walletOperations.newWallet>) => {
      walletOperations.setNewWallet(prev => ({ ...prev, ...changes }));
    },
    [walletOperations]
  );

  const handleEditWallet = useCallback(
    (walletId: string, label: string) => {
      walletOperations.setEditingWallet({ id: walletId, label });
    },
    [walletOperations]
  );

  const handleCancelAdding = useCallback(() => {
    walletOperations.setIsAdding(false);
    walletOperations.setNewWallet({ address: "", label: "" });
    walletOperations.setValidationError(null);
  }, [walletOperations]);

  const handleCloseEditModal = useCallback(() => {
    walletOperations.setEditingWallet(null);
  }, [walletOperations]);

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
              <button
                onClick={onClose}
                className="p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-200"
                aria-label="Close wallet manager"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* Loading State */}
            {(loading || walletOperations.isRefreshing) && (
              <div className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <UnifiedLoading
                    variant="skeleton-inline"
                    width="8rem"
                    aria-label="Loading wallet data"
                  />
                </div>
                <p className="text-gray-400 text-sm">
                  {walletOperations.isRefreshing
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

            {/* Wallet List */}
            {!loading && !walletOperations.isRefreshing && !error && (
              <WalletList
                wallets={walletOperations.wallets}
                operations={walletOperations.operations}
                isOwner={!!isOwner}
                isAdding={walletOperations.isAdding}
                newWallet={walletOperations.newWallet}
                validationError={walletOperations.validationError}
                openDropdown={dropdownMenu.openDropdown}
                menuPosition={dropdownMenu.menuPosition}
                onCopyAddress={walletOperations.handleCopyAddress}
                onEditWallet={handleEditWallet}
                onDeleteWallet={walletOperations.handleDeleteWallet}
                onToggleDropdown={dropdownMenu.toggleDropdown}
                onCloseDropdown={dropdownMenu.closeDropdown}
                onWalletChange={handleWalletChange}
                onAddWallet={walletOperations.handleAddWallet}
                onStartAdding={() => walletOperations.setIsAdding(true)}
                onCancelAdding={handleCancelAdding}
              />
            )}

            {/* Email Subscription */}
            {!loading &&
              !walletOperations.isRefreshing &&
              !error &&
              isOwner && (
                <EmailSubscription
                  email={emailSubscription.email}
                  subscribedEmail={emailSubscription.subscribedEmail}
                  isEditingSubscription={
                    emailSubscription.isEditingSubscription
                  }
                  subscriptionOperation={
                    emailSubscription.subscriptionOperation
                  }
                  onEmailChange={emailSubscription.setEmail}
                  onSubscribe={emailSubscription.handleSubscribe}
                  onStartEditing={emailSubscription.startEditingSubscription}
                  onCancelEditing={emailSubscription.cancelEditingSubscription}
                />
              )}
          </GlassCard>
        </motion.div>

        {/* Edit Wallet Modal */}
        <EditWalletModal
          editingWallet={walletOperations.editingWallet}
          wallets={walletOperations.wallets}
          operations={walletOperations.operations}
          onSave={walletOperations.handleEditLabel}
          onClose={handleCloseEditModal}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export const WalletManager = memo(WalletManagerComponent);
