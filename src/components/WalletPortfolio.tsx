"use client";

import { useCallback, useMemo } from "react";
import { usePortfolio } from "../hooks/usePortfolio";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { useWalletModal } from "../hooks/useWalletModal";
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
    pieChartData,
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

  // Memoize PortfolioOverview props to prevent unnecessary re-renders
  const portfolioOverviewProps = useMemo(() => {
    const baseProps = {
      portfolioData,
      expandedCategory,
      onCategoryToggle: toggleCategoryExpansion,
      balanceHidden,
      title: "Asset Distribution" as const,
      isLoading,
      apiError,
    };

    // Add optional props conditionally
    if (pieChartData) {
      (baseProps as any).pieChartData = pieChartData;
    }
    if (totalValue !== null) {
      (baseProps as any).totalValue = totalValue;
    }

    return baseProps;
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
