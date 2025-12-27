"use client";

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
  const currentRegime = getRegimeById(data.currentRegime);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  const {
    activeModal,
    isSettingsOpen,
    openModal,
    closeModal,
    openSettings,
    setIsSettingsOpen,
  } = usePortfolioModalState();

  const handleSearch = (address: string) => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("userId", trimmedAddress);
    const queryString = params.toString();
    window.location.assign(`/bundle${queryString ? `?${queryString}` : ""}`);
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
      {/* Header banners (Bundle-specific: SwitchPrompt, EmailReminder) */}
      {headerBanners}

      {/* Top navigation */}
      <WalletNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={openSettings}
        onSearch={handleSearch}
        showSearch={true}
      />

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

      {/* Footer overlays (Bundle-specific: QuickSwitchFAB) */}
      {footerOverlays}
    </div>
  );
}
