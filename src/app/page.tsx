"use client";

import { Navigation } from "@/components/Navigation";
import { LoadingState } from "@/components/ui/LoadingState";
import { WalletPortfolio } from "@/components/WalletPortfolio";
import { mockInvestmentOpportunities } from "@/data/mockInvestments";
import { InvestmentOpportunity } from "@/types/investment";
import dynamic from "next/dynamic";
import { ComponentType, useCallback, useState } from "react";
import type { SwapPageProps } from "@/components/SwapPage/SwapPage";

// Dynamic imports for code splitting
const AnalyticsTab: ComponentType<{ categoryFilter?: string | null }> = dynamic(
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

export default function DashboardApp() {
  const [activeTab, setActiveTab] = useState("wallet");
  const [selectedStrategy, setSelectedStrategy] =
    useState<InvestmentOpportunity | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | null
  >(null);

  // Navigation handlers with context awareness
  // Each handler sets the appropriate navigationContext to control SwapPage behavior
  const handleBackToPortfolio = useCallback(() => {
    setSelectedStrategy(null);
  }, []);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      // Reset strategy when switching tabs to enable navigation from SwapPage
      if (selectedStrategy) {
        setSelectedStrategy(null);
      }
    },
    [selectedStrategy]
  );

  const handleAnalyticsClick = useCallback(() => {
    setActiveTab("analytics");
    if (selectedStrategy) {
      setSelectedStrategy(null);
    }
  }, [selectedStrategy]);

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

  const handleOptimizeClick = useCallback(() => {
    // Find the optimize strategy from mock data
    const optimizeStrategy = mockInvestmentOpportunities.find(
      strategy => strategy.id === "optimize-portfolio"
    );
    if (optimizeStrategy) {
      setSelectedStrategy({ ...optimizeStrategy, navigationContext: "invest" });
    }
  }, []);

  const handleZapInClick = useCallback(() => {
    // Find the ZapIn strategy from mock data
    const zapInStrategy = mockInvestmentOpportunities.find(
      strategy => strategy.id === "zap-in"
    );
    if (zapInStrategy) {
      setSelectedStrategy({ ...zapInStrategy, navigationContext: "zapIn" });
    }
  }, []);

  const handleZapOutClick = useCallback(() => {
    // Find the ZapOut strategy from mock data
    const zapOutStrategy = mockInvestmentOpportunities.find(
      strategy => strategy.id === "zap-out"
    );
    if (zapOutStrategy) {
      setSelectedStrategy({ ...zapOutStrategy, navigationContext: "zapOut" });
    }
  }, []);

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
            onAnalyticsClick={handleAnalyticsClick}
            onOptimizeClick={handleOptimizeClick}
            onZapInClick={handleZapInClick}
            onZapOutClick={handleZapOutClick}
            onCategoryClick={handleCategoryClick}
          />
        );
      case "analytics":
        return <AnalyticsTab categoryFilter={selectedCategoryFilter} />;
      case "community":
        return <CommunityTab />;
      case "airdrop":
        return <AirdropTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return (
          <WalletPortfolio
            onAnalyticsClick={handleAnalyticsClick}
            onOptimizeClick={handleOptimizeClick}
            onZapInClick={handleZapInClick}
            onZapOutClick={handleZapOutClick}
            onCategoryClick={handleCategoryClick}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main content */}
      <div className="relative z-10 lg:pl-72">
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
    </div>
  );
}
