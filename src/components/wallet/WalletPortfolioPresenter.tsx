"use client";

import dynamic from "next/dynamic";
import { ComponentType, useCallback, useState } from "react";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { BaseCard } from "@/components/ui";
import { RebalanceSection } from "@/components/wallet/RebalanceSection";
import { WalletActions } from "@/components/wallet/WalletActions";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { WalletMetrics } from "@/components/wallet/WalletMetrics";
import type { WalletManagerProps } from "@/components/WalletManager";
import { WalletManagerSkeleton } from "@/components/WalletManager/WalletManagerSkeleton";
import { BalanceVisibilityProvider } from "@/contexts/BalanceVisibilityContext";
import type { WalletPortfolioViewModel } from "@/hooks/useWalletPortfolioState";

const WalletManager: ComponentType<WalletManagerProps> = dynamic(
  async () => {
    const mod = await import("@/components/WalletManager");
    return { default: mod.WalletManager };
  },
  {
    loading: () => <WalletManagerSkeleton />,
  }
);

interface WalletPortfolioPresenterProps {
  vm: WalletPortfolioViewModel;
}

export function WalletPortfolioPresenter({
  vm,
}: WalletPortfolioPresenterProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const optimizeHandler = vm.onOptimizeClick;

  const handleOptimizeClick = useCallback(async () => {
    if (!optimizeHandler || isOptimizing) {
      return;
    }

    try {
      setIsOptimizing(true);
      await Promise.resolve(optimizeHandler());
    } finally {
      setIsOptimizing(false);
    }
  }, [isOptimizing, optimizeHandler]);

  return (
    <BalanceVisibilityProvider
      value={{
        balanceHidden: vm.balanceHidden,
        toggleBalanceVisibility: vm.toggleBalanceVisibility,
      }}
    >
      <div className="space-y-6">
        <ErrorBoundary
          resetKeys={[
            vm.resolvedUserId || "no-user",
            vm.portfolioState.isConnected ? "connected" : "disconnected",
          ]}
        >
          <BaseCard variant="glass">
            <WalletHeader
              onWalletManagerClick={vm.openWalletManager}
              onToggleBalance={vm.toggleBalanceVisibility}
              isOwnBundle={vm.isOwnBundle}
              bundleUserName={vm.bundleUserName}
              bundleUrl={vm.bundleUrl}
            />

            <WalletMetrics
              portfolioState={vm.portfolioState}
              portfolioChangePercentage={
                vm.portfolioMetrics?.totalChangePercentage || 0
              }
              userId={vm.resolvedUserId}
              landingPageData={vm.landingPageData}
              yieldSummaryData={vm.yieldSummaryData}
              isLandingLoading={vm.isLandingLoading}
              isYieldLoading={vm.isYieldLoading}
              sentimentData={vm.sentimentData}
              isSentimentLoading={vm.isSentimentLoading}
              sentimentError={vm.sentimentError}
            />

            <RebalanceSection
              allocation={vm.allocation}
              onOptimizeClick={
                optimizeHandler ? handleOptimizeClick : undefined
              }
              disabled={
                vm.isVisitorMode || isOptimizing || !optimizeHandler
              }
            />

            <WalletActions
              onZapInClick={vm.onZapInClick}
              onZapOutClick={vm.onZapOutClick}
              onOptimizeClick={
                optimizeHandler ? handleOptimizeClick : undefined
              }
              disabled={vm.isVisitorMode}
            />
          </BaseCard>
        </ErrorBoundary>

        <ErrorBoundary>
          <PortfolioOverview
            portfolioState={vm.portfolioState}
            categorySummaries={vm.categorySummaries}
            debtCategorySummaries={vm.debtCategorySummaries}
            pieChartData={vm.pieChartData || []}
            leverageMetrics={vm.leverageMetrics}
            title="Asset Distribution"
            onRetry={vm.onRetry}
            testId="wallet-portfolio-overview"
            {...(vm.onCategoryClick && {
              onCategoryClick: vm.toggleCategoryExpansion,
            })}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <WalletManager
            isOpen={vm.isWalletManagerOpen}
            onClose={vm.closeWalletManager}
            {...(vm.resolvedUserId && { urlUserId: vm.resolvedUserId })}
          />
        </ErrorBoundary>
      </div>
    </BalanceVisibilityProvider>
  );
}
