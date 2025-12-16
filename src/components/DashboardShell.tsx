"use client";

import dynamic from "next/dynamic";
import { ComponentType, ReactNode, useCallback, useState } from "react";

import { AnalyticsTab } from "@/components/AnalyticsTab";
import { Navigation } from "@/components/Navigation";
import type { SwapPageProps } from "@/components/SwapPage/SwapPage";
import { LoadingState } from "@/components/ui/LoadingSystem";
import { WalletPortfolio } from "@/components/WalletPortfolio";
import { GRADIENTS, Z_INDEX } from "@/constants/design-system";
import { CategoryFilterProvider } from "@/contexts/CategoryFilterContext";
import {
  InvestmentOpportunity,
  type NavigationContext,
} from "@/types/domain/investment";

// Factory function for dynamic loading components
const createLoadingComponent = (message: string) => {
  const LoadingComponent = () => (
    <LoadingState
      variant="spinner"
      size="lg"
      message={message}
      className="min-h-96"
    />
  );
  LoadingComponent.displayName = `DynamicLoading(${message})`;
  return LoadingComponent;
};

const CommunityTab: ComponentType = dynamic(
  async () => {
    const mod = await import("@/components/CommunityTab");
    return { default: mod.CommunityTab };
  },
  { loading: createLoadingComponent("Loading Community...") }
);

const AirdropTab: ComponentType = dynamic(
  async () => {
    const mod = await import("@/components/AirdropTab");
    return { default: mod.AirdropTab };
  },
  { loading: createLoadingComponent("Loading Airdrop...") }
);

const SettingsTab: ComponentType = dynamic(
  async () => {
    const mod = await import("@/components/SettingsTab");
    return { default: mod.SettingsTab };
  },
  { loading: createLoadingComponent("Loading Settings...") }
);

const SwapPage: ComponentType<SwapPageProps> = dynamic(
  async () => {
    const mod = await import("@/components/SwapPage");
    return { default: mod.SwapPage };
  },
  { loading: createLoadingComponent("Loading Swap Interface...") }
);

type StrategyPreset = Omit<InvestmentOpportunity, "navigationContext">;

const STRATEGY_PRESETS: Record<
  "optimize-portfolio" | "zap-in" | "zap-out",
  StrategyPreset
> = {
  "optimize-portfolio": {
    id: "optimize-portfolio",
    name: "Portfolio Optimization",
    apr: 0,
    risk: "Medium",
    category: "Portfolio",
    description:
      "Optimize allocations across your positions for balanced performance.",
    tvl: "$0",
    color: "#8B5CF6",
  },
  "zap-in": {
    id: "zap-in",
    name: "ZapIn Strategy",
    apr: 0,
    risk: "Medium",
    category: "Zap",
    description:
      "Deploy capital into curated strategies in a single transaction.",
    tvl: "$0",
    color: "#10B981",
  },
  "zap-out": {
    id: "zap-out",
    name: "ZapOut Strategy",
    apr: 0,
    risk: "Medium",
    category: "Zap",
    description:
      "Exit positions efficiently while minimizing transaction steps.",
    tvl: "$0",
    color: "#F59E0B",
  },
};

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

  const selectStrategyPreset = useCallback(
    (
      presetId: keyof typeof STRATEGY_PRESETS,
      navigationContext: NavigationContext
    ) => {
      setSelectedStrategy({
        ...STRATEGY_PRESETS[presetId],
        navigationContext,
      });
    },
    []
  );

  const handleOptimizeClick = useCallback(() => {
    selectStrategyPreset("optimize-portfolio", "invest");
  }, [selectStrategyPreset]);

  const handleZapInClick = useCallback(() => {
    selectStrategyPreset("zap-in", "zapIn");
  }, [selectStrategyPreset]);

  const handleZapOutClick = useCallback(() => {
    selectStrategyPreset("zap-out", "zapOut");
  }, [selectStrategyPreset]);

  const renderTabContent = () => {
    if (selectedStrategy) {
      return (
        <SwapPage strategy={selectedStrategy} onBack={handleBackToPortfolio} />
      );
    }

    switch (activeTab) {
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
      case "wallet":
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
        <div
          className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS.BACKGROUND}`}
        />
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
        <div
          className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS.BACKGROUND}`}
        />

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
