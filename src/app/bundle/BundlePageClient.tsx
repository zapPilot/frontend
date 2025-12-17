"use client";

import dynamic from "next/dynamic";
import { ComponentType, useEffect, useMemo } from "react";

import { QuickSwitchFAB } from "@/components/bundle";
import { SwitchPromptBanner } from "@/components/bundle/SwitchPromptBanner";
import { DashboardShell } from "@/components/DashboardShell";
import { EmailReminderBanner } from "@/components/EmailReminderBanner";
import { BundleNotFound } from "@/components/ui";
import type { WalletManagerProps } from "@/components/WalletManager";
import { WalletManagerSkeleton } from "@/components/WalletManager/WalletManagerSkeleton";
import { useBundlePage } from "@/hooks/useBundlePage";

const WalletManager: ComponentType<WalletManagerProps> = dynamic(
  async () => {
    const mod = await import("@/components/WalletManager");
    return { default: mod.WalletManager };
  },
  {
    loading: () => <WalletManagerSkeleton />, // Friendly skeleton while loading chunk
  }
);

interface BundlePageClientProps {
  userId: string;
  walletId?: string;
}

export function BundlePageClient({ userId, walletId }: BundlePageClientProps) {
  const vm = useBundlePage(userId, walletId);

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

  // Footer overlays (quick switch FAB + wallet manager modal)
  const footerOverlays = (
    <>
      {vm.overlays.showQuickSwitch && (
        <QuickSwitchFAB onSwitchToMyBundle={vm.switchPrompt.onSwitch} />
      )}
      <WalletManager
        isOpen={vm.overlays.isWalletManagerOpen}
        onClose={vm.overlays.closeWalletManager}
        onEmailSubscribed={vm.overlays.onEmailSubscribed}
      />
    </>
  );

  // Handle bundle not found case
  if (vm.bundleNotFound) {
    return (
      <>
        <BundleNotFound
          message="Bundle not found"
          showConnectCTA={vm.showConnectCTA}
          onConnectClick={vm.overlays.openWalletManager}
        />
        {footerOverlays}
      </>
    );
  }

  return (
    <DashboardShell
      urlUserId={userId}
      isOwnBundle={vm.isOwnBundle}
      {...(vm.bundleUser?.displayName && {
        bundleUserName: vm.bundleUser.displayName,
      })}
      bundleUrl={vm.bundleUrl}
      headerBanners={headerBanners}
      footerOverlays={footerOverlays}
    />
  );
}
