"use client";

import React, { useCallback, useMemo } from "react";
import { usePortfolio } from "../hooks/usePortfolio";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { useWalletModal } from "../hooks/useWalletModal";
import { toPieChartData } from "../utils/portfolioTransformers";
import { PortfolioOverview } from "./PortfolioOverview";
import { WalletManager } from "./WalletManager";
import { GlassCard } from "./ui";
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

  // Memoize PortfolioOverview props to prevent unnecessary re-renders
  const portfolioOverviewProps: React.ComponentProps<typeof PortfolioOverview> =
    useMemo(() => {
      return {
        portfolioData, // Keep for AssetCategoriesDetail component
        pieChartData, // Always provide pieChartData (no longer optional)
        expandedCategory,
        onCategoryToggle: toggleCategoryExpansion,
        balanceHidden,
        title: "Asset Distribution" as const,
        isLoading,
        apiError,
        ...(totalValue !== null && { totalValue }),
      };
    }, [
      portfolioData,
      pieChartData,
      totalValue,
      expandedCategory,
      toggleCategoryExpansion,
      balanceHidden,
      isLoading,
      apiError,
    ]);

  // Memoize event handlers for consistency
  const handleAnalyticsClick = useCallback(() => {
    if (onAnalyticsClick) {
      onAnalyticsClick();
    }
  }, [onAnalyticsClick]);

  const handleWalletManagerClick = useCallback(() => {
    openWalletManager();
  }, [openWalletManager]);

  const handleToggleBalance = useCallback(() => {
    toggleBalanceVisibility();
  }, [toggleBalanceVisibility]);

  const handleZapInClick = useCallback(() => {
    if (onZapInClick) {
      onZapInClick();
    }
  }, [onZapInClick]);

  const handleZapOutClick = useCallback(() => {
    if (onZapOutClick) {
      onZapOutClick();
    }
  }, [onZapOutClick]);

  const handleOptimizeClick = useCallback(() => {
    if (onOptimizeClick) {
      onOptimizeClick();
    }
  }, [onOptimizeClick]);

  return (
    <div className="space-y-6">
      {/* Wallet Header */}
      <GlassCard>
        <WalletHeader
          onAnalyticsClick={onAnalyticsClick ? handleAnalyticsClick : undefined}
          onWalletManagerClick={handleWalletManagerClick}
          onToggleBalance={handleToggleBalance}
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
          onZapInClick={onZapInClick ? handleZapInClick : undefined}
          onZapOutClick={onZapOutClick ? handleZapOutClick : undefined}
          onOptimizeClick={onOptimizeClick ? handleOptimizeClick : undefined}
        />
      </GlassCard>

      {/* Portfolio Overview */}
      <PortfolioOverview {...portfolioOverviewProps} />

      {/* Wallet Manager Modal */}
      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={closeWalletManager}
      />
    </div>
  );
}
