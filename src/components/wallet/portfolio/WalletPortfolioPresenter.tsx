"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import { queryKeys } from "@/hooks/queries";
import { useEtlJobPolling } from "@/hooks/wallet";
import { useToast } from "@/providers/ToastProvider";
import { connectWallet, getUserWallets } from "@/services/accountService";
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
  /** Whether user is viewing their own bundle (enables wallet actions) */
  isOwnBundle?: boolean;
  isEmptyState?: boolean;
  isLoading?: boolean;
  /** Section states for progressive loading */
  sections: DashboardSections;
  headerBanners?: React.ReactNode;
  footerOverlays?: React.ReactNode;
  onRefresh?: () => void;
}

export function WalletPortfolioPresenter({
  data,
  userId,
  isOwnBundle = true,
  isEmptyState = false,
  isLoading = false,
  sections,
  headerBanners,
  footerOverlays,
  onRefresh,
}: WalletPortfolioPresenterProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const currentRegime = getRegimeById(data.currentRegime);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // ETL Polling for new wallets
  const { state: etlState, triggerEtl, reset: resetEtl } = useEtlJobPolling();
  const [hasTriggeredEtl, setHasTriggeredEtl] = useState(false);

  // Trigger ETL if empty state and user exists
  useEffect(() => {
    if (isEmptyState && userId && !hasTriggeredEtl && !isLoading) {
      console.log("DEBUG: Init ETL check for user:", userId);
      const initEtl = async () => {
        try {
          const wallets = await getUserWallets(userId);
          console.log("DEBUG: User wallets:", wallets);
          if (wallets.length > 0) {
            // Trigger for primary wallet (first one)
            const wallet = wallets[0];
            if (wallet) {
              console.log("DEBUG: Triggering ETL for:", wallet.wallet);
              await triggerEtl(userId, wallet.wallet);
              setHasTriggeredEtl(true);
            }
          }
        } catch (error) {
          // Silent fail - will show empty state
          console.error("Failed to init ETL", error);
        }
      };
      void initEtl();
    }
  }, [isEmptyState, userId, hasTriggeredEtl, isLoading, triggerEtl]);

  // Handle ETL auto-refresh
  useEffect(() => {
    if (etlState.status !== "completed") {
      return;
    }

    // Invalidate portfolio query cache to force fresh data
    if (userId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.landingPage(userId),
      });
    }

    // Trigger refetch
    onRefresh?.();

    // Delay reset to allow refetch to complete
    const timer = setTimeout(() => {
      resetEtl();
    }, 1000);

    return () => clearTimeout(timer);
  }, [etlState.status, onRefresh, resetEtl, userId, queryClient]);

  const {
    activeModal,
    isSettingsOpen,
    openModal,
    closeModal,
    openSettings,
    setIsSettingsOpen,
  } = usePortfolioModalState();

  const handleSearch = async (address: string) => {
    console.log("DEBUG: handleSearch called with:", address);
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      console.log("DEBUG: Empty address");
      return;
    }

    try {
      setIsSearching(true);
      console.log("DEBUG: Calling connectWallet...");

      // Convert wallet address to userId via backend
      const response = await connectWallet(trimmedAddress);
      console.log("DEBUG: connectWallet response:", response);
      const { user_id: userId } = response;

      // Generate bundle URL with actual userId
      const bundleUrl = generateBundleUrl(userId);
      console.log("DEBUG: Navigating to:", bundleUrl);

      // Navigate with Next.js router
      router.push(bundleUrl);
    } catch (error) {
      console.error("DEBUG: handleSearch error:", error);
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
        isOwnBundle={isOwnBundle}
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

  // Show loading state during ETL processing
  if (
    etlState.isLoading ||
    (isEmptyState &&
      hasTriggeredEtl &&
      ["pending", "processing"].includes(etlState.status))
  ) {
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
