import { useQuery } from "@tanstack/react-query";
import { useActiveAccount } from "thirdweb/react";

import { queryKeys } from "@/lib/state/queryClient";
// Use account service directly for wallet connection and profile data
import { connectWallet, getUserProfile } from "@/services/accountService";
import type { UserProfileResponse } from "@/types/domain/user.types";

import { createQueryConfig } from "../queryDefaults";

// Removed ApiBundleResponse in favor of account API wallets

export interface UserInfo {
  userId: string;
  email: string;
  bundleWallets: string[];
  additionalWallets: {
    wallet_address: string;
    label: string | null;
    created_at: string;
  }[];
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

      // Connect wallet to create/retrieve user (returns data directly or throws)
      const { user_id: userId } = await connectWallet(walletAddress);

      // Fetch complete user profile once (includes wallets and email)
      const profileData: UserProfileResponse = await getUserProfile(userId);
      const wallets = profileData.wallets || [];
      const userEmail = profileData.user?.email || "";

      // Derive fields compatible with previous structure
      const bundleWallets =
        wallets.length > 0 ? wallets.map(w => w.wallet) : [walletAddress];

      const additionalWallets = wallets.map(w => ({
        wallet_address: w.wallet,
        label: w.label ?? null,
        created_at: w.created_at,
      }));

      return {
        userId,
        email: userEmail,
        bundleWallets,
        additionalWallets,
        visibleWallets: bundleWallets,
        totalWallets: bundleWallets.length,
        totalVisibleWallets: bundleWallets.length,
      };
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
