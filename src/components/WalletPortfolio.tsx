"use client";

import { logger } from "@/utils/logger";
import dynamic from "next/dynamic";
import { ComponentType, useMemo } from "react";
import { useUser } from "../contexts/UserContext";
import { useLandingPageData } from "../hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../hooks/usePortfolio";
import { usePortfolioState } from "../hooks/usePortfolioState";
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
  urlUserId?: string;
  onAnalyticsClick?: (() => void) | undefined;
  onOptimizeClick?: (() => void) | undefined;
  onZapInClick?: (() => void) | undefined;
  onZapOutClick?: (() => void) | undefined;
  onCategoryClick?: (categoryId: string) => void;
}

export function WalletPortfolio({
  urlUserId,
  onAnalyticsClick,
  onOptimizeClick,
  onZapInClick,
  onZapOutClick,
  onCategoryClick,
}: WalletPortfolioProps = {}) {
  // Get user data for landing page
  const { userInfo, isConnected } = useUser();

  // Resolve which userId to use for data fetching
  // Prefer explicit urlUserId (shared view), else fallback to connected user's id
  const resolvedUserId = urlUserId || userInfo?.userId || null;

  // Unified data fetching - single API call for all landing page data
  const landingPageQuery = useLandingPageData(resolvedUserId);
  const landingPageData = landingPageQuery.data;

  // Transform landing page data for pie chart and category summaries
  const {
    pieChartData,
    categorySummaries,
    debtCategorySummaries,
    portfolioMetrics,
    hasZeroData,
  } = useMemo(() => {
    if (!landingPageData) {
      return {
        pieChartData: null,
        categorySummaries: [],
        debtCategorySummaries: [],
        portfolioMetrics: null,
        hasZeroData: false,
      };
    }

    // Check if all portfolio values are zero (API returns data but all values are 0)
    const portfolioAllocation = landingPageData.portfolio_allocation;
    const hasZeroPortfolioData =
      portfolioAllocation.btc.total_value === 0 &&
      portfolioAllocation.eth.total_value === 0 &&
      portfolioAllocation.stablecoins.total_value === 0 &&
      portfolioAllocation.others.total_value === 0 &&
      landingPageData.total_net_usd === 0;

    // Use portfolio_allocation for pie chart data with pre-calculated percentages

    const transformedPieChartData = [
      {
        label: "Bitcoin",
        value: portfolioAllocation.btc.total_value,
        percentage: portfolioAllocation.btc.percentage_of_portfolio,
        color: "#F7931A", // Bitcoin orange
      },
      {
        label: "Ethereum",
        value: portfolioAllocation.eth.total_value,
        percentage: portfolioAllocation.eth.percentage_of_portfolio,
        color: "#627EEA", // Ethereum blue
      },
      {
        label: "Stablecoins",
        value: portfolioAllocation.stablecoins.total_value,
        percentage: portfolioAllocation.stablecoins.percentage_of_portfolio,
        color: "#26A69A", // Teal for stable
      },
      {
        label: "Others",
        value: portfolioAllocation.others.total_value,
        percentage: portfolioAllocation.others.percentage_of_portfolio,
        color: "#AB47BC", // Purple for others
      },
    ].filter(item => item.value > 0); // Only show categories with value

    // Create asset category summaries using portfolio allocation data
    const assetSummaries = createCategoriesFromApiData(
      {
        btc: portfolioAllocation.btc.total_value,
        eth: portfolioAllocation.eth.total_value,
        stablecoins: portfolioAllocation.stablecoins.total_value,
        others: portfolioAllocation.others.total_value,
      },
      landingPageData.total_assets_usd
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
    };

    return {
      pieChartData:
        transformedPieChartData.length > 0 ? transformedPieChartData : null,
      categorySummaries: assetSummaries,
      debtCategorySummaries: debtSummaries,
      portfolioMetrics: transformedMetrics,
      hasZeroData: hasZeroPortfolioData,
    };
  }, [landingPageData]);

  // Centralized portfolio state management
  const portfolioState = usePortfolioState({
    isConnected,
    isLoading: landingPageQuery.isLoading,
    isRetrying: landingPageQuery.isRefetching,
    error: landingPageQuery.error?.message || null,
    landingPageData,
    hasZeroData,
  });

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
              portfolioState={portfolioState}
              balanceHidden={balanceHidden}
              portfolioChangePercentage={
                portfolioMetrics?.totalChangePercentage || 0
              }
              userId={resolvedUserId}
              landingPageData={landingPageData}
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
            portfolioState={portfolioState}
            categorySummaries={categorySummaries}
            debtCategorySummaries={debtCategorySummaries}
            pieChartData={pieChartData || []}
            balanceHidden={balanceHidden}
            title="Asset Distribution"
            onRetry={landingPageQuery.refetch}
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
            {...(urlUserId && { urlUserId })}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
