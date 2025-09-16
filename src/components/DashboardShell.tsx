"use client";

import { Navigation } from "@/components/Navigation";
import type { SwapPageProps } from "@/components/SwapPage/SwapPage";
import { LoadingState } from "@/components/ui/LoadingState";
import { WalletPortfolio } from "@/components/WalletPortfolio";
import { Z_INDEX } from "@/constants/design-system";
import { mockInvestmentOpportunities } from "@/data/mockInvestments";
import { InvestmentOpportunity } from "@/types/investment";
import dynamic from "next/dynamic";
import { ComponentType, ReactNode, useCallback, useState } from "react";
import { CategoryFilterProvider } from "@/contexts/CategoryFilterContext";

// Dynamic imports for code splitting
const AnalyticsTab: ComponentType<{
  urlUserId?: string | undefined;
  categoryFilter?: string | null;
}> = dynamic(
  () =>
    import("@/components/AnalyticsTab").then(mod => ({
      default: mod.AnalyticsTab,
    })),
  {
    loading: () => (
      <LoadingState
        variant="spinner"
        size="lg"
        message="Loading Analytics..."
        className="min-h-96"
      />
    ),
  }
);

const CommunityTab: ComponentType = dynamic(
  () =>
    import("@/components/CommunityTab").then(mod => ({
      default: mod.CommunityTab,
    })),
  {
    loading: () => (
      <LoadingState
        variant="spinner"
        size="lg"
        message="Loading Community..."
        className="min-h-96"
      />
    ),
  }
);

const AirdropTab: ComponentType = dynamic(
  () =>
    import("@/components/AirdropTab").then(mod => ({
      default: mod.AirdropTab,
    })),
  {
    loading: () => (
      <LoadingState
        variant="spinner"
        size="lg"
        message="Loading Airdrop..."
        className="min-h-96"
      />
    ),
  }
);

const SettingsTab: ComponentType = dynamic(
  () =>
    import("@/components/SettingsTab").then(mod => ({
      default: mod.SettingsTab,
    })),
  {
    loading: () => (
      <LoadingState
        variant="spinner"
        size="lg"
        message="Loading Settings..."
        className="min-h-96"
      />
    ),
  }
);

const SwapPage: ComponentType<SwapPageProps> = dynamic(
  () =>
    import("@/components/SwapPage").then(mod => ({ default: mod.SwapPage })),
  {
    loading: () => (
      <LoadingState
        variant="spinner"
        size="lg"
        message="Loading Swap Interface..."
        className="min-h-96"
      />
    ),
  }
);

interface DashboardShellProps {
  urlUserId?: string;
  isOwnBundle?: boolean;
  bundleUserName?: string;
  bundleUrl?: string;
  headerBanners?: ReactNode;
  footerOverlays?: ReactNode;
  pendingState?: { isPending: boolean; message?: string };
}

export function DashboardShell({
  urlUserId,
  isOwnBundle,
  bundleUserName,
  bundleUrl,
  headerBanners,
  footerOverlays,
  pendingState,
}: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState("wallet");
  const [selectedStrategy, setSelectedStrategy] =
    useState<InvestmentOpportunity | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | null
  >(null);

  const handleBackToPortfolio = useCallback(() => {
    setSelectedStrategy(null);
  }, []);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      if (selectedStrategy) {
        setSelectedStrategy(null);
      }
    },
    [selectedStrategy]
  );

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      setSelectedCategoryFilter(categoryId);
      setActiveTab("analytics");
      if (selectedStrategy) {
        setSelectedStrategy(null);
      }
    },
    [selectedStrategy]
  );

  const getOpportunity = useCallback(
    (id: string) =>
      mockInvestmentOpportunities.find(strategy => strategy.id === id) || null,
    []
  );

  const handleOptimizeClick = useCallback(() => {
    const strategy = getOpportunity("optimize-portfolio");
    if (strategy) {
      setSelectedStrategy({ ...strategy, navigationContext: "invest" });
    }
  }, [getOpportunity]);

  const handleZapInClick = useCallback(() => {
    const strategy = getOpportunity("zap-in");
    if (strategy) {
      setSelectedStrategy({ ...strategy, navigationContext: "zapIn" });
    }
  }, [getOpportunity]);

  const handleZapOutClick = useCallback(() => {
    const strategy = getOpportunity("zap-out");
    if (strategy) {
      setSelectedStrategy({ ...strategy, navigationContext: "zapOut" });
    }
  }, [getOpportunity]);

  const renderTabContent = () => {
    if (selectedStrategy) {
      return (
        <SwapPage strategy={selectedStrategy} onBack={handleBackToPortfolio} />
      );
    }

    switch (activeTab) {
      case "wallet":
        return (
          <WalletPortfolio
            {...(urlUserId && { urlUserId })}
            onOptimizeClick={handleOptimizeClick}
            onZapInClick={handleZapInClick}
            onZapOutClick={handleZapOutClick}
            onCategoryClick={handleCategoryClick}
            {...(typeof isOwnBundle !== "undefined" && { isOwnBundle })}
            {...(bundleUserName && { bundleUserName })}
            {...(bundleUrl && { bundleUrl })}
          />
        );
      case "analytics":
        return (
          <AnalyticsTab
            urlUserId={urlUserId}
            categoryFilter={selectedCategoryFilter}
          />
        );
      case "community":
        return <CommunityTab />;
      case "airdrop":
        return <AirdropTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return (
          <WalletPortfolio
            {...(urlUserId && { urlUserId })}
            onOptimizeClick={handleOptimizeClick}
            onZapInClick={handleZapInClick}
            onZapOutClick={handleZapOutClick}
            onCategoryClick={handleCategoryClick}
            {...(typeof isOwnBundle !== "undefined" && { isOwnBundle })}
            {...(bundleUserName && { bundleUserName })}
            {...(bundleUrl && { bundleUrl })}
          />
        );
    }
  };

  // While redirecting (e.g., from root to /bundle), avoid mounting heavy components
  if (pendingState?.isPending) {
    return (
      <div className="min-h-screen bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />
        <div
          className={`relative ${Z_INDEX.CONTENT} flex items-center justify-center h-screen`}
        >
          <LoadingState
            variant="spinner"
            size="lg"
            message={pendingState.message || "Loading..."}
          />
        </div>
      </div>
    );
  }

  return (
    <CategoryFilterProvider
      value={{
        selectedCategoryId: selectedCategoryFilter,
        setSelectedCategoryId: setSelectedCategoryFilter,
        clearCategoryFilter: () => setSelectedCategoryFilter(null),
      }}
    >
      <div className="min-h-screen bg-gray-950 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />

        {/* Navigation */}
        <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Main content */}
        <div className={`relative ${Z_INDEX.CONTENT} lg:pl-72`}>
          {/* Header banners (optional) */}
          {headerBanners}

          {/* Mobile header spacing */}
          <div className="lg:hidden h-16" />

          {/* Desktop header spacing */}
          <div className="hidden lg:block h-16" />

          <main className="px-4 py-8 lg:px-8 pb-20 lg:pb-8">
            <div className="max-w-7xl mx-auto">{renderTabContent()}</div>
          </main>

          {/* Mobile bottom nav spacing */}
          <div className="lg:hidden h-20" />
        </div>

        {/* Footer overlays (optional) */}
        {footerOverlays}
      </div>
    </CategoryFilterProvider>
  );
}
