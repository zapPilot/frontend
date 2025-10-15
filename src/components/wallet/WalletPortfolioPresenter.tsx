"use client";

import dynamic from "next/dynamic";
import { ComponentType, useCallback } from "react";
import { BalanceVisibilityProvider } from "@/contexts/BalanceVisibilityContext";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { GlassCard } from "@/components/ui";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { WalletMetrics } from "@/components/wallet/WalletMetrics";
import { WalletActions } from "@/components/wallet/WalletActions";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import type { WalletManagerProps } from "@/components/WalletManager";
import { WalletManagerSkeleton } from "@/components/WalletManager/WalletManagerSkeleton";
import type { WalletPortfolioViewModel } from "@/hooks/useWalletPortfolioState";
import { usePortfolio } from "@/hooks/usePortfolio";
import type { AssetCategory } from "@/types/portfolio";

const EMPTY_PORTFOLIO_DATA: AssetCategory[] = [];

const WalletManager: ComponentType<WalletManagerProps> = dynamic(
  () =>
    import("@/components/WalletManager").then(mod => ({
      default: mod.WalletManager,
    })),
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
  const { balanceHidden, toggleBalanceVisibility } =
    usePortfolio(EMPTY_PORTFOLIO_DATA);
  const { onToggleBalance } = vm;
  const combinedToggle = useCallback(() => {
    toggleBalanceVisibility();
    onToggleBalance?.();
  }, [toggleBalanceVisibility, onToggleBalance]);
  return (
    <BalanceVisibilityProvider
      value={{
        balanceHidden,
        toggleBalanceVisibility: combinedToggle,
      }}
    >
      <div className="space-y-6">
        <ErrorBoundary
          resetKeys={[
            vm.resolvedUserId || "no-user",
            vm.portfolioState.isConnected ? "connected" : "disconnected",
          ]}
        >
          <GlassCard>
            <WalletHeader
              onWalletManagerClick={vm.openWalletManager}
              onToggleBalance={combinedToggle}
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
            />

            <WalletActions
              onZapInClick={vm.onZapInClick}
              onZapOutClick={vm.onZapOutClick}
              onOptimizeClick={vm.onOptimizeClick}
              disabled={vm.isVisitorMode}
            />
          </GlassCard>
        </ErrorBoundary>

        <ErrorBoundary>
          <PortfolioOverview
            portfolioState={vm.portfolioState}
            categorySummaries={vm.categorySummaries}
            debtCategorySummaries={vm.debtCategorySummaries}
            pieChartData={vm.pieChartData || []}
            title="Asset Distribution"
            onRetry={vm.onRetry}
            testId="wallet-portfolio-overview"
            {...(vm.onCategoryClick && { onCategoryClick: vm.onCategoryClick })}
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
