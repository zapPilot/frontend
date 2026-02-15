import { useQueryClient } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction, useCallback } from "react";

import {
  addWallet as addWalletToBundle,
  removeWallet as removeWalletFromBundle,
} from "@/components/WalletManager/services/WalletService";
import type {
  NewWallet,
  WalletOperations,
  WalletOperationStateSetter,
} from "@/components/WalletManager/types/wallet.types";
import { validateNewWallet } from "@/components/WalletManager/utils/validation";
import { useUser } from "@/contexts/UserContext";
import { invalidateAndRefetch } from "@/hooks/utils/useQueryInvalidation";
import { queryKeys } from "@/lib/state/queryClient";
import {
  handleWalletError,
  type WalletData,
} from "@/lib/validation/walletUtils";

interface UseWalletMutationsParams {
  userId: string;
  operations: WalletOperations;
  setOperations: Dispatch<SetStateAction<WalletOperations>>;
  setWallets: Dispatch<SetStateAction<WalletData[]>>;
  setWalletOperationState: WalletOperationStateSetter;
  loadWallets: () => Promise<void>;
}

/**
 * Hook for wallet mutation operations (add/delete)
 *
 * Handles:
 * - Adding new wallets with validation
 * - Removing wallets with optimistic updates
 * - Query invalidation and refetch after mutations
 */
export function useWalletMutations({
  userId,
  operations,
  setOperations,
  setWallets,
  setWalletOperationState,
  loadWallets,
}: UseWalletMutationsParams) {
  const queryClient = useQueryClient();
  const { refetch } = useUser();

  // Handle wallet deletion
  const handleDeleteWallet = useCallback(
    async (walletId: string) => {
      if (!userId) return;

      // Set loading state for this specific wallet
      setWalletOperationState("removing", walletId, {
        isLoading: true,
        error: null,
      });

      try {
        const response = await removeWalletFromBundle(userId, walletId);
        if (response.success) {
          // Remove wallet from local state immediately (optimistic update)
          setWallets(prev => prev.filter(wallet => wallet.id !== walletId));

          // Invalidate and refetch user data
          await invalidateAndRefetch({
            queryClient,
            queryKey: queryKeys.user.wallets(userId),
            refetch,
            operationName: "wallet removal",
          });

          setWalletOperationState("removing", walletId, {
            isLoading: false,
            error: null,
          });
        } else {
          setWalletOperationState("removing", walletId, {
            isLoading: false,
            error: response.error ?? "Failed to remove wallet",
          });
        }
      } catch (error) {
        const errorMessage = handleWalletError(error);
        setWalletOperationState("removing", walletId, {
          isLoading: false,
          error: errorMessage,
        });
      }
    },
    [userId, queryClient, refetch, setWalletOperationState, setWallets]
  );

  // Handle adding new wallet
  const handleAddWallet = useCallback(
    async (newWallet: NewWallet) => {
      if (!userId) return { success: false, error: "User ID is required" };

      // Validate input
      const validation = validateNewWallet(newWallet);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error ?? "Invalid wallet data",
        };
      }

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
          // Refresh wallets list
          await loadWallets();

          // Invalidate and refetch user data
          await invalidateAndRefetch({
            queryClient,
            queryKey: queryKeys.user.wallets(userId),
            refetch,
            operationName: "adding wallet",
          });

          setOperations(prev => ({
            ...prev,
            adding: { isLoading: false, error: null },
          }));

          return { success: true };
        }

        const error = response.error ?? "Failed to add wallet";
        setOperations(prev => ({
          ...prev,
          adding: {
            isLoading: false,
            error,
          },
        }));
        return { success: false, error };
      } catch (error) {
        const errorMessage = handleWalletError(error);
        setOperations(prev => ({
          ...prev,
          adding: { isLoading: false, error: errorMessage },
        }));
        return { success: false, error: errorMessage };
      }
    },
    [userId, loadWallets, queryClient, refetch, setOperations]
  );

  return {
    handleDeleteWallet,
    handleAddWallet,
    addingState: operations.adding,
  };
}
