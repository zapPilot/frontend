import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveAccount } from "thirdweb/react";
import { queryKeys } from "../../lib/queryClient";
import { createQueryConfig } from "./queryDefaults";
// Use user service wrappers to connect and fetch the aggregated profile data
import { connectWallet, getUserProfile } from "../../services/userService";
import type {
  UserCryptoWallet,
  UserProfileResponse,
} from "../../types/user.types";

// Removed ApiBundleResponse in favor of account API wallets

// Feature flag for Phase 5 rollback protection
// Set NEXT_PUBLIC_USE_LEGACY_WALLET=true to re-enable legacy primaryWallet field computation
const USE_LEGACY_WALLET_FIELDS =
  process.env["NEXT_PUBLIC_USE_LEGACY_WALLET"] === "true";

export interface UserInfo {
  userId: string;
  email: string;
  primaryWallet?: string; // DEPRECATED: Optional for backward compatibility during migration
  bundleWallets: string[];
  additionalWallets: Array<{
    wallet_address: string;
    label: string | null;
    created_at: string;
  }>;
  visibleWallets: string[];
  totalWallets: number;
  totalVisibleWallets: number;
}

// Hook to get user by wallet address
export function useUserByWallet(walletAddress: string | null) {
  return useQuery({
    ...createQueryConfig({
      dataType: "dynamic",
      retryConfig: {
        skipErrorMessages: ["USER_NOT_FOUND"],
      },
    }),
    queryKey: queryKeys.user.byWallet(walletAddress || ""),
    queryFn: async (): Promise<UserInfo> => {
      if (!walletAddress) {
        throw new Error("No wallet address provided");
      }

      // Connect wallet to create/retrieve user
      const connectResult = await connectWallet(walletAddress);
      if (!connectResult.success || !connectResult.data) {
        throw new Error(connectResult.error || "Failed to connect wallet");
      }

      const { user_id: userId } = connectResult.data;

      // Fetch complete user profile once (includes wallets and email)
      let wallets: UserCryptoWallet[] = [];
      let userEmail = "";
      const profileResult = await getUserProfile(userId);
      if (profileResult.success && profileResult.data) {
        const data: UserProfileResponse = profileResult.data;
        wallets = data.wallets || [];
        userEmail = data.user?.email || "";
      } else if (profileResult.error) {
        throw new Error(profileResult.error);
      }

      // Derive fields compatible with previous structure
      const bundleWallets =
        wallets.length > 0 ? wallets.map(w => w.wallet) : [walletAddress];

      const additionalWallets = wallets.map(w => ({
        wallet_address: w.wallet,
        label: w.label ?? null,
        created_at: w.created_at,
      }));

      const result: UserInfo = {
        userId,
        email: userEmail, // Now populated from getUserProfile
        bundleWallets,
        additionalWallets,
        visibleWallets: bundleWallets,
        totalWallets: bundleWallets.length,
        totalVisibleWallets: bundleWallets.length,
      };

      // Add primaryWallet only if legacy mode enabled (Phase 5 rollback protection)
      if (USE_LEGACY_WALLET_FIELDS) {
        const primaryWallet =
          wallets.find(w => w.is_main)?.wallet ||
          walletAddress ||
          wallets[0]?.wallet ||
          "";
        result.primaryWallet = primaryWallet;
      }

      return result;
    },
    enabled: !!walletAddress, // Only run when wallet address is available
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
    error: (userQuery.error as Error | null)?.message || null,
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
