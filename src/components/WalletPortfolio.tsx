"use client";

import { logger } from "@/utils/logger";
import dynamic from "next/dynamic";
import { ComponentType, useMemo } from "react";
import { useUser } from "../contexts/UserContext";
import { useLandingPageData } from "../hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../hooks/usePortfolio";
import { useWalletModal } from "../hooks/useWalletModal";
import { createCategoriesFromApiData } from "../utils/portfolio.utils";
import { ErrorBoundary } from "./errors/ErrorBoundary";
import { PortfolioOverview } from "./PortfolioOverview";
import { GlassCard } from "./ui";
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
  onCategoryClick?: (categoryId: string) => void;
}

export function WalletPortfolio({
  onAnalyticsClick,
  onOptimizeClick,
  onZapInClick,
  onZapOutClick,
  onCategoryClick,
}: WalletPortfolioProps = {}) {
  // Get user data for landing page
  const { userInfo, isConnected } = useUser();

  // Unified data fetching - single API call for all landing page data
  const landingPageQuery = useLandingPageData(userInfo?.userId);
  const landingPageData = landingPageQuery.data;

  // Transform landing page data for pie chart and category summaries
  const {
    pieChartData,
    categorySummaries,
    debtCategorySummaries,
    portfolioMetrics,
  } = useMemo(() => {
    if (!landingPageData) {
      return {
        pieChartData: null,
        categorySummaries: [],
        debtCategorySummaries: [],
        portfolioMetrics: null,
      };
    }

    // Use total_assets_usd for pie chart and asset categories (not total_net_usd)
    const categories = landingPageData.pie_chart_categories;
    const totalAssetsValue = landingPageData.total_assets_usd;

    const transformedPieChartData = [
      {
        label: "Bitcoin",
        value: categories.btc,
        percentage:
          totalAssetsValue > 0 ? (categories.btc / totalAssetsValue) * 100 : 0,
        color: "#F7931A", // Bitcoin orange
      },
      {
        label: "Ethereum",
        value: categories.eth,
        percentage:
          totalAssetsValue > 0 ? (categories.eth / totalAssetsValue) * 100 : 0,
        color: "#627EEA", // Ethereum blue
      },
      {
        label: "Stablecoins",
        value: categories.stablecoins,
        percentage:
          totalAssetsValue > 0
            ? (categories.stablecoins / totalAssetsValue) * 100
            : 0,
        color: "#26A69A", // Teal for stable
      },
      {
        label: "Others",
        value: categories.others,
        percentage:
          totalAssetsValue > 0
            ? (categories.others / totalAssetsValue) * 100
            : 0,
        color: "#AB47BC", // Purple for others
      },
    ].filter(item => item.value > 0); // Only show categories with value

    // Create asset category summaries using simplified API data
    const assetSummaries = createCategoriesFromApiData(
      categories,
      totalAssetsValue
    );

    // Create debt category summaries from category_summary_debt
    const debtSummaries = createCategoriesFromApiData(
      landingPageData.category_summary_debt || {
        btc: 0,
        eth: 0,
        stablecoins: 0,
        others: 0,
      },
      landingPageData.total_debt_usd || 0
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
      categorySummaries: assetSummaries,
      debtCategorySummaries: debtSummaries,
      portfolioMetrics: transformedMetrics,
    };
  }, [landingPageData]);

  // Portfolio UI state management (simplified since we have pre-formatted data)
  const { balanceHidden, toggleBalanceVisibility } = usePortfolio([]);

  // Wallet modal state
  const {
    isOpen: isWalletManagerOpen,
    openModal: openWalletManager,
    closeModal: closeWalletManager,
  } = useWalletModal();

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

        {/* Asset Distribution with Horizontal Layout */}
        <ErrorBoundary
          onError={error =>
            walletPortfolioLogger.error("PortfolioOverview Error", error)
          }
        >
          <PortfolioOverview
            categorySummaries={categorySummaries}
            debtCategorySummaries={debtCategorySummaries}
            pieChartData={pieChartData || []}
            totalValue={landingPageData?.total_net_usd || null}
            balanceHidden={balanceHidden}
            title="Asset Distribution"
            isLoading={landingPageQuery.isLoading}
            apiError={landingPageQuery.error?.message || null}
            onRetry={landingPageQuery.refetch}
            isRetrying={landingPageQuery.isRefetching}
            isConnected={isConnected}
            testId="wallet-portfolio-overview"
            {...(onCategoryClick && { onCategoryClick })}
          />
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
