"use client";

import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useUser } from "@/contexts/UserContext";
import { useWalletProvider } from "@/providers/WalletProvider";
import {
  BundleUser,
  generateBundleUrl,
  getBundleUser,
  isOwnBundle as isBundleOwned,
} from "@/services/bundleService";
import { logger } from "@/utils/logger";

interface UseBundlePageResult {
  isOwnBundle: boolean;
  bundleUrl: string;
  bundleUser: BundleUser | null;
  bundleNotFound: boolean;
  showConnectCTA: boolean;
  // Header banners
  switchPrompt: {
    show: boolean;
    onStay: () => void;
    onSwitch: () => void;
  };
  emailBanner: {
    show: boolean;
    onSubscribe: () => void;
    onDismiss: () => void;
  };
  // Footer overlays
  overlays: {
    showQuickSwitch: boolean;
    isWalletManagerOpen: boolean;
    openWalletManager: () => void;
    closeWalletManager: () => void;
    onEmailSubscribed: () => void;
  };
}

const EMPTY_CONNECTED_WALLETS: { address: string; isActive?: boolean }[] = [];
const NOOP_SWITCH_ACTIVE_WALLET = () => Promise.resolve();

function useSafeQueryClient(fallback: QueryClient): QueryClient {
  try {
    return useQueryClient();
  } catch {
    return fallback;
  }
}

function useSafeWalletProvider(): ReturnType<typeof useWalletProvider> | null {
  try {
    return useWalletProvider();
  } catch {
    return null;
  }
}

// Pure helpers extracted for clarity and testability

/**
 * Determines if the connected user is viewing a different user's bundle.
 * Returns false if currentUserId is undefined (e.g., during loading).
 * Callers should combine with loading state check to avoid showing banner prematurely.
 *
 * @param isConnected - Whether a wallet is connected
 * @param currentUserId - The connected user's ID (may be undefined during loading)
 * @param viewedUserId - The bundle owner's user ID from the URL
 * @returns True if user is connected AND has loaded data AND viewing different user's bundle
 */
export function computeIsDifferentUser(
  isConnected: boolean,
  currentUserId: string | undefined,
  viewedUserId: string
): boolean {
  return Boolean(
    isConnected && currentUserId && currentUserId !== viewedUserId
  );
}

export function computeShowQuickSwitch(
  isConnected: boolean,
  isOwnBundle: boolean,
  currentUserId: string | undefined
): boolean {
  return Boolean(isConnected && !isOwnBundle && currentUserId);
}

export function computeShowEmailBanner(
  isConnected: boolean,
  isOwnBundle: boolean,
  email: string | undefined,
  emailBannerDismissed: boolean
): boolean {
  return Boolean(isConnected && isOwnBundle && !email && !emailBannerDismissed);
}

export function computeRedirectUrl(search: string): string {
  if (!search) {
    return "/";
  }

  if (search.startsWith("?")) {
    return `/${search}`;
  }

  return `/?${search}`;
}

/**
 * Hook for managing bundle page state and visibility logic.
 *
 * @param userId - The bundle owner's user ID from URL
 * @param walletId - Optional wallet ID for auto-switch (V22 Phase 2A)
 * @returns Bundle page state including banner visibility
 *
 * Note: Banner visibility depends on:
 * - User data must be loaded (not in loading state)
 * - User must be connected
 * - Connected user must be different from bundle owner
 */
export function useBundlePage(
  userId: string,
  walletId?: string
): UseBundlePageResult {
  const router = useRouter();
  const fallbackQueryClient = useMemo(() => new QueryClient(), []);
  const queryClient = useSafeQueryClient(fallbackQueryClient);
  const { userInfo, isConnected, connectedWallet, loading } = useUser();
  const walletContext = useSafeWalletProvider();
  const connectedWallets =
    walletContext?.connectedWallets ?? EMPTY_CONNECTED_WALLETS;
  const switchActiveWallet =
    walletContext?.switchActiveWallet ?? NOOP_SWITCH_ACTIVE_WALLET;
  const [bundleUser, setBundleUser] = useState<BundleUser | null>(null);
  const [bundleNotFound, setBundleNotFound] = useState(false);
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(false);
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);

  useEffect(() => {
    if (!walletId || !isConnected || userInfo?.userId !== userId) {
      return;
    }

    const normalizedWalletId = walletId.toLowerCase();
    const targetWallet = connectedWallets.find(
      walletItem => walletItem.address.toLowerCase() === normalizedWalletId
    );

    if (!targetWallet || targetWallet.isActive) {
      return;
    }

    void (async () => {
      try {
        await switchActiveWallet(walletId);
        await queryClient.invalidateQueries({
          queryKey: ["portfolio"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["wallets"],
        });
        logger.info("Cache invalidated after wallet switch");
      } catch (err) {
        logger.error("Failed to auto-switch wallet:", err);
      }
    })();
  }, [
    walletId,
    isConnected,
    userInfo,
    userId,
    connectedWallets,
    switchActiveWallet,
    queryClient,
  ]);

  const isDifferentUser = useMemo(
    () => computeIsDifferentUser(isConnected, userInfo?.userId, userId),
    [isConnected, userInfo?.userId, userId]
  );

  const showSwitchPrompt = !loading && isDifferentUser;

  const isOwnBundle = useMemo(
    () => isBundleOwned(userId, userInfo?.userId),
    [userId, userInfo?.userId]
  );
  const bundleUrl = useMemo(() => generateBundleUrl(userId), [userId]);
  const showQuickSwitch = useMemo(
    () => computeShowQuickSwitch(isConnected, isOwnBundle, userInfo?.userId),
    [isConnected, isOwnBundle, userInfo?.userId]
  );
  const showEmailBanner = useMemo(
    () =>
      computeShowEmailBanner(
        isConnected,
        isOwnBundle,
        userInfo?.email,
        emailBannerDismissed
      ),
    [isConnected, isOwnBundle, userInfo?.email, emailBannerDismissed]
  );

  useEffect(() => {
    async function loadBundleUser(): Promise<void> {
      if (!userId) {
        setBundleNotFound(true);
        return;
      }
      try {
        const user = await getBundleUser(userId);
        if (user) {
          setBundleUser(user);
          setBundleNotFound(false);
        } else {
          setBundleNotFound(true);
        }
      } catch (error) {
        logger.error("Failed to load bundle user:", error);
        setBundleNotFound(true);
      }
    }

    void loadBundleUser();
  }, [userId]);

  useEffect(() => {
    const ownsBundle = userInfo?.userId === userId;
    if (!isConnected && ownsBundle) {
      const newUrl = computeRedirectUrl(window.location.search);
      router.replace(newUrl);
    }
  }, [
    isConnected,
    userInfo?.userId,
    userId,
    connectedWallet, // Track wallet changes for reactivity
    router,
  ]);

  const handleSwitchToMyBundle = useCallback(() => {
    if (!userInfo?.userId) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("userId", userInfo.userId);
    if (userInfo.etlJobId) {
      params.set("etlJobId", userInfo.etlJobId);
    } else {
      params.delete("etlJobId");
    }
    const queryString = params.toString();
    router.replace(`/bundle${queryString ? `?${queryString}` : ""}`);
  }, [router, userInfo?.userId, userInfo?.etlJobId]);

  const handleStayHere = useCallback((): void => {
    return;
  }, []);

  const openWalletManager = useCallback(() => {
    setIsWalletManagerOpen(true);
  }, []);

  const closeWalletManager = useCallback(() => {
    setIsWalletManagerOpen(false);
  }, []);

  const handleEmailSubscribe = useCallback(() => {
    openWalletManager();
  }, [openWalletManager]);

  const handleEmailSubscribed = useCallback(() => {
    setEmailBannerDismissed(true);
  }, []);

  const handleEmailReminderDismiss = useCallback(() => {
    setEmailBannerDismissed(true);
  }, []);

  return {
    isOwnBundle,
    bundleUrl,
    bundleUser,
    bundleNotFound,
    showConnectCTA: !isConnected,
    switchPrompt: {
      show: showSwitchPrompt,
      onStay: handleStayHere,
      onSwitch: handleSwitchToMyBundle,
    },
    emailBanner: {
      show: showEmailBanner,
      onSubscribe: handleEmailSubscribe,
      onDismiss: handleEmailReminderDismiss,
    },
    overlays: {
      showQuickSwitch,
      isWalletManagerOpen,
      openWalletManager,
      closeWalletManager,
      onEmailSubscribed: handleEmailSubscribed,
    },
  };
}
