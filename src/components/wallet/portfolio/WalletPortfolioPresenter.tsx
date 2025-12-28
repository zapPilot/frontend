"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { Footer } from "@/components/Footer/Footer";
import { AnalyticsView } from "@/components/wallet/portfolio/analytics";
import { PortfolioModals } from "@/components/wallet/portfolio/components/PortfolioModals";
import { WalletNavigation } from "@/components/wallet/portfolio/components/WalletNavigation";
import { usePortfolioModalState } from "@/components/wallet/portfolio/hooks/usePortfolioModalState";
import { BacktestingView } from "@/components/wallet/portfolio/views/BacktestingView";
import { DashboardView } from "@/components/wallet/portfolio/views/DashboardView";
import { getRegimeById } from "@/components/wallet/regime/regimeData";
import { WalletManager } from "@/components/WalletManager";
import { useToast } from "@/hooks/useToast";
import { connectWallet } from "@/services/accountService";
import { generateBundleUrl } from "@/services/bundleService";
import type { TabType } from "@/types/portfolio";
import type { DashboardSections } from "@/types/portfolio-progressive";

/** Layout class constants for consistent styling */
const LAYOUT = {
  container:
    "min-h-screen bg-gray-950 flex flex-col font-sans selection:bg-purple-500/30",
  main: "flex-1 flex justify-center p-4 md:p-8",
  content: "w-full max-w-4xl flex flex-col gap-8 min-h-[600px]",
} as const;

interface WalletPortfolioPresenterProps {
  data: WalletPortfolioDataWithDirection;
  userId?: string;
  isEmptyState?: boolean;
  isLoading?: boolean;
  /** Section states for progressive loading */
  sections: DashboardSections;
  headerBanners?: React.ReactNode;
  footerOverlays?: React.ReactNode;
}

export function WalletPortfolioPresenter({
  data,
  userId,
  isEmptyState = false,
  isLoading = false,
  sections,
  headerBanners,
  footerOverlays,
}: WalletPortfolioPresenterProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const currentRegime = getRegimeById(data.currentRegime);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const {
    activeModal,
    isSettingsOpen,
    openModal,
    closeModal,
    openSettings,
    setIsSettingsOpen,
  } = usePortfolioModalState();

  const handleSearch = async (address: string) => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      return;
    }

    try {
      setIsSearching(true);

      // Convert wallet address to userId via backend
      const { user_id: userId } = await connectWallet(trimmedAddress);

      // Generate bundle URL with actual userId
      const bundleUrl = generateBundleUrl(userId);

      // Navigate with Next.js router
      router.push(bundleUrl);
    } catch {
      showToast({
        type: "error",
        title: "Wallet Not Found",
        message:
          "Could not find a portfolio for this wallet address. Please check the address and try again.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  /** Tab view mapping for cleaner conditional rendering */
  const TAB_VIEWS: Record<TabType, React.ReactNode> = {
    dashboard: (
      <DashboardView
        data={data}
        sections={sections}
        currentRegime={currentRegime}
        isEmptyState={isEmptyState}
        isLoading={isLoading}
        onOpenModal={openModal}
        // onSearch is no longer passed to DashboardView for Empty State Hero,
        // as we are using persistent nav search.
      />
    ),
    analytics: userId ? (
      <div data-testid="analytics-content">
        <AnalyticsView userId={userId} />
      </div>
    ) : null,
    backtesting: (
      <div data-testid="backtesting-content">
        <BacktestingView />
      </div>
    ),
  };

  return (
    <div className={LAYOUT.container} data-testid="v22-dashboard">
      {/* Top navigation */}
      <WalletNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWalletManager={() => setIsWalletManagerOpen(true)}
        onOpenSettings={openSettings}
        onSearch={handleSearch}
        showSearch={true}
        isSearching={isSearching}
      />

      {/* Header banners (Bundle-specific: SwitchPrompt, EmailReminder) */}
      {headerBanners}

      {/* Main content */}
      <main className={LAYOUT.main}>
        <div className={LAYOUT.content}>{TAB_VIEWS[activeTab]}</div>
      </main>

      {/* Footer */}
      <Footer
        className="bg-gray-950 border-gray-800/50"
        containerClassName="max-w-4xl"
      />

      <PortfolioModals
        activeModal={activeModal}
        onClose={closeModal}
        data={data}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
      />

      {/* Wallet Manager Modal */}
      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={() => setIsWalletManagerOpen(false)}
        {...(userId && { urlUserId: userId })}
      />

      {/* Footer overlays (Bundle-specific: QuickSwitchFAB) */}
      {footerOverlays}
    </div>
  );
}
