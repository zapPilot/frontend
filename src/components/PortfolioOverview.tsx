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
import { WalletConnectionPrompt } from "./ui";
import { PieChartLoading } from "./ui/UnifiedLoading";

type TabType = "assets" | "borrowing";

export interface PortfolioOverviewProps {
  portfolioState: PortfolioState;
  categorySummaries: CategorySummary[];
  debtCategorySummaries?: CategorySummary[];
  pieChartData: PieChartData[];
  balanceHidden?: boolean;
  title?: string;
  className?: string;
  testId?: string;
  onRetry?: () => void;
  onCategoryClick?: (categoryId: string) => void;
}

export const PortfolioOverview = React.memo<PortfolioOverviewProps>(
  ({
    portfolioState,
    categorySummaries,
    debtCategorySummaries = [],
    pieChartData,
    balanceHidden = false,
    title = "Asset Distribution",
    className = "",
    testId,
    onRetry,
    onCategoryClick,
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

    // Get actual counts for tab badges
    const assetCount = categorySummaries.length;
    const debtCount = debtCategorySummaries.length;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-morphism rounded-3xl p-6 border border-gray-800 ${className}`}
        data-testid={testId || "portfolio-overview"}
      >
        {/* Header with responsive tab navigation */}
        <div className="mb-6">
          {/* Desktop: Title and tabs on same row */}
          <div className="hidden sm:flex items-center justify-between">
            <h3 className="text-xl font-bold gradient-text">{title}</h3>

            {/* Always show tabs for now, even though borrowing is empty */}
            <div className="flex rounded-lg bg-gray-900/50 p-1 border border-gray-700 shadow-lg">
              <button
                id="assets-tab"
                onClick={() => setActiveTab("assets")}
                role="tab"
                aria-selected={activeTab === "assets"}
                aria-controls="assets-tabpanel"
                className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 ${
                  activeTab === "assets"
                    ? "bg-blue-600 text-white shadow-lg transform scale-105"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/80 hover:scale-102"
                }`}
              >
                <TrendingUp
                  className={`w-4 h-4 transition-transform duration-300 ${
                    activeTab === "assets" ? "scale-110" : ""
                  }`}
                />
                <span>Assets</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded transition-colors duration-300 ${
                    activeTab === "assets"
                      ? "bg-blue-800 text-blue-100"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {assetCount}
                </span>
              </button>
              <button
                id="borrowing-tab"
                onClick={() => setActiveTab("borrowing")}
                role="tab"
                aria-selected={activeTab === "borrowing"}
                aria-controls="borrowing-tabpanel"
                className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-2 focus-visible:outline-orange-500 focus-visible:outline-offset-2 ${
                  activeTab === "borrowing"
                    ? "bg-orange-600 text-white shadow-lg transform scale-105"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/80 hover:scale-102"
                }`}
              >
                <ArrowDownLeft
                  className={`w-4 h-4 transition-transform duration-300 ${
                    activeTab === "borrowing" ? "scale-110" : ""
                  }`}
                />
                <span>Borrowing</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded transition-colors duration-300 ${
                    activeTab === "borrowing"
                      ? "bg-orange-800 text-orange-100"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {debtCount}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile: Title and tabs stacked */}
          <div className="sm:hidden space-y-4">
            <h3 className="text-xl font-bold gradient-text">{title}</h3>

            <div className="flex rounded-lg bg-gray-900/50 p-1 border border-gray-700 w-fit shadow-lg">
              <button
                id="assets-tab-mobile"
                onClick={() => setActiveTab("assets")}
                role="tab"
                aria-selected={activeTab === "assets"}
                aria-controls="assets-tabpanel"
                className={`relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 ${
                  activeTab === "assets"
                    ? "bg-blue-600 text-white shadow-lg transform scale-105"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/80 hover:scale-102"
                }`}
              >
                <TrendingUp
                  className={`w-4 h-4 transition-transform duration-300 ${
                    activeTab === "assets" ? "scale-110" : ""
                  }`}
                />
                <span>Assets</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded transition-colors duration-300 ${
                    activeTab === "assets"
                      ? "bg-blue-800 text-blue-100"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {assetCount}
                </span>
              </button>
              <button
                id="borrowing-tab-mobile"
                onClick={() => setActiveTab("borrowing")}
                role="tab"
                aria-selected={activeTab === "borrowing"}
                aria-controls="borrowing-tabpanel"
                className={`relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-2 focus-visible:outline-orange-500 focus-visible:outline-offset-2 ${
                  activeTab === "borrowing"
                    ? "bg-orange-600 text-white shadow-lg transform scale-105"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/80 hover:scale-102"
                }`}
              >
                <ArrowDownLeft
                  className={`w-4 h-4 transition-transform duration-300 ${
                    activeTab === "borrowing" ? "scale-110" : ""
                  }`}
                />
                <span>Borrowing</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded transition-colors duration-300 ${
                    activeTab === "borrowing"
                      ? "bg-orange-800 text-orange-100"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {debtCount}
                </span>
              </button>
            </div>
          </div>
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
        {shouldShowPortfolioContent && (
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
                  balanceHidden={balanceHidden}
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
        {shouldShowPortfolioContent && (
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
                />
              )}
            </div>
            <div data-testid="allocation-list-mobile">
              <AssetCategoriesDetail
                categorySummaries={categorySummaries}
                debtCategorySummaries={debtCategorySummaries}
                balanceHidden={balanceHidden}
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
