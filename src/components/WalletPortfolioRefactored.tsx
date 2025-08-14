"use client";

import React from "react";
import { useWalletPortfolioState } from "../hooks/useWalletPortfolioState";
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
  // Consolidated state management - all loading/error logic and transformations in one place
  const {
    totalValue,
    portfolioData,
    pieChartData,
    isLoading,
    apiError,
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
    isWalletManagerOpen,
    openWalletManager,
    closeWalletManager,
  } = useWalletPortfolioState();

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
