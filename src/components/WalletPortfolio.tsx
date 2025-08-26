"use client";

import React, { useMemo } from "react";
import { useUser } from "../contexts/UserContext";
import { usePortfolioDisplayData } from "../hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../hooks/usePortfolio";
import { useWalletModal } from "../hooks/useWalletModal";
import { preparePortfolioDataWithBorrowing } from "../utils/portfolio.utils";
import { ErrorBoundary } from "./errors/ErrorBoundary";
import { GlassCard } from "./ui";
import { PortfolioOverview } from "./PortfolioOverview";
import { WalletManager } from "./WalletManager";
import { WalletActions } from "./wallet/WalletActions";
import { WalletHeader } from "./wallet/WalletHeader";
import { WalletMetrics } from "./wallet/WalletMetrics";

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
  // Get user data for APR calculations
  const { userInfo, isConnected } = useUser();

  // Data fetching and API state
  const {
    totalValue,
    categories: apiCategoriesData,
    isLoading,
    error: apiError,
    refetch: retry,
    isRefetching: isRetrying,
  } = usePortfolioDisplayData(userInfo?.userId);

  // Portfolio UI state management
  const {
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
  } = usePortfolio(apiCategoriesData || []);

  // Wallet modal state
  const {
    isOpen: isWalletManagerOpen,
    openModal: openWalletManager,
    closeModal: closeWalletManager,
  } = useWalletModal();

  // Performance optimization: Consolidated data preparation using useMemo
  //
  // This transformation is expensive (sorts, filters, and processes all portfolio data)
  // and was previously running on every component render. Now memoized to only
  // recalculate when actual dependencies (apiCategoriesData, totalValue) change.
  //
  // Impact: Significant performance improvement for large portfolios (50+ assets)
  // Dependencies: Only recalculates when portfolio data or total value changes
  const { portfolioData, pieChartData } = useMemo(() => {
    return preparePortfolioDataWithBorrowing(
      apiCategoriesData,
      totalValue,
      "WalletPortfolio"
    );
  }, [apiCategoriesData, totalValue]);

  return (
    <ErrorBoundary
      onError={error => console.error("WalletPortfolio Error:", error)}
      resetKeys={[
        userInfo?.userId || "no-user",
        isConnected ? "connected" : "disconnected",
      ]}
    >
      <div className="space-y-6">
        {/* Wallet Header */}
        <ErrorBoundary
          onError={error => console.error("WalletHeader Error:", error)}
        >
          <GlassCard>
            <WalletHeader
              onAnalyticsClick={onAnalyticsClick}
              onWalletManagerClick={openWalletManager}
              onToggleBalance={toggleBalanceVisibility}
              balanceHidden={balanceHidden}
            />

            <WalletMetrics
              totalValue={totalValue}
              balanceHidden={balanceHidden}
              isLoading={isLoading}
              error={apiError}
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

        {/* Portfolio Overview */}
        <ErrorBoundary
          onError={error => console.error("PortfolioOverview Error:", error)}
        >
          <PortfolioOverview
            portfolioData={portfolioData}
            pieChartData={pieChartData} // Always provide pieChartData (now required)
            totalValue={totalValue}
            expandedCategory={expandedCategory}
            onCategoryToggle={toggleCategoryExpansion}
            balanceHidden={balanceHidden}
            title="Asset Distribution"
            isLoading={isLoading}
            apiError={apiError}
            onRetry={retry}
            isRetrying={isRetrying}
            isConnected={isConnected}
          />
        </ErrorBoundary>

        {/* Wallet Manager Modal */}
        <ErrorBoundary
          onError={error => console.error("WalletManager Error:", error)}
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
