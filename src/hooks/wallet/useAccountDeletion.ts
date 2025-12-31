import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { TIMINGS } from "@/constants/timings";
import { WALLET_MESSAGES } from "@/constants/wallet";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/useToast";
import { queryKeys } from "@/lib/state/queryClient";
import { handleWalletError } from "@/lib/validation/walletUtils";
import { useWalletProvider } from "@/providers/WalletProvider";
import { deleteUser as deleteUserAccount } from "@/services/accountService";
import { walletLogger } from "@/utils/logger";

interface UseAccountDeletionParams {
  userId: string;
}

/**
 * Hook for account deletion operations
 *
 * Handles:
 * - Account deletion with confirmation
 * - Wallet disconnection on successful deletion
 * - Query invalidation and cleanup
 * - Page reload to reset application state
 */
export function useAccountDeletion({ userId }: UseAccountDeletionParams) {
  const queryClient = useQueryClient();
  const { refetch } = useUser();
  const { showToast } = useToast();
  const { disconnect, isConnected } = useWalletProvider();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Handle delete account
  const handleDeleteAccount = useCallback(async () => {
    if (!userId) return;

    setIsDeletingAccount(true);

    try {
      await deleteUserAccount(userId);

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
            title: WALLET_MESSAGES.DISCONNECT_WALLET,
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
          queryKey: queryKeys.user.wallets(userId),
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
        }, TIMINGS.MODAL_CLOSE_DELAY);
      }
    } catch (error) {
      const errorMessage = handleWalletError(error);
      showToast({
        type: "error",
        title: WALLET_MESSAGES.DELETION_FAILED,
        message: errorMessage,
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }, [userId, queryClient, refetch, showToast, disconnect, isConnected]);

  return {
    isDeletingAccount,
    handleDeleteAccount,
  };
}
