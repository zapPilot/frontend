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

function NOOP_SWITCH_ACTIVE_WALLET(): Promise<void> {
  return Promise.resolve();
}

async function invalidateWalletSwitchQueries(
  queryClient: QueryClient
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: ["portfolio"],
  });
  await queryClient.invalidateQueries({
    queryKey: ["wallets"],
  });
}

function shouldAttemptAutoSwitch(
  walletId: string | undefined,
  isConnected: boolean,
  currentUserId: string | undefined,
  viewedUserId: string
): walletId is string {
  return Boolean(walletId && isConnected && currentUserId === viewedUserId);
}

function findWalletByAddress(
  connectedWallets: { address: string; isActive?: boolean }[],
  walletId: string
): { address: string; isActive?: boolean } | undefined {
  const normalizedWalletId = walletId.toLowerCase();
  return connectedWallets.find(
    walletItem => walletItem.address.toLowerCase() === normalizedWalletId
  );
}

async function performWalletSwitchAndRefresh(
  walletId: string,
  switchActiveWallet: (walletId: string) => Promise<void>,
  queryClient: QueryClient
): Promise<void> {
  try {
    await switchActiveWallet(walletId);
    await invalidateWalletSwitchQueries(queryClient);
    logger.info("Cache invalidated after wallet switch");
  } catch (err) {
    logger.error("Failed to auto-switch wallet:", err);
  }
}

function buildBundlePageUrl(searchParams: URLSearchParams): string {
  const queryString = searchParams.toString();
  if (!queryString) {
    return "/bundle";
  }

  return `/bundle?${queryString}`;
}

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

function shouldRedirectDisconnectedOwner(
  isConnected: boolean,
  currentUserId: string | undefined,
  viewedUserId: string
): boolean {
  return !isConnected && currentUserId === viewedUserId;
}

function buildUserBundleParams(userInfo: {
  userId?: string;
  etlJobId?: string | null | undefined;
}): URLSearchParams {
  const params = new URLSearchParams(window.location.search);
  if (!userInfo.userId) {
    return params;
  }

  params.set("userId", userInfo.userId);
  if (userInfo.etlJobId) {
    params.set("etlJobId", userInfo.etlJobId);
  } else {
    params.delete("etlJobId");
  }

  return params;
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
    if (
      !shouldAttemptAutoSwitch(walletId, isConnected, userInfo?.userId, userId)
    ) {
      return;
    }

    const targetWallet = findWalletByAddress(connectedWallets, walletId);

    if (!targetWallet || targetWallet.isActive) {
      return;
    }

    void performWalletSwitchAndRefresh(
      walletId,
      switchActiveWallet,
      queryClient
    );
  }, [
    walletId,
    isConnected,
    userInfo,
    userId,
    connectedWallets,
    switchActiveWallet,
    queryClient,
  ]);

  const isDifferentUser = computeIsDifferentUser(
    isConnected,
    userInfo?.userId,
    userId
  );

  const showSwitchPrompt = !loading && isDifferentUser;

  const isOwnBundle = isBundleOwned(userId, userInfo?.userId);
  const bundleUrl = generateBundleUrl(userId);
  const showQuickSwitch = computeShowQuickSwitch(
    isConnected,
    isOwnBundle,
    userInfo?.userId
  );
  const showEmailBanner = computeShowEmailBanner(
    isConnected,
    isOwnBundle,
    userInfo?.email,
    emailBannerDismissed
  );

  useEffect(() => {
    async function loadBundleUser(): Promise<void> {
      if (!userId) {
        setBundleNotFound(true);
        return;
      }

      try {
        const user = await getBundleUser(userId);
        setBundleUser(user);
        setBundleNotFound(!user);
      } catch (error) {
        logger.error("Failed to load bundle user:", error);
        setBundleNotFound(true);
      }
    }

    void loadBundleUser();
  }, [userId]);

  useEffect(() => {
    if (
      shouldRedirectDisconnectedOwner(isConnected, userInfo?.userId, userId)
    ) {
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

    const params = buildUserBundleParams(userInfo);
    router.replace(buildBundlePageUrl(params));
  }, [router, userInfo]);

  const handleStayHere = useCallback((): void => undefined, []);

  const openWalletManager = useCallback(() => {
    setIsWalletManagerOpen(true);
  }, []);

  const closeWalletManager = useCallback(() => {
    setIsWalletManagerOpen(false);
  }, []);

  const handleDismissEmailBanner = useCallback(() => {
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
      onSubscribe: openWalletManager,
      onDismiss: handleDismissEmailBanner,
    },
    overlays: {
      showQuickSwitch,
      isWalletManagerOpen,
      openWalletManager,
      closeWalletManager,
      onEmailSubscribed: handleDismissEmailBanner,
    },
  };
}
