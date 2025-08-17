import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveAccount } from "thirdweb/react";
import {
  getUserByWallet,
  getBundleWalletsByPrimary,
} from "../../services/quantEngine";
import { queryKeys } from "../../lib/queryClient";

interface ApiUserResponse {
  id: string;
  user_id?: string;
}

interface ApiBundleResponse {
  user: {
    id: string;
    email: string;
  };
  main_wallet: string;
  additional_wallets: Array<{
    wallet_address: string;
    label: string | null;
    is_main: boolean;
    is_visible: boolean;
    created_at: string;
  }>;
  visible_wallets: string[];
  total_wallets: number;
  total_visible_wallets: number;
}

export interface UserInfo {
  userId: string;
  email: string;
  primaryWallet: string;
  bundleWallets: string[];
  additionalWallets: Array<{
    wallet_address: string;
    label: string | null;
    is_main: boolean;
    is_visible: boolean;
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

      // Get user basic info
      const userResponse = (await getUserByWallet(
        walletAddress
      )) as ApiUserResponse;

      // Get bundle wallets data
      const bundleResponse = (await getBundleWalletsByPrimary(
        userResponse.id
      )) as unknown as ApiBundleResponse;

      // Transform to consistent format
      return {
        userId: bundleResponse.user.id,
        email: bundleResponse.user.email,
        primaryWallet: bundleResponse.main_wallet,
        bundleWallets: bundleResponse.visible_wallets || [],
        additionalWallets: bundleResponse.additional_wallets || [],
        visibleWallets: bundleResponse.visible_wallets || [],
        totalWallets: bundleResponse.total_wallets || 0,
        totalVisibleWallets: bundleResponse.total_visible_wallets || 0,
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
