"use client";

import { motion } from "framer-motion";
import React from "react";
import { SCROLLABLE_CONTAINER } from "../constants/design-system";
import { AssetCategory, PieChartData } from "../types/portfolio";
import { AssetCategoriesDetail } from "./AssetCategoriesDetail";
import { PieChart } from "./PieChart";
import { WalletConnectionPrompt } from "./ui";

interface PortfolioOverviewProps {
  portfolioData: AssetCategory[];
  pieChartData: PieChartData[]; // Now required - no more fallback logic needed
  totalValue?: number | null; // Optional authoritative total value, can be null
  expandedCategory: string | null;
  onCategoryToggle: (categoryId: string) => void;
  balanceHidden?: boolean;
  title?: string;
  className?: string;
  testId?: string;
  isLoading?: boolean;
  apiError?: string | null;
  renderBalanceDisplay?: () => React.ReactNode;
  onRetry?: () => void;
  isRetrying?: boolean;
  isConnected?: boolean;
}

export const PortfolioOverview = React.memo<PortfolioOverviewProps>(
  ({
    portfolioData,
    pieChartData, // Now required - no more optional fallback
    totalValue,
    expandedCategory,
    onCategoryToggle,
    balanceHidden = false,
    title = "Portfolio Allocation",
    className = "",
    testId,
    isLoading = false,
    apiError = null,
    renderBalanceDisplay,
    onRetry,
    isRetrying = false,
    isConnected = false,
  }) => {
    // Show loading when: 1) explicitly loading, 2) retrying, 3) wallet connected but no data yet
    const showLoadingState =
      isLoading ||
      isRetrying ||
      (isConnected &&
        (!portfolioData || portfolioData.length === 0) &&
        !apiError);

    // Check if we should show empty state (no data and not loading/error)
    const showEmptyState =
      !showLoadingState &&
      !apiError &&
      (!portfolioData ||
        portfolioData.length === 0 ||
        !pieChartData ||
        pieChartData.length === 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-morphism rounded-3xl p-6 border border-gray-800 ${className}`}
        data-testid={testId || "portfolio-overview"}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text">{title}</h3>
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
                  <div className="flex items-center justify-center h-[250px] w-[250px]">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
                  </div>
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
                    {...(totalValue !== undefined &&
                      totalValue !== null && { totalValue })}
                    {...(renderBalanceDisplay && { renderBalanceDisplay })}
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
                  portfolioData={portfolioData || []}
                  expandedCategory={expandedCategory}
                  onCategoryToggle={onCategoryToggle}
                  balanceHidden={balanceHidden}
                  title=""
                  className="!bg-transparent !border-0 !p-0"
                  isLoading={showLoadingState}
                  error={apiError}
                  {...(onRetry && { onRetry })}
                  isRetrying={isRetrying}
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
                <div className="flex items-center justify-center h-[200px] w-[200px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
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
                  {...(totalValue !== undefined &&
                    totalValue !== null && { totalValue })}
                  {...(renderBalanceDisplay && { renderBalanceDisplay })}
                />
              )}
            </div>
            <div data-testid="allocation-list-mobile">
              <AssetCategoriesDetail
                portfolioData={portfolioData || []}
                expandedCategory={expandedCategory}
                onCategoryToggle={onCategoryToggle}
                balanceHidden={balanceHidden}
                title=""
                className="!bg-transparent !border-0 !p-0"
                isLoading={showLoadingState}
                error={apiError}
                {...(onRetry && { onRetry })}
                isRetrying={isRetrying}
              />
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

PortfolioOverview.displayName = "PortfolioOverview";
