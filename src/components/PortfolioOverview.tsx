"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, TrendingUp } from "lucide-react";
import React, { useMemo, useState } from "react";
import { SCROLLABLE_CONTAINER } from "../constants/design-system";
import { PieChartData } from "../types/portfolio";
import { transformPositionsForDisplay } from "../utils/borrowingUtils";
import { CategorySummary } from "../utils/portfolio.utils";
import { AssetCategoriesDetail } from "./AssetCategoriesDetail";
import { PieChart } from "./PieChart";
import { WalletConnectionPrompt } from "./ui";
import { PieChartLoading } from "./ui/UnifiedLoading";

type TabType = "assets" | "borrowing";

export interface PortfolioOverviewProps {
  categorySummaries: CategorySummary[];
  pieChartData: PieChartData[];
  totalValue?: number | null;
  balanceHidden?: boolean;
  title?: string;
  className?: string;
  testId?: string;
  isLoading?: boolean;
  apiError?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  isConnected?: boolean;
}

export const PortfolioOverview = React.memo<PortfolioOverviewProps>(
  ({
    categorySummaries,
    pieChartData,
    totalValue,
    balanceHidden = false,
    title = "Asset Distribution",
    className = "",
    testId,
    isLoading = false,
    apiError = null,
    onRetry,
    isRetrying = false,
    isConnected = false,
  }) => {
    // Tab state management
    const [activeTab, setActiveTab] = useState<TabType>("assets");

    // For now, we'll have empty borrowing data since the unified API doesn't provide it yet
    // This maintains the UI structure for when the API is updated
    const { assetsForDisplay, borrowingPositions } = useMemo(() => {
      // Convert CategorySummary back to legacy format for borrowing utils
      // This is a temporary bridge until API provides borrowing data directly
      const mockPortfolioData = categorySummaries.map(summary => ({
        id: summary.id,
        name: summary.name,
        totalValue: summary.totalValue,
        percentage: summary.percentage,
        color: summary.color,
        change24h: 0, // Not available in new format yet
        assets: [], // Simplified for now
      }));

      return transformPositionsForDisplay(mockPortfolioData);
    }, [categorySummaries]);

    // Show loading when: 1) explicitly loading, 2) retrying, 3) wallet connected but no data yet
    const showLoadingState =
      isLoading ||
      isRetrying ||
      (isConnected &&
        (!categorySummaries || categorySummaries.length === 0) &&
        !apiError);

    // Check if we should show empty state (no data and not loading/error)
    const showEmptyState =
      !showLoadingState &&
      !apiError &&
      (!categorySummaries ||
        categorySummaries.length === 0 ||
        !pieChartData ||
        pieChartData.length === 0);

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
                  {assetsForDisplay.length}
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
                  {borrowingPositions.length}
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
                  {assetsForDisplay.length}
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
                  {borrowingPositions.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {showEmptyState && (
          <div className="py-8">
            <WalletConnectionPrompt
              title="Connect Wallet to View Portfolio"
              description="Track your DeFi assets, discover yield opportunities, and optimize your portfolio performance across multiple protocols and chains."
            />
          </div>
        )}

        {/* Desktop Layout: Sticky PieChart with Scrollable Details */}
        {!showEmptyState && (
          <div className="hidden lg:grid lg:grid-cols-2 lg:h-[500px] gap-8">
            {/* Left Column: Sticky PieChart (50% width like original) */}
            <div className="sticky top-0">
              <div
                className="flex justify-center items-start pt-8"
                data-testid="pie-chart-container"
              >
                {showLoadingState ? (
                  <PieChartLoading size={250} className="h-[250px] w-[250px]" />
                ) : apiError ? (
                  <div className="flex items-center justify-center h-[250px] w-[250px]">
                    <div className="text-center text-red-500">
                      <div className="text-sm">Chart Unavailable</div>
                      <div className="text-xs mt-1 opacity-75">{apiError}</div>
                    </div>
                  </div>
                ) : (
                  <PieChart
                    data={pieChartData}
                    size={250}
                    strokeWidth={10}
                    totalValue={totalValue || 0}
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
                  balanceHidden={balanceHidden}
                  className="!bg-transparent !border-0 !p-0"
                  isLoading={showLoadingState}
                  error={apiError}
                  {...(onRetry && { onRetry })}
                  isRetrying={isRetrying}
                  activeTab={activeTab}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Layout: Vertical Stack */}
        {!showEmptyState && (
          <div className="lg:hidden space-y-6">
            <div
              className="flex justify-center items-center"
              data-testid="pie-chart-container-mobile"
            >
              {showLoadingState ? (
                <PieChartLoading size={200} className="h-[200px] w-[200px]" />
              ) : apiError ? (
                <div className="flex items-center justify-center h-[200px] w-[200px]">
                  <div className="text-center text-red-500">
                    <div className="text-sm">Chart Unavailable</div>
                    <div className="text-xs mt-1 opacity-75">{apiError}</div>
                  </div>
                </div>
              ) : (
                <PieChart
                  data={pieChartData}
                  size={200}
                  strokeWidth={8}
                  totalValue={totalValue || 0}
                />
              )}
            </div>
            <div data-testid="allocation-list-mobile">
              <AssetCategoriesDetail
                categorySummaries={categorySummaries}
                balanceHidden={balanceHidden}
                className="!bg-transparent !border-0 !p-0"
                isLoading={showLoadingState}
                error={apiError}
                {...(onRetry && { onRetry })}
                isRetrying={isRetrying}
                activeTab={activeTab}
              />
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

PortfolioOverview.displayName = "PortfolioOverview";
