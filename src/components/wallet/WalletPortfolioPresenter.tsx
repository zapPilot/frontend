"use client";

import dynamic from "next/dynamic";
import { ComponentType } from "react";
import { BalanceVisibilityProvider } from "@/contexts/BalanceVisibilityContext";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { GlassCard } from "@/components/ui";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { WalletMetrics } from "@/components/wallet/WalletMetrics";
import { WalletActions } from "@/components/wallet/WalletActions";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import type { WalletManagerProps } from "@/components/WalletManager";
import type { WalletPortfolioViewModel } from "@/hooks/useWalletPortfolioState";

const WalletManager: ComponentType<WalletManagerProps> = dynamic(
  () =>
    import("@/components/WalletManager").then(mod => ({
      default: mod.WalletManager,
    })),
  {
    loading: () => null,
  }
);

interface WalletPortfolioPresenterProps {
  vm: WalletPortfolioViewModel;
  onCategoryClick?: (categoryId: string) => void;
}

export function WalletPortfolioPresenter({
  vm,
  onCategoryClick,
}: WalletPortfolioPresenterProps) {
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
          <GlassCard>
            <WalletHeader
              onWalletManagerClick={vm.openWalletManager}
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
            balanceHidden={vm.balanceHidden}
            title="Asset Distribution"
            onRetry={vm.onRetry}
            testId="wallet-portfolio-overview"
            {...(onCategoryClick && { onCategoryClick })}
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
