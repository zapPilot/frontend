"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, TrendingUp } from "lucide-react";
import React, { useState } from "react";
import { SCROLLABLE_CONTAINER } from "../constants/design-system";
import { usePortfolioStateHelpers } from "../hooks/usePortfolioState";
import { PieChartData } from "../types/portfolio";
import { PortfolioState } from "../types/portfolioState";
import { CategorySummary } from "../utils/portfolio.utils";
import { AssetCategoriesDetail } from "./AssetCategoriesDetail";
import { PieChart } from "./PieChart";
import { WalletConnectionPrompt } from "./ui/WalletConnectionPrompt";
import { PieChartLoading } from "./ui/LoadingSystem";
import { TabButton } from "./ui/TabButton";
import { useBalanceVisibility } from "../contexts/BalanceVisibilityContext";
import { BaseComponentProps } from "../types/ui.types";
import { fadeInUp, SMOOTH_TRANSITION } from "@/lib/animationVariants";

type TabType = "assets" | "borrowing";

export interface PortfolioOverviewProps extends BaseComponentProps {
  portfolioState: PortfolioState;
  categorySummaries: CategorySummary[];
  debtCategorySummaries?: CategorySummary[];
  pieChartData: PieChartData[];
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
    title = "Asset Distribution",
    className = "",
    testId,
    onRetry,
    onCategoryClick,
    renderBalanceDisplay,
  }) => {
    // Tab state management
    const [activeTab, setActiveTab] = useState<TabType>("assets");
    useBalanceVisibility();

    // Use portfolio state helpers for consistent logic
    const {
      shouldShowLoading,
      shouldShowConnectPrompt,
      shouldShowNoDataMessage,
      shouldShowPortfolioContent,
      shouldShowError,
      getDisplayTotalValue,
    } = usePortfolioStateHelpers(portfolioState);

    // Get actual counts for tab badges
    const assetCount = categorySummaries.length;
    const debtCount = debtCategorySummaries.length;
    const handleTabListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
    };

    return (
      <motion.div
        {...fadeInUp}
        transition={SMOOTH_TRANSITION}
        className={`glass-morphism rounded-3xl p-6 border border-gray-800 ${className}`}
        data-testid={testId || "portfolio-overview"}
      >
        {/* Header with responsive tab navigation */}
        <div className="mb-6">
          {/* Desktop: Title and tabs on same row */}
          <div className="hidden sm:flex items-center justify-between">
            <h3 className="text-xl font-bold gradient-text">{title}</h3>
            <div
              className="flex rounded-lg bg-gray-900/50 p-1 border border-gray-700 shadow-lg"
              role="tablist"
              aria-label="Portfolio sections"
              onKeyDown={handleTabListKeyDown}
            >
              <TabButton
                id="assets-tab"
                label="Assets"
                active={activeTab === "assets"}
                onSelect={() => setActiveTab("assets")}
                icon={TrendingUp}
                badgeCount={assetCount}
                variant="assets"
                controls="assets-tabpanel"
              />
              <TabButton
                id="borrowing-tab"
                label="Borrowing"
                active={activeTab === "borrowing"}
                onSelect={() => setActiveTab("borrowing")}
                icon={ArrowDownLeft}
                badgeCount={debtCount}
                variant="borrowing"
                controls="borrowing-tabpanel"
              />
            </div>
          </div>

          {/* Mobile: Title and tabs stacked */}
          <div className="sm:hidden space-y-4">
            <h3 className="text-xl font-bold gradient-text">{title}</h3>
            <div
              className="flex rounded-lg bg-gray-900/50 p-1 border border-gray-700 w-fit shadow-lg"
              role="tablist"
              aria-label="Portfolio sections"
              onKeyDown={handleTabListKeyDown}
            >
              <TabButton
                id="assets-tab-mobile"
                label="Assets"
                active={activeTab === "assets"}
                onSelect={() => setActiveTab("assets")}
                icon={TrendingUp}
                badgeCount={assetCount}
                variant="assets"
                compact
                controls="assets-tabpanel"
              />
              <TabButton
                id="borrowing-tab-mobile"
                label="Borrowing"
                active={activeTab === "borrowing"}
                onSelect={() => setActiveTab("borrowing")}
                icon={ArrowDownLeft}
                badgeCount={debtCount}
                variant="borrowing"
                compact
                controls="borrowing-tabpanel"
              />
            </div>
          </div>
        </div>

        <div className="sr-only" aria-live="polite">
          {activeTab === "assets"
            ? `Assets tab selected, ${assetCount} categories`
            : `Borrowing tab selected, ${debtCount} categories`}
        </div>

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
          <div className="hidden lg:grid lg:grid-cols-2 lg:h-[500px] gap-8">
            {/* Left Column: Sticky PieChart (50% width like original) */}
            <div className="sticky top-0">
              <div
                className="flex justify-center items-start pt-8"
                data-testid="pie-chart-container"
              >
                {shouldShowLoading ? (
                  <PieChartLoading size={250} className="h-[250px] w-[250px]" />
                ) : (
                  <PieChart
                    data={pieChartData}
                    size={250}
                    strokeWidth={10}
                    totalValue={getDisplayTotalValue() || 0}
                    {...(renderBalanceDisplay ? { renderBalanceDisplay } : {})}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Scrollable Details (50% width like original) */}
            <div>
              <div
                className={`${SCROLLABLE_CONTAINER.PORTFOLIO_DETAILS} pr-2`}
                data-testid="allocation-list"
              >
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
              </div>
            </div>
          </div>
        )}

        {/* Mobile Layout: Vertical Stack */}
        {(shouldShowPortfolioContent || shouldShowLoading) && (
          <div className="lg:hidden space-y-6">
            <div
              className="flex justify-center items-center"
              data-testid="pie-chart-container-mobile"
            >
              {shouldShowLoading ? (
                <PieChartLoading size={200} className="h-[200px] w-[200px]" />
              ) : (
                <PieChart
                  data={pieChartData}
                  size={200}
                  strokeWidth={8}
                  totalValue={getDisplayTotalValue() || 0}
                  {...(renderBalanceDisplay ? { renderBalanceDisplay } : {})}
                />
              )}
            </div>
            <div data-testid="allocation-list-mobile">
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
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

PortfolioOverview.displayName = "PortfolioOverview";
