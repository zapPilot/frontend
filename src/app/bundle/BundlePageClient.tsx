"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { QuickSwitchFAB } from "@/components/bundle";
import { SwitchPromptBanner } from "@/components/bundle/SwitchPromptBanner";
import { DashboardShell } from "@/components/DashboardShell";
import { EmailReminderBanner } from "@/components/EmailReminderBanner";
import { WalletManager } from "@/components/WalletManager";
import { useUser } from "@/contexts/UserContext";
import { useBundlePage } from "@/hooks/useBundlePage";

interface BundlePageClientProps {
  userId: string;
  walletId?: string;
}

export function BundlePageClient({ userId, walletId }: BundlePageClientProps) {
  const router = useRouter();
  const { userInfo, isConnected } = useUser();
  const vm = useBundlePage(userId, walletId);

  // Redirect to user's bundle page after wallet connection (if currently on guest view)
  useEffect(() => {
    if (
      isConnected &&
      userInfo?.userId &&
      !userId &&
      window.location.pathname === "/"
    ) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("userId", userInfo.userId);
      const queryString = searchParams.toString();
      const newUrl = `/bundle?${queryString}`;
      router.replace(newUrl);
    }
  }, [isConnected, userInfo?.userId, userId, router]);

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
          onStay={vm.switchPrompt.onStay}
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
      vm.emailBanner.show,
      vm.switchPrompt.onStay,
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
