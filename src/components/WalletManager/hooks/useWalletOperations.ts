import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { useUser } from "@/contexts/UserContext";
import { invalidateAndRefetch } from "@/hooks/useQueryInvalidation";
import { useToast } from "@/hooks/useToast";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/lib/formatters";
import { queryKeys } from "@/lib/queryClient";
import { handleWalletError, type WalletData } from "@/lib/walletUtils";
import { deleteUser as deleteUserAccount } from "@/services/accountService";
import { copyTextToClipboard } from "@/utils/clipboard";
import { walletLogger } from "@/utils/logger";

import {
  addWallet as addWalletToBundle,
  loadWallets as fetchWallets,
  removeWallet as removeWalletFromBundle,
  updateWalletLabel as updateWalletLabelRequest,
} from "../services/WalletService";
import type {
  EditingWallet,
  NewWallet,
  WalletOperations,
} from "../types/wallet.types";
import { validateNewWallet } from "../utils/validation";

// Toast message constants to avoid duplicate strings
const TOAST_MESSAGES = {
  DELETION_FAILED: "Deletion Failed",
} as const;

interface UseWalletOperationsParams {
  viewingUserId: string;
  realUserId: string;
  isOwner: boolean;
  isOpen: boolean;
}

export const useWalletOperations = ({
  viewingUserId,
  realUserId,
  isOwner,
  isOpen,
}: UseWalletOperationsParams) => {
  const queryClient = useQueryClient();
  const { refetch } = useUser();
  const { showToast } = useToast();
  const { disconnect, isConnected } = useWallet();

  // State
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [operations, setOperations] = useState<WalletOperations>({
    adding: { isLoading: false, error: null },
    removing: {},
    editing: {},
    subscribing: { isLoading: false, error: null },
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingWallet, setEditingWallet] = useState<EditingWallet | null>(
    null
  );
  const [newWallet, setNewWallet] = useState<NewWallet>({
    address: "",
    label: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Load wallets from API
  const loadWallets = useCallback(
    async (silent = false) => {
      if (!viewingUserId) return;

      if (!silent) {
        setIsRefreshing(true);
      }

      try {
        const loadedWallets = await fetchWallets(viewingUserId);
        setWallets(loadedWallets);
      } catch {
        // Handle silently - error state is managed by service response
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
      void loadWallets();
    }
  }, [isOpen, viewingUserId, loadWallets]);

  // Auto-refresh data periodically (only for connected users viewing their own data)
  useEffect(() => {
    if (!isOpen || !viewingUserId || !isOwner) return;

    const interval = setInterval(() => {
      void loadWallets(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, viewingUserId, isOwner, loadWallets]);

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
          await invalidateAndRefetch({
            queryClient,
            queryKey: queryKeys.user.wallets(realUserId),
            refetch,
            operationName: "wallet removal",
          });

          setOperations(prev => ({
            ...prev,
            removing: {
              ...prev.removing,
              [walletId]: { isLoading: false, error: null },
            },
          }));
        } else {
          setOperations(prev => ({
            ...prev,
            removing: {
              ...prev.removing,
              [walletId]: {
                isLoading: false,
                error: response.error ?? "Failed to remove wallet",
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

        // Call the API to update wallet label
        const response = await updateWalletLabelRequest(
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
                error: response.error ?? "Failed to update wallet label",
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
    if (!realUserId) return;

    // Validate input
    const validation = validateNewWallet(newWallet);
    if (!validation.isValid) {
      setValidationError(validation.error ?? "Invalid wallet data");
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
        await invalidateAndRefetch({
          queryClient,
          queryKey: queryKeys.user.wallets(realUserId),
          refetch,
          operationName: "adding wallet",
        });

        setOperations(prev => ({
          ...prev,
          adding: { isLoading: false, error: null },
        }));
      } else {
        setOperations(prev => ({
          ...prev,
          adding: {
            isLoading: false,
            error: response.error ?? "Failed to add wallet",
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

  // Handle copy to clipboard
  const handleCopyAddress = useCallback(
    async (address: string) => {
      const success = await copyTextToClipboard(address);
      if (success) {
        showToast({
          type: "success",
          title: "Address Copied",
          message: `${formatAddress(address)} copied to clipboard`,
        });
      }
    },
    [showToast]
  );

  // Handle delete account
  const handleDeleteAccount = useCallback(async () => {
    if (!realUserId) return;

    setIsDeletingAccount(true);

    try {
      await deleteUserAccount(realUserId);

      let shouldReload = true;

      if (isConnected) {
        try {
          await disconnect();
        } catch (disconnectError) {
          const disconnectMessage =
            handleWalletError(disconnectError) ||
            "Account deleted, but we couldn't disconnect your wallet automatically.";

          showToast({
            type: "warning",
            title: "Disconnect Wallet",
            message: `${disconnectMessage} Please disconnect manually to prevent automatic reconnection.`,
          });

          shouldReload = false;
        }
      }

      showToast({
        type: "success",
        title: "Account Deleted",
        message:
          "Account successfully deleted. Wallet connection has been cleared to prevent automatic reconnection.",
      });

      // Invalidate queries and trigger reconnection flow
      try {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.user.wallets(realUserId),
        });
      } catch (invalidateError) {
        walletLogger.error(
          "Failed to invalidate wallet queries after deleting account",
          invalidateError
        );
      }
      try {
        await refetch();
      } catch (refetchError) {
        walletLogger.error(
          "Failed to refetch user data after deleting account",
          refetchError
        );
      }

      if (shouldReload) {
        // Close the wallet manager after a brief delay
        setTimeout(() => {
          // Trigger logout/reconnect flow
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      const errorMessage = handleWalletError(error);
      showToast({
        type: "error",
        title: TOAST_MESSAGES.DELETION_FAILED,
        message: errorMessage,
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }, [realUserId, queryClient, refetch, showToast, disconnect, isConnected]);

  return {
    // State
    wallets,
    operations,
    isRefreshing,
    isAdding,
    editingWallet,
    newWallet,
    validationError,
    isDeletingAccount,

    // Actions
    setIsAdding,
    setEditingWallet,
    setNewWallet,
    setValidationError,
    loadWallets,
    handleDeleteWallet,
    handleEditLabel,
    handleAddWallet,
    handleCopyAddress,
    handleDeleteAccount,
  };
};
