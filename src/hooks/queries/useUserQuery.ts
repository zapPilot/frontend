import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveAccount } from "thirdweb/react";
import { queryKeys } from "../../lib/queryClient";
// Switched from analytics-engine bundle API to account API
import { connectWallet, getUserWallets } from "../../services/accountService";
import type { UserCryptoWallet } from "../../types/user.types";

// Removed ApiBundleResponse in favor of account API wallets

export interface UserInfo {
  userId: string;
  email: string;
  primaryWallet: string;
  bundleWallets: string[];
  additionalWallets: Array<{
    wallet_address: string;
    label: string | null;
    is_main: boolean;

    created_at: string;
  }>;
  visibleWallets: string[];
  totalWallets: number;
  totalVisibleWallets: number;
}

// Hook to get user by wallet address
export function useUserByWallet(walletAddress: string | null) {
  return useQuery({
    queryKey: queryKeys.user.byWallet(walletAddress || ""),
    queryFn: async (): Promise<UserInfo> => {
      if (!walletAddress) {
        throw new Error("No wallet address provided");
      }

      // Connect wallet to create/retrieve user
      const connectResponse = await connectWallet(walletAddress);

      // Fetch user wallets from account API
      const wallets: UserCryptoWallet[] = await getUserWallets(
        connectResponse.user_id
      );

      // Derive fields compatible with previous structure
      const primaryWallet =
        wallets.find(w => w.is_main)?.wallet ||
        wallets[0]?.wallet ||
        walletAddress;

      const bundleWallets =
        wallets.length > 0 ? wallets.map(w => w.wallet) : [walletAddress];

      const additionalWallets = wallets
        .filter(w => !w.is_main)
        .map(w => ({
          wallet_address: w.wallet,
          label: w.label ?? null,
          is_main: w.is_main,
          created_at: w.created_at,
        }));

      return {
        userId: connectResponse.user_id,
        email: "", // Email not provided by getUserWallets; can be populated via getUserProfile if needed
        primaryWallet,
        bundleWallets,
        additionalWallets,
        visibleWallets: bundleWallets,
        totalWallets: bundleWallets.length,
        totalVisibleWallets: bundleWallets.length,
      };
    },
    enabled: !!walletAddress, // Only run when wallet address is available
    staleTime: 2 * 60 * 1000, // User data is stale after 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: (failureCount, error) => {
      // Don't retry USER_NOT_FOUND errors
      if (error instanceof Error && error.message === "USER_NOT_FOUND") {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
}

// Hook to access current user data (combines wallet connection + user query)
export function useCurrentUser() {
  const activeAccount = useActiveAccount();
  const connectedWallet = activeAccount?.address || null;

  const userQuery = useUserByWallet(connectedWallet);

  return {
    ...userQuery,
    isConnected: !!connectedWallet,
    connectedWallet,
    userInfo: userQuery.data || null,
    // Transform error messages for UI consistency
    error: userQuery.error?.message || null,
  };
}

// Mutation for refreshing user data
export function useRefreshUser() {
  const queryClient = useQueryClient();
  const activeAccount = useActiveAccount();
  const connectedWallet = activeAccount?.address || null;

  return useMutation({
    mutationFn: async () => {
      if (!connectedWallet) {
        throw new Error("No wallet connected");
      }

      // Invalidate current user cache
      await queryClient.invalidateQueries({
        queryKey: queryKeys.user.byWallet(connectedWallet),
      });

      // Refetch user data
      return queryClient.fetchQuery({
        queryKey: queryKeys.user.byWallet(connectedWallet),
      });
    },
    onSuccess: () => {
      // Optionally invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.all,
      });
    },
  });
}
