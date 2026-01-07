"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { QuickSwitchFAB } from "@/components/bundle";
import { SwitchPromptBanner } from "@/components/bundle/SwitchPromptBanner";
import { DashboardShell } from "@/components/DashboardShell";
import { EmailReminderBanner } from "@/components/EmailReminderBanner";
import { WalletManager } from "@/components/WalletManager";
import { useUser } from "@/contexts/UserContext";
import { useBundlePage } from "@/hooks/bundle/useBundlePage";

interface BundlePageClientProps {
  userId: string;
  walletId?: string;
  etlJobId?: string;
  isNewUser?: boolean;
}

export function BundlePageClient({
  userId,
  walletId,
  etlJobId,
  isNewUser,
}: BundlePageClientProps) {
  const router = useRouter();
  const { userInfo, isConnected, loading } = useUser();
  const vm = useBundlePage(userId, walletId);

  // Redirect to user's bundle page after wallet connection (if currently on guest view)
  useEffect(() => {
    // Don't attempt redirect while user data is loading
    if (loading) {
      return;
    }

    if (
      isConnected &&
      !loading &&
      userInfo?.userId &&
      !userId &&
      window.location.pathname === "/"
    ) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("userId", userInfo.userId);
      if (userInfo.etlJobId) {
        searchParams.set("etlJobId", userInfo.etlJobId);
      }
      const queryString = searchParams.toString();
      const newUrl = `/bundle?${queryString}`;
      router.replace(newUrl);
    }
  }, [
    isConnected,
    loading,
    userInfo?.userId,
    userInfo?.etlJobId,
    userId,
    router,
  ]);

  useEffect(() => {
    const sanitizeInlineScripts = () => {
      const scripts = document.querySelectorAll("body script");
      for (const script of scripts) {
        if (!script.textContent) continue;
        if (/@[^@\s]+\.[^@\s]+/.test(script.textContent)) {
          script.textContent = "";
        }
      }
    };

    sanitizeInlineScripts();

    const observer = new MutationObserver(() => sanitizeInlineScripts());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  // Header banners (switch prompt + email banner)
  const headerBanners = useMemo(
    () => (
      <>
        <SwitchPromptBanner
          show={vm.switchPrompt.show}
          bundleUserName={vm.bundleUser?.displayName}
          onSwitch={vm.switchPrompt.onSwitch}
        />
        {vm.emailBanner.show && (
          <EmailReminderBanner
            onSubscribe={vm.emailBanner.onSubscribe}
            onDismiss={vm.emailBanner.onDismiss}
          />
        )}
      </>
    ),
    [
      vm.switchPrompt.show,
      vm.bundleUser?.displayName,
      vm.emailBanner.show,
      vm.switchPrompt.onSwitch,
      vm.emailBanner.onSubscribe,
      vm.emailBanner.onDismiss,
    ]
  );

  const walletManagerOverlay = useMemo(
    () => (
      <WalletManager
        isOpen={vm.overlays.isWalletManagerOpen}
        onClose={vm.overlays.closeWalletManager}
        onEmailSubscribed={vm.overlays.onEmailSubscribed}
        {...(userId ? { urlUserId: userId } : {})}
      />
    ),
    [
      userId,
      vm.overlays.closeWalletManager,
      vm.overlays.isWalletManagerOpen,
      vm.overlays.onEmailSubscribed,
    ]
  );

  // Footer overlays (quick switch FAB + WalletManager)
  const footerOverlays = useMemo(
    () => (
      <>
        {vm.overlays.showQuickSwitch && (
          <QuickSwitchFAB onSwitchToMyBundle={vm.switchPrompt.onSwitch} />
        )}
        {walletManagerOverlay}
      </>
    ),
    [
      vm.overlays.showQuickSwitch,
      vm.switchPrompt.onSwitch,
      walletManagerOverlay,
    ]
  );

  // Render v22 portfolio with bundle features
  return (
    <DashboardShell
      urlUserId={userId}
      initialEtlJobId={etlJobId}
      isNewUser={isNewUser}
      isOwnBundle={vm.isOwnBundle}
      bundleUrl={vm.bundleUrl}
      headerBanners={headerBanners}
      footerOverlays={footerOverlays}
      {...(vm.bundleUser?.displayName
        ? { bundleUserName: vm.bundleUser.displayName }
        : {})}
    />
  );
}
