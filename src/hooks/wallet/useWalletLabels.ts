import { type Dispatch, type SetStateAction, useCallback } from "react";

import { updateWalletLabel as updateWalletLabelRequest } from "@/components/WalletManager/services/WalletService";
import type {
  EditingWallet,
  WalletOperationStateSetter,
} from "@/components/WalletManager/types/wallet.types";
import {
  handleWalletError,
  type WalletData,
} from "@/lib/validation/walletUtils";

interface UseWalletLabelsParams {
  userId: string;
  wallets: WalletData[];
  setWallets: Dispatch<SetStateAction<WalletData[]>>;
  setEditingWallet: Dispatch<SetStateAction<EditingWallet | null>>;
  setWalletOperationState: WalletOperationStateSetter;
}

/**
 * Hook for wallet label editing operations
 *
 * Handles:
 * - Optimistic label updates
 * - API synchronization
 * - Rollback on failure
 */
export function useWalletLabels({
  userId,
  wallets,
  setWallets,
  setEditingWallet,
  setWalletOperationState,
}: UseWalletLabelsParams) {
  // Handle editing label
  const handleEditLabel = useCallback(
    async (walletId: string, newLabel: string) => {
      if (!userId || !newLabel.trim()) {
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
      setWalletOperationState("editing", walletId, {
        isLoading: true,
        error: null,
      });

      const updateLabel = (label: string) =>
        setWallets(prev =>
          prev.map(w => (w.id === walletId ? { ...w, label } : w))
        );

      try {
        // Update local state immediately (optimistic update)
        updateLabel(newLabel);
        setEditingWallet(null);

        // Call the API to update wallet label
        const response = await updateWalletLabelRequest(
          userId,
          wallet.address,
          newLabel
        );

        if (!response.success) {
          updateLabel(wallet.label);
          setWalletOperationState("editing", walletId, {
            isLoading: false,
            error: response.error ?? "Failed to update wallet label",
          });
          return;
        }

        setWalletOperationState("editing", walletId, {
          isLoading: false,
          error: null,
        });
      } catch (error) {
        updateLabel(wallet.label);
        const errorMessage = handleWalletError(error);
        setWalletOperationState("editing", walletId, {
          isLoading: false,
          error: errorMessage,
        });
      }
    },
    [userId, wallets, setWallets, setEditingWallet, setWalletOperationState]
  );

  return {
    handleEditLabel,
  };
}
