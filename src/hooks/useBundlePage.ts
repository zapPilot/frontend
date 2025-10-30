"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@/contexts/UserContext";
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

// Pure helpers extracted for clarity and testability
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

export function getDismissedStorageKey(userId: string) {
  return `dismissed-switch-${userId}`;
}

export function readSwitchDismissed(storage: Storage, userId: string): boolean {
  return storage.getItem(getDismissedStorageKey(userId)) === "true";
}

export function computeRedirectUrl(search: string): string {
  const s = search || "";
  return `/${s ? (s.startsWith("?") ? s : `?${s}`) : ""}`;
}

export function useBundlePage(userId: string): UseBundlePageResult {
  const router = useRouter();
  const { userInfo, isConnected } = useUser();
  const initialDismissed =
    typeof window !== "undefined" && userId
      ? readSwitchDismissed(localStorage, userId)
      : false;
  const [dismissedSwitchPrompt, setDismissedSwitchPrompt] =
    useState<boolean>(initialDismissed);
  const [bundleUser, setBundleUser] = useState<BundleUser | null>(null);
  const [bundleNotFound, setBundleNotFound] = useState(false);
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(false);
  const isDifferentUser = computeIsDifferentUser(
    isConnected,
    userInfo?.userId,
    userId
  );
  const [showSwitchPrompt, setShowSwitchPrompt] = useState<boolean>(
    isDifferentUser && !initialDismissed
  );

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

  // Local storage sync eliminated via lazy initializer above

  // Load bundle user info
  useEffect(() => {
    const loadBundleUser = async () => {
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
    };
    loadBundleUser();
  }, [userId]);

  // Redirect when disconnected from own bundle + switch prompt visibility
  useEffect(() => {
    const ownsBundle = userInfo?.userId === userId;
    if (!isConnected && ownsBundle) {
      const newUrl = computeRedirectUrl(window.location.search);
      router.replace(newUrl);
    }

    setShowSwitchPrompt(isDifferentUser && !dismissedSwitchPrompt);
  }, [
    isConnected,
    userInfo?.userId,
    userId,
    dismissedSwitchPrompt,
    isDifferentUser,
    router,
  ]);

  const handleSwitchToMyBundle = useCallback(() => {
    if (!userInfo?.userId) return;
    const params = new URLSearchParams(window.location.search);
    params.set("userId", userInfo.userId);
    const queryString = params.toString();
    router.replace(`/bundle${queryString ? `?${queryString}` : ""}`);
  }, [router, userInfo?.userId]);

  const handleStayHere = useCallback(() => {
    setDismissedSwitchPrompt(true);
    setShowSwitchPrompt(false);
    if (typeof window !== "undefined" && userId) {
      localStorage.setItem(getDismissedStorageKey(userId), "true");
    }
  }, [userId]);

  const handleEmailSubscribe = useCallback(() => {
    setIsWalletManagerOpen(true);
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
      openWalletManager: () => setIsWalletManagerOpen(true),
      closeWalletManager: () => setIsWalletManagerOpen(false),
      onEmailSubscribed: () => setEmailBannerDismissed(true),
    },
  };
}
