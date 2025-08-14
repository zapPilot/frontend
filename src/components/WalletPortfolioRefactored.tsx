"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "../hooks/usePortfolio";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { useWalletModal } from "../hooks/useWalletModal";
import { toPieChartData } from "../utils/portfolioTransformers";
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
  // Custom hooks for data and state management
  const {
    totalValue,
    categories: apiCategoriesData,
    isLoading,
    error: apiError,
  } = usePortfolioData();

  const {
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
  } = usePortfolio(apiCategoriesData || []);

  const {
    isOpen: isWalletManagerOpen,
    openModal: openWalletManager,
    closeModal: closeWalletManager,
  } = useWalletModal();

  // Memoize portfolio data for performance
  const portfolioData = useMemo(
    () => apiCategoriesData || [],
    [apiCategoriesData]
  );

  // Transform portfolio data to pie chart data using utility function (single source of truth)
  const pieChartData = useMemo(() => {
    return toPieChartData(portfolioData, totalValue || undefined);
  }, [portfolioData, totalValue]);

  return (
    <div className="space-y-6">
      {/* Wallet Header */}
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
          portfolioChangePercentage={portfolioMetrics.totalChangePercentage}
        />

        <WalletActions
          onZapInClick={onZapInClick}
          onZapOutClick={onZapOutClick}
          onOptimizeClick={onOptimizeClick}
        />
      </GlassCard>

      {/* Portfolio Overview */}
      <PortfolioOverview
        portfolioData={portfolioData}
        pieChartData={pieChartData} // Always provide pieChartData (now required)
        expandedCategory={expandedCategory}
        onCategoryToggle={toggleCategoryExpansion}
        balanceHidden={balanceHidden}
        title="Asset Distribution"
        isLoading={isLoading}
        apiError={apiError}
      />

      {/* Wallet Manager Modal */}
      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={closeWalletManager}
      />
    </div>
  );
}
