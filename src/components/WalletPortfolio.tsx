"use client";

import { logger } from "@/utils/logger";
import dynamic from "next/dynamic";
import { ComponentType, useMemo } from "react";
import { useUser } from "../contexts/UserContext";
import { useLandingPageData } from "../hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../hooks/usePortfolio";
import { useWalletModal } from "../hooks/useWalletModal";
import { createCategorySummaries } from "../utils/portfolio.utils";
import { AssetCategoriesDetail } from "./AssetCategoriesDetail";
import { ErrorBoundary } from "./errors/ErrorBoundary";
import { PieChart } from "./PieChart";
import { GlassCard } from "./ui";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { WalletActions } from "./wallet/WalletActions";
import { WalletHeader } from "./wallet/WalletHeader";
import { WalletMetrics } from "./wallet/WalletMetrics";

// Import component props interfaces for proper typing
import type { WalletManagerProps } from "./WalletManager";

const WalletManager: ComponentType<WalletManagerProps> = dynamic(
  () => import("./WalletManager").then(mod => ({ default: mod.WalletManager })),
  {
    loading: () => null, // Modal doesn't need loading state when closed
  }
);

const walletPortfolioLogger = logger.createContextLogger("WalletPortfolio");

interface WalletPortfolioProps {
  onAnalyticsClick?: (() => void) | undefined;
  onOptimizeClick?: (() => void) | undefined;
  onZapInClick?: (() => void) | undefined;
  onZapOutClick?: (() => void) | undefined;
}

export function WalletPortfolio({
  onAnalyticsClick,
  onOptimizeClick,
  onZapInClick,
  onZapOutClick,
}: WalletPortfolioProps = {}) {
  // Get user data for landing page
  const { userInfo, isConnected } = useUser();

  // Unified data fetching - single API call for all landing page data
  const landingPageQuery = useLandingPageData(userInfo?.userId);
  const landingPageData = landingPageQuery.data;

  // Transform landing page data for pie chart and category summaries
  const { pieChartData, categorySummaries, portfolioMetrics } = useMemo(() => {
    if (!landingPageData) {
      return {
        pieChartData: null,
        categorySummaries: [],
        portfolioMetrics: null,
      };
    }

    // Transform pre-formatted pie chart categories to PieChartData format
    const categories = landingPageData.pie_chart_categories;
    const totalValue = landingPageData.total_net_usd;

    const transformedPieChartData = [
      {
        label: "Bitcoin",
        value: categories.btc,
        percentage: totalValue > 0 ? (categories.btc / totalValue) * 100 : 0,
        color: "#F7931A", // Bitcoin orange
      },
      {
        label: "Ethereum",
        value: categories.eth,
        percentage: totalValue > 0 ? (categories.eth / totalValue) * 100 : 0,
        color: "#627EEA", // Ethereum blue
      },
      {
        label: "Stablecoins",
        value: categories.stablecoins,
        percentage:
          totalValue > 0 ? (categories.stablecoins / totalValue) * 100 : 0,
        color: "#26A69A", // Teal for stable
      },
      {
        label: "Others",
        value: categories.others,
        percentage: totalValue > 0 ? (categories.others / totalValue) * 100 : 0,
        color: "#AB47BC", // Purple for others
      },
    ].filter(item => item.value > 0); // Only show categories with value

    // Create category summaries for AssetCategoriesDetail
    const summaries = createCategorySummaries(
      landingPageData.pool_details || [],
      categories,
      totalValue
    );

    const transformedMetrics = {
      totalValue: landingPageData.total_net_usd,
      totalChange24h: 0, // Not available from unified API yet
      totalChangePercentage: 0, // Not available from unified API yet
      annualAPR: landingPageData.weighted_apr,
      monthlyReturn: landingPageData.estimated_monthly_income,
    };

    return {
      pieChartData:
        transformedPieChartData.length > 0 ? transformedPieChartData : null,
      categorySummaries: summaries,
      portfolioMetrics: transformedMetrics,
    };
  }, [landingPageData]);

  // Portfolio UI state management (simplified since we have pre-formatted data)
  const {
    balanceHidden,
    expandedCategory,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
  } = usePortfolio([]);

  // Wallet modal state
  const {
    isOpen: isWalletManagerOpen,
    openModal: openWalletManager,
    closeModal: closeWalletManager,
  } = useWalletModal();

  // Navigation handler for "View All" category button
  const handleViewAllCategory = () => {
    // This would typically navigate to analytics tab with category filter
    // For now, we'll trigger the analytics click with a category parameter
    if (onAnalyticsClick) {
      onAnalyticsClick();
      // TODO: In a real app, you'd pass the categoryId to the analytics tab
      // categoryId could be used for filtering: btc, eth, stablecoins, others
    }
  };

  return (
    <ErrorBoundary
      onError={error =>
        walletPortfolioLogger.error("WalletPortfolio Error", error)
      }
      resetKeys={[
        userInfo?.userId || "no-user",
        isConnected ? "connected" : "disconnected",
      ]}
    >
      <div className="space-y-6">
        {/* Wallet Header */}
        <ErrorBoundary
          onError={error =>
            walletPortfolioLogger.error("WalletHeader Error", error)
          }
        >
          <GlassCard>
            <WalletHeader
              onAnalyticsClick={onAnalyticsClick}
              onWalletManagerClick={openWalletManager}
              onToggleBalance={toggleBalanceVisibility}
              balanceHidden={balanceHidden}
            />

            <WalletMetrics
              totalValue={landingPageData?.total_net_usd || null}
              balanceHidden={balanceHidden}
              isLoading={landingPageQuery.isLoading}
              error={landingPageQuery.error?.message || null}
              portfolioChangePercentage={
                portfolioMetrics?.totalChangePercentage || 0
              }
              isConnected={isConnected}
              userId={userInfo?.userId || null}
            />

            <WalletActions
              onZapInClick={onZapInClick}
              onZapOutClick={onZapOutClick}
              onOptimizeClick={onOptimizeClick}
            />
          </GlassCard>
        </ErrorBoundary>

        {/* Asset Distribution */}
        <ErrorBoundary
          onError={error =>
            walletPortfolioLogger.error("AssetDistribution Error", error)
          }
        >
          <GlassCard>
            <div className="p-6">
              <h3 className="text-xl font-bold gradient-text mb-6">
                Asset Distribution
              </h3>

              {/* Pie Chart */}
              <div className="mb-6">
                {landingPageQuery.isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : landingPageQuery.error ? (
                  <div className="text-center p-8 text-red-400">
                    Error loading chart: {landingPageQuery.error.message}
                  </div>
                ) : (
                  <PieChart
                    data={pieChartData || []}
                    totalValue={landingPageData?.total_net_usd || 0}
                  />
                )}
              </div>

              {/* Category Summaries */}
              <AssetCategoriesDetail
                categorySummaries={categorySummaries}
                expandedCategory={expandedCategory}
                onCategoryToggle={toggleCategoryExpansion}
                onViewAllClick={handleViewAllCategory}
                balanceHidden={balanceHidden}
                isLoading={landingPageQuery.isLoading}
                error={landingPageQuery.error?.message || null}
                onRetry={landingPageQuery.refetch}
                isRetrying={landingPageQuery.isRefetching}
              />
            </div>
          </GlassCard>
        </ErrorBoundary>

        {/* Wallet Manager Modal */}
        <ErrorBoundary
          onError={error =>
            walletPortfolioLogger.error("WalletManager Error", error)
          }
        >
          <WalletManager
            isOpen={isWalletManagerOpen}
            onClose={closeWalletManager}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
