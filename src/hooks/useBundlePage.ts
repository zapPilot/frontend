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

export interface UseBundlePageResult {
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

export function useBundlePage(userId: string): UseBundlePageResult {
  const router = useRouter();
  const { userInfo, isConnected } = useUser();
  const initialDismissed =
    typeof window !== "undefined" && userId
      ? localStorage.getItem(`dismissed-switch-${userId}`) === "true"
      : false;
  const [dismissedSwitchPrompt, setDismissedSwitchPrompt] =
    useState<boolean>(initialDismissed);
  const [bundleUser, setBundleUser] = useState<BundleUser | null>(null);
  const [bundleNotFound, setBundleNotFound] = useState(false);
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(false);
  const isDifferentUser = Boolean(
    isConnected && userInfo?.userId && userInfo.userId !== userId
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
    () => Boolean(isConnected && !isOwnBundle && userInfo?.userId),
    [isConnected, isOwnBundle, userInfo?.userId]
  );
  const showEmailBanner = useMemo(
    () =>
      Boolean(
        isConnected && isOwnBundle && !userInfo?.email && !emailBannerDismissed
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
      const searchParams = new URLSearchParams(window.location.search);
      const queryString = searchParams.toString();
      const newUrl = `/${queryString ? `?${queryString}` : ""}`;
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
      localStorage.setItem(`dismissed-switch-${userId}`, "true");
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
