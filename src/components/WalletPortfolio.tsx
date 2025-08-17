"use client";

import React from "react";
import { useWalletPortfolioState } from "../hooks/useWalletPortfolioState";
import { formatCurrency } from "../lib/utils";
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
  // Consolidated state management - all loading/error logic and transformations in one place
  let portfolioState;
  try {
    portfolioState = useWalletPortfolioState();
  } catch (error) {
    // Let React error boundary handle the error
    throw error;
  }

  // Custom balance display renderer for PieChart - must be declared before early return
  const renderBalanceDisplay = React.useCallback(() => {
    return formatCurrency(
      portfolioState?.totalValue || 0,
      portfolioState?.balanceHidden || false
    );
  }, [portfolioState?.totalValue, portfolioState?.balanceHidden]);

  // Handle case where hook returns undefined (for tests)
  if (!portfolioState) {
    return (
      <div className="space-y-6">
        <GlassCard>
          <div className="p-6 text-center">
            <p className="text-gray-400">Portfolio state not available</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const {
    totalValue,
    portfolioData,
    pieChartData,
    isLoading,
    apiError,
    retry,
    isRetrying,
    isConnected,
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
    isWalletManagerOpen,
    openWalletManager,
    closeWalletManager,
  } = portfolioState;

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
          portfolioChangePercentage={
            portfolioMetrics?.totalChangePercentage || 0
          }
          onRetry={retry}
          isRetrying={isRetrying}
          isConnected={isConnected}
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
          isConnected={isConnected}
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
