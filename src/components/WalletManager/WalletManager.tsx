"use client";

import { AnimatePresence } from "framer-motion";
import { AlertTriangle, Wallet, X } from "lucide-react";
import { memo, useCallback } from "react";

import { BaseCard } from "@/components/ui";
import { Skeleton } from "@/components/ui/LoadingSystem";
import { GRADIENTS } from "@/constants/design-system";
import { useUser } from "@/contexts/UserContext";
import { useAsyncRetryButton } from "@/hooks/useAsyncRetryButton";
import { useWalletProvider } from "@/providers/WalletProvider";
import { logger } from "@/utils/logger";

import { ConnectWalletButton } from "./components/ConnectWalletButton";
import { DeleteAccountButton } from "./components/DeleteAccountButton";
import { EditWalletModal } from "./components/EditWalletModal";
import { EmailSubscription } from "./components/EmailSubscription";
import { ModalBackdrop } from "./components/ModalBackdrop";
import { WalletList } from "./components/WalletList";
import { useDropdownMenu } from "./hooks/useDropdownMenu";
import { useEmailSubscription } from "./hooks/useEmailSubscription";
import { useWalletOperations } from "./hooks/useWalletOperations";
import type { WalletManagerProps } from "./types/wallet.types";

const WalletManagerComponent = ({
  isOpen,
  onClose,
  urlUserId,
  onEmailSubscribed,
}: WalletManagerProps) => {
  const { userInfo, loading, error, isConnected, refetch } = useUser();
  const { connectedWallets } = useWalletProvider();

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

  // Async retry button for error state
  const { handleRetry, isRetrying } = useAsyncRetryButton({
    onRetry: async () => {
      await refetch();
    },
    errorContext: "refetch user data in WalletManager",
    logger,
  });

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
      <ModalBackdrop
        onDismiss={onClose}
        innerClassName="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <BaseCard variant="glass" className="p-0 overflow-hidden">
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
                  Bundled Wallets
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
                <Skeleton
                  variant="rectangular"
                  width="8rem"
                  height={32}
                  aria-label="Loading wallet data"
                  data-testid="unified-loading"
                />
              </div>
              <p className="text-gray-400 text-sm">
                {walletOperations.isRefreshing
                  ? "Refreshing wallets..."
                  : "Loading bundled wallets..."}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6 text-center">
              <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-3" />
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-3 py-1 text-xs bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? "Retrying..." : "Retry"}
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
              onSwitchWallet={walletOperations.handleSwitchWallet}
              onToggleDropdown={dropdownMenu.toggleDropdown}
              onCloseDropdown={dropdownMenu.closeDropdown}
              onWalletChange={handleWalletChange}
              onAddWallet={walletOperations.handleAddWallet}
              onStartAdding={() => walletOperations.setIsAdding(true)}
              onCancelAdding={handleCancelAdding}
            />
          )}

          {/* Connect Web3 Wallet */}
          {!loading && !walletOperations.isRefreshing && !error && isOwner && (
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-300">
                  Connect Web3 Wallet
                </h3>
                <div className="text-xs text-gray-500">
                  {connectedWallets.length} connected
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Connect additional wallets (MetaMask, Ambire, etc.) for active
                use.
              </p>
              <ConnectWalletButton />
            </div>
          )}

          {/* Email Subscription */}
          {!loading && !walletOperations.isRefreshing && !error && isOwner && (
            <EmailSubscription
              email={emailSubscription.email}
              subscribedEmail={emailSubscription.subscribedEmail}
              isEditingSubscription={emailSubscription.isEditingSubscription}
              subscriptionOperation={emailSubscription.subscriptionOperation}
              onEmailChange={emailSubscription.setEmail}
              onSubscribe={emailSubscription.handleSubscribe}
              onUnsubscribe={emailSubscription.handleUnsubscribe}
              onStartEditing={emailSubscription.startEditingSubscription}
              onCancelEditing={emailSubscription.cancelEditingSubscription}
            />
          )}

          {/* Delete Account */}
          {!loading && !walletOperations.isRefreshing && !error && isOwner && (
            <div className="p-6">
              <DeleteAccountButton
                onDelete={walletOperations.handleDeleteAccount}
                isDeleting={walletOperations.isDeletingAccount}
              />
            </div>
          )}
        </BaseCard>

        {/* Edit Wallet Modal */}
        <EditWalletModal
          editingWallet={walletOperations.editingWallet}
          wallets={walletOperations.wallets}
          operations={walletOperations.operations}
          onSave={walletOperations.handleEditLabel}
          onClose={handleCloseEditModal}
        />
      </ModalBackdrop>
    </AnimatePresence>
  );
};

export const WalletManager = memo(WalletManagerComponent);
