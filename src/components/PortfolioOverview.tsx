"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, TrendingUp } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

import { fadeInUp, SMOOTH_TRANSITION } from "@/lib/animationVariants";
import type { LeverageMetrics } from "@/lib/leverageUtils";
import type { PieChartData } from "@/types/domain/portfolio";
import type { PortfolioState } from "@/types/ui/portfolioState";
import type { BaseComponentProps } from "@/types/ui/ui.types";

import { SCROLLABLE_CONTAINER } from "../constants/design-system";
import { usePortfolioStateHelpers } from "../hooks/usePortfolioState";
import type { CategorySummary } from "../utils/portfolio.utils";
import { AssetCategoriesDetail } from "./AssetCategoriesDetail";
import { PieChart } from "./PieChart";
import { PieChartSkeleton } from "./ui/LoadingSystem";
import { TabButton } from "./ui/TabButton";
import { WalletConnectionPrompt } from "./ui/WalletConnectionPrompt";
import { LeverageBadge } from "./wallet/metrics/LeverageRatioMetric";

type TabType = "assets" | "borrowing";

/** Layout styling constants */
const LAYOUT = {
  container: "glass-morphism rounded-3xl p-6 border border-gray-800",
  desktopGrid: "hidden lg:grid lg:grid-cols-2 lg:h-[500px] gap-8",
  mobileStack: "lg:hidden space-y-6",
  pieChartContainer: "flex justify-center items-start pt-8",
  pieChartMobileContainer: "flex justify-center items-center",
} as const;

interface OverviewTabListProps {
  idSuffix?: string;
  compact?: boolean;
  containerClassName?: string;
  activeTab: TabType;
  assetCount: number;
  debtCount: number;
  onSelectTab: (tab: TabType) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

const BASE_TAB_CONTAINER_CLASSES =
  "flex rounded-lg bg-gray-900/50 p-1 border border-gray-700 shadow-lg";

const OverviewTabList = React.memo(function OverviewTabList({
  idSuffix = "",
  compact = false,
  containerClassName = "",
  activeTab,
  assetCount,
  debtCount,
  onSelectTab,
  onKeyDown,
}: OverviewTabListProps) {
  const containerClasses = containerClassName
    ? `${BASE_TAB_CONTAINER_CLASSES} ${containerClassName}`
    : BASE_TAB_CONTAINER_CLASSES;

  return (
    <div
      className={containerClasses}
      role="tablist"
      aria-label="Portfolio sections"
      onKeyDown={onKeyDown}
    >
      <TabButton
        id={`assets-tab${idSuffix}`}
        label="Assets"
        active={activeTab === "assets"}
        onSelect={() => onSelectTab("assets")}
        icon={TrendingUp}
        badgeCount={assetCount}
        variant="assets"
        compact={compact}
        controls="assets-tabpanel"
      />
      <TabButton
        id={`borrowing-tab${idSuffix}`}
        label="Borrowing"
        active={activeTab === "borrowing"}
        onSelect={() => onSelectTab("borrowing")}
        icon={ArrowDownLeft}
        badgeCount={debtCount}
        variant="borrowing"
        compact={compact}
        controls="borrowing-tabpanel"
      />
    </div>
  );
});

interface PortfolioOverviewProps extends BaseComponentProps {
  portfolioState: PortfolioState;
  categorySummaries: CategorySummary[];
  debtCategorySummaries?: CategorySummary[];
  pieChartData: PieChartData[];
  leverageMetrics?: LeverageMetrics | null;
  renderBalanceDisplay?: () => React.ReactNode;
  title?: string;
  onRetry?: () => void;
  onCategoryClick?: (categoryId: string) => void;
}

export const PortfolioOverview = React.memo<PortfolioOverviewProps>(
  ({
    portfolioState,
    categorySummaries,
    debtCategorySummaries = [],
    pieChartData,
    leverageMetrics,
    title = "Asset Distribution",
    className = "",
    testId,
    onRetry,
    onCategoryClick,
    renderBalanceDisplay,
  }) => {
    // Tab state management
    const [activeTab, setActiveTab] = useState<TabType>("assets");

    // Use portfolio state helpers for consistent logic
    const {
      shouldShowLoading,
      shouldShowConnectPrompt,
      shouldShowNoDataMessage,
      shouldShowPortfolioContent,
      shouldShowError,
      getDisplayTotalValue,
    } = usePortfolioStateHelpers(portfolioState);

    const renderPieChart = (size: number, strokeWidth: number) =>
      shouldShowLoading ? (
        <PieChartSkeleton
          size={size}
          className={`h-[${size}px] w-[${size}px]`}
        />
      ) : (
        <PieChart
          data={pieChartData}
          size={size}
          strokeWidth={strokeWidth}
          totalValue={getDisplayTotalValue() || 0}
          {...(renderBalanceDisplay ? { renderBalanceDisplay } : {})}
        />
      );

    // Get actual counts for tab badges
    const assetCount = useMemo(
      () => categorySummaries.length,
      [categorySummaries]
    );
    const debtCount = useMemo(
      () => debtCategorySummaries.length,
      [debtCategorySummaries]
    );

    const handleTabListKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const order: TabType[] = ["assets", "borrowing"];
          const current = order.indexOf(activeTab);
          const nextIndex =
            e.key === "ArrowRight"
              ? (current + 1) % order.length
              : (current - 1 + order.length) % order.length;
          const nextTab: TabType = order[nextIndex] ?? "assets";
          setActiveTab(nextTab);
        }
      },
      [activeTab]
    );

    const handleTabChange = useCallback((tab: TabType) => {
      setActiveTab(tab);
    }, []);

    const allocationDetailContent = useMemo(
      () => (
        <AssetCategoriesDetail
          categorySummaries={categorySummaries}
          debtCategorySummaries={debtCategorySummaries}
          className="!bg-transparent !border-0 !p-0"
          isLoading={shouldShowLoading}
          error={portfolioState.errorMessage || null}
          {...(onRetry && { onRetry })}
          isRetrying={portfolioState.isRetrying || false}
          activeTab={activeTab}
          {...(onCategoryClick && { onCategoryClick })}
        />
      ),
      [
        categorySummaries,
        debtCategorySummaries,
        shouldShowLoading,
        portfolioState.errorMessage,
        onRetry,
        portfolioState.isRetrying,
        activeTab,
        onCategoryClick,
      ]
    );

    const tabAnnouncement = useMemo(() => {
      return activeTab === "assets"
        ? `Assets tab selected, ${assetCount} categories`
        : `Borrowing tab selected, ${debtCount} categories`;
    }, [activeTab, assetCount, debtCount]);

    return (
      <motion.div
        {...fadeInUp}
        transition={SMOOTH_TRANSITION}
        className={`${LAYOUT.container} ${className}`}
        data-testid={testId || "portfolio-overview"}
      >
        {/* Header with responsive tab navigation */}
        <div className="mb-6">
          {/* Desktop: Title and tabs on same row */}
          <div className="hidden sm:flex items-center justify-between">
            <h3 className="text-xl font-bold gradient-text">{title}</h3>
            <OverviewTabList
              activeTab={activeTab}
              assetCount={assetCount}
              debtCount={debtCount}
              onSelectTab={handleTabChange}
              onKeyDown={handleTabListKeyDown}
            />
          </div>

          {/* Mobile: Title and tabs stacked */}
          <div className="sm:hidden space-y-4">
            <h3 className="text-xl font-bold gradient-text">{title}</h3>
            <OverviewTabList
              idSuffix="-mobile"
              activeTab={activeTab}
              assetCount={assetCount}
              debtCount={debtCount}
              onSelectTab={handleTabChange}
              compact
              containerClassName="w-fit"
              onKeyDown={handleTabListKeyDown}
            />
          </div>
        </div>

        <div className="sr-only" aria-live="polite">
          {tabAnnouncement}
        </div>

        {/* Leverage Ratio Banner - Only shown in Borrowing tab when there's debt */}
        {activeTab === "borrowing" &&
          leverageMetrics &&
          leverageMetrics.hasDebt &&
          (shouldShowPortfolioContent || shouldShowLoading) && (
            <div className="mb-6" data-testid="leverage-ratio-banner">
              <LeverageBadge leverageMetrics={leverageMetrics} />
            </div>
          )}

        {/* Wallet Not Connected State */}
        {shouldShowConnectPrompt && (
          <div className="py-8">
            <WalletConnectionPrompt
              title="Connect Wallet to View Portfolio"
              description="Track your DeFi assets, discover yield opportunities, and optimize your portfolio performance across multiple protocols and chains."
            />
          </div>
        )}

        {/* Error State */}
        {shouldShowError && (
          <div className="py-8 text-center">
            <div className="text-red-400 mb-4">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-medium text-red-300 mb-2">
                Error Loading Portfolio
              </h3>
              <p className="text-sm text-red-400 mb-4">
                {portfolioState.errorMessage}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Connected But No Data State */}
        {shouldShowNoDataMessage && (
          <div className="py-8 text-center">
            <div className="text-gray-400 mb-4">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                Currently no data
              </h3>
              <p className="text-sm text-gray-400">
                Please wait for one day for your portfolio data to be processed
                and displayed.
              </p>
            </div>
          </div>
        )}

        {/* Desktop Layout: Sticky PieChart with Scrollable Details */}
        {(shouldShowPortfolioContent || shouldShowLoading) && (
          <div className={LAYOUT.desktopGrid}>
            {/* Left Column: Sticky PieChart */}
            <div className="sticky top-0">
              <div
                className={LAYOUT.pieChartContainer}
                data-testid="pie-chart-container"
              >
                {renderPieChart(250, 10)}
              </div>
            </div>

            {/* Right Column: Scrollable Details */}
            <div>
              <div
                className={`${SCROLLABLE_CONTAINER.PORTFOLIO_DETAILS} pr-2`}
                data-testid="allocation-list"
              >
                {allocationDetailContent}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Layout: Vertical Stack */}
        {(shouldShowPortfolioContent || shouldShowLoading) && (
          <div className={LAYOUT.mobileStack}>
            <div
              className={LAYOUT.pieChartMobileContainer}
              data-testid="pie-chart-container-mobile"
            >
              {renderPieChart(200, 8)}
            </div>
            <div data-testid="allocation-list-mobile">
              {allocationDetailContent}
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

PortfolioOverview.displayName = "PortfolioOverview";
