"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { Footer } from "@/components/Footer/Footer";
import { InitialDataLoadingState } from "@/components/wallet/InitialDataLoadingState";
import { AnalyticsView } from "@/components/wallet/portfolio/analytics";
import { WalletNavigation } from "@/components/wallet/portfolio/components/navigation";
import { usePortfolioModalState } from "@/components/wallet/portfolio/hooks/usePortfolioModalState";
import { PortfolioModals } from "@/components/wallet/portfolio/modals";
import { BacktestingView } from "@/components/wallet/portfolio/views/BacktestingView";
import { DashboardView } from "@/components/wallet/portfolio/views/DashboardView";
import { getRegimeById } from "@/components/wallet/regime/regimeData";
import { WalletManager } from "@/components/WalletManager";
import type { EtlJobPollingState } from "@/hooks/wallet";
import { useToast } from "@/providers/ToastProvider";
import { connectWallet } from "@/services/accountService";
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
  /** Whether user is viewing their own bundle (enables wallet actions) */
  isOwnBundle?: boolean;
  isEmptyState?: boolean;
  isLoading?: boolean;
  /** ETL job polling state (from DashboardShell) */
  etlState: EtlJobPollingState;
  /** Section states for progressive loading */
  sections: DashboardSections;
  headerBanners?: React.ReactNode;
  footerOverlays?: React.ReactNode;
}

export function WalletPortfolioPresenter({
  data,
  userId,
  isOwnBundle = true,
  isEmptyState = false,
  isLoading = false,
  etlState,
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
  const pendingSearchCountRef = useRef(0);
  const [showNewWalletLoading, setShowNewWalletLoading] = useState(false);

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

    // Guard against multiple overlapping searches (e.g. rapid submits) so the
    // searching indicator doesn't flicker off while a later request is pending.
    pendingSearchCountRef.current += 1;
    if (pendingSearchCountRef.current === 1) {
      setIsSearching(true);
    }

    try {
      // Convert wallet address to userId via backend
      const response = await connectWallet(trimmedAddress);

      const {
        user_id: searchedUserId,
        etl_job: etlJob,
        is_new_user: searchedIsNewUser,
      } = response;

      const searchParams = new URLSearchParams({ userId: searchedUserId });
      if (etlJob?.job_id) {
        searchParams.set("etlJobId", etlJob.job_id);
      }
      // Pass isNewUser flag so the bundle page knows to show loading state
      if (searchedIsNewUser) {
        searchParams.set("isNewUser", "true");
      }
      const bundleUrl = `/bundle?${searchParams.toString()}`;

      // Navigate with Next.js router
      router.push(bundleUrl);
    } catch (error) {
      // More accurate error messaging based on error type
      // connectWallet creates new users, so "Wallet Not Found" is misleading
      const isValidationError =
        error instanceof Error &&
        (error.message.includes("Invalid wallet") ||
          error.message.includes("42-character"));

      if (isValidationError) {
        showToast({
          type: "error",
          title: "Invalid Address",
          message: "Please enter a valid 42-character Ethereum address.",
        });
      } else {
        // For connection errors, show the loading state
        setShowNewWalletLoading(true);
      }
    } finally {
      pendingSearchCountRef.current = Math.max(
        0,
        pendingSearchCountRef.current - 1
      );
      if (pendingSearchCountRef.current === 0) {
        setIsSearching(false);
      }
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
        isOwnBundle={isOwnBundle}
        isLoading={isLoading}
        onOpenModal={openModal}
        userId={userId}
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

  // Determine if ETL loading screen should be shown
  const isEtlInProgress = ["pending", "processing", "completing"].includes(
    etlState.status
  );

  const shouldShowEtlLoading = isEtlInProgress || etlState.isLoading;

  if (showNewWalletLoading) {
    return <InitialDataLoadingState status="pending" />;
  }

  if (shouldShowEtlLoading) {
    return <InitialDataLoadingState status={etlState.status} />;
  }

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
        isSearching={isSearching || etlState.isLoading || isEtlInProgress}
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
