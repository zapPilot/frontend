"use client";

import { useEffect, useMemo } from "react";

import { QuickSwitchFAB } from "@/components/bundle";
import { SwitchPromptBanner } from "@/components/bundle/SwitchPromptBanner";
import { EmailReminderBanner } from "@/components/EmailReminderBanner";
import { BundleNotFound } from "@/components/ui";
import { MOCK_DATA } from "@/components/wallet/portfolio/data/mockPortfolioData";
import { WalletPortfolioLoadingState } from "@/components/wallet/portfolio/views/LoadingStates";
import { WalletPortfolioPresenter } from "@/components/wallet/portfolio/WalletPortfolioPresenter";
import { useBundlePage } from "@/hooks/useBundlePage";
import { usePortfolioData } from "@/hooks/queries/usePortfolioData";

interface BundlePageClientProps {
  userId: string;
  walletId?: string;
}

export function BundlePageClient({ userId, walletId }: BundlePageClientProps) {
  const vm = useBundlePage(userId, walletId);
  const { data, isLoading } = usePortfolioData(userId);

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

  // Footer overlays (quick switch FAB only - WalletManager removed)
  const footerOverlays = useMemo(
    () => (
      <>
        {vm.overlays.showQuickSwitch && (
          <QuickSwitchFAB onSwitchToMyBundle={vm.switchPrompt.onSwitch} />
        )}
      </>
    ),
    [vm.overlays.showQuickSwitch, vm.switchPrompt.onSwitch]
  );

  // Handle bundle not found case
  if (vm.bundleNotFound) {
    return <BundleNotFound message="Bundle not found" showConnectCTA={vm.showConnectCTA} />;
  }

  // Loading state
  if (isLoading && !data) {
    return <WalletPortfolioLoadingState />;
  }

  // Use real data if available, fallback to mock data
  const portfolioData = data ?? MOCK_DATA;

  // Render v22 portfolio with bundle features
  return (
    <WalletPortfolioPresenter
      data={portfolioData}
      userId={userId}
      headerBanners={headerBanners}
      footerOverlays={footerOverlays}
    />
  );
}
