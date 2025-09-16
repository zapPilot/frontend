"use client";

import { QuickSwitchFAB } from "@/components/bundle";
import { EmailReminderBanner } from "@/components/EmailReminderBanner";
import { DashboardShell } from "@/components/DashboardShell";
import { BundleNotFound } from "@/components/ui";
import type { WalletManagerProps } from "@/components/WalletManager";
import { HEADER, Z_INDEX } from "@/constants/design-system";
import dynamic from "next/dynamic";
import { ComponentType, useMemo } from "react";
import { useBundlePage } from "@/hooks/useBundlePage";

const WalletManager: ComponentType<WalletManagerProps> = dynamic(
  () =>
    import("@/components/WalletManager").then(mod => ({
      default: mod.WalletManager,
    })),
  {
    loading: () => null, // Modal doesn't need loading state when closed
  }
);

interface BundlePageClientProps {
  userId: string;
}

export function BundlePageClient({ userId }: BundlePageClientProps) {
  const vm = useBundlePage(userId);

  // Header banners (switch prompt + email banner)
  const headerBanners = useMemo(
    () => (
      <>
        {vm.switchPrompt.show && (
          <div
            className={`sticky ${HEADER.TOP_OFFSET} ${Z_INDEX.BANNER} mx-4 lg:mx-8 mt-4`}
          >
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/40 backdrop-blur px-4 py-3 text-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm">
                You&apos;re viewing another user&apos;s bundle. Switch to your
                own bundle?
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={vm.switchPrompt.onStay}
                  className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20 transition"
                >
                  Stay
                </button>
                <button
                  onClick={vm.switchPrompt.onSwitch}
                  className="px-3 py-1.5 text-sm rounded-md bg-indigo-500 hover:bg-indigo-400 text-white transition"
                  data-testid="switch-to-my-bundle"
                >
                  Switch to my bundle
                </button>
              </div>
            </div>
          </div>
        )}

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
      <BundleNotFound
        message="Bundle not found"
        showConnectCTA={vm.showConnectCTA}
        onConnectClick={vm.overlays.openWalletManager}
      />
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
