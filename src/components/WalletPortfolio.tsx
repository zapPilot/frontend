"use client";

import React from "react";
import { useWalletPortfolioState } from "../hooks/useWalletPortfolioState";
import { PortfolioOverview } from "./PortfolioOverview";
import { WalletManager } from "./WalletManager";
import { GlassCard } from "./ui";
import { WalletActions } from "./wallet/WalletActions";
import { WalletHeader } from "./wallet/WalletHeader";
import { WalletMetrics } from "./wallet/WalletMetrics";
import { formatCurrency } from "../lib/utils";

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
  // Consolidated state management - all loading/error logic and transformations in one place
  const {
    totalValue,
    portfolioData,
    pieChartData,
    isLoading,
    apiError,
    retry,
    isRetrying,
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
    isWalletManagerOpen,
    openWalletManager,
    closeWalletManager,
  } = useWalletPortfolioState();

  // Custom balance display renderer for PieChart
  const renderBalanceDisplay = React.useCallback(() => {
    return formatCurrency(totalValue || 0, balanceHidden);
  }, [totalValue, balanceHidden]);

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
          onRetry={retry}
          isRetrying={isRetrying}
        />

        <WalletActions
          onZapInClick={onZapInClick}
          onZapOutClick={onZapOutClick}
          onOptimizeClick={onOptimizeClick}
        />
      </GlassCard>

      {/* Portfolio Overview - Hide for new users */}
      {apiError !== "USER_NOT_FOUND" && (
        <PortfolioOverview
          portfolioData={portfolioData}
          pieChartData={pieChartData}
          expandedCategory={expandedCategory}
          onCategoryToggle={toggleCategoryExpansion}
          balanceHidden={balanceHidden}
          title="Asset Distribution"
          isLoading={isLoading}
          apiError={apiError}
          onRetry={retry}
          isRetrying={isRetrying}
          renderBalanceDisplay={renderBalanceDisplay}
          {...(totalValue !== null && { totalValue })}
        />
      )}

      {/* Wallet Manager Modal */}
      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={closeWalletManager}
      />
    </div>
  );
}
