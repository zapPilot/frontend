import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { BalanceCard } from "@/components/wallet/portfolio/components/BalanceCard";
import { PortfolioComposition } from "@/components/wallet/portfolio/components/PortfolioComposition";
import { StrategyCard } from "@/components/wallet/portfolio/components/StrategyCard";
import {
    BalanceCardSkeleton,
    PortfolioCompositionSkeleton,
} from "@/components/wallet/portfolio/views/DashboardSkeleton";
import type { Regime } from "@/components/wallet/regime/regimeData";
import type { ModalType } from "@/types/portfolio";
import type {
    BalanceData,
    CompositionData,
    SectionState,
    SentimentData,
    StrategyData,
} from "@/types/portfolio-progressive";

/** Layout styling constants */
const STYLES = {
  container: "animate-in fade-in duration-300",
  heroGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
} as const;

interface DashboardViewProps {
  /** Unified data for components (backward compatible) */
  data: WalletPortfolioDataWithDirection;
  /** Section states for progressive loading */
  sections: {
    balance: SectionState<BalanceData>;
    composition: SectionState<CompositionData>;
    strategy: SectionState<StrategyData>;
    sentiment: SectionState<SentimentData>;
  };
  currentRegime: Regime | undefined;
  isEmptyState: boolean;
  isLoading?: boolean;
  onOpenModal: (type: ModalType) => void;
}

export function DashboardView({
  data,
  sections,
  currentRegime,
  isEmptyState,
  isLoading = false,
  onOpenModal,
}: DashboardViewProps) {
  return (
    <div data-testid="dashboard-content" className={STYLES.container}>
      {/* Hero Section: Balance + Expandable Strategy Card */}
      <div className={STYLES.heroGrid}>
        <SectionWrapper
          state={sections.balance}
          skeleton={<BalanceCardSkeleton />}
        >
          {() => (
            <BalanceCard
              balance={data.balance}
              roi={data.roi}
              isEmptyState={isEmptyState}
              isLoading={isLoading}
              onOpenModal={onOpenModal}
            />
          )}
        </SectionWrapper>

        {/* Strategy Card with independent sentiment loading */}
        {/* Strategy Card with independent sentiment loading */}
        <StrategyCard
          data={data}
          // If strategy is loading, suppress the default regime to show skeletons
          // This allows sentiment to load independently without showing "Neutral" fallback
          currentRegime={sections.strategy.isLoading ? undefined : currentRegime}
          isEmptyState={isEmptyState}
          isLoading={false} // Allow partial rendering
          sentimentSection={sections.sentiment}
        />
      </div>

      {/* Unified Composition Bar */}
      <SectionWrapper
        state={sections.composition}
        skeleton={<PortfolioCompositionSkeleton />}
      >
        {() => (
          <PortfolioComposition
            data={data}
            currentRegime={currentRegime}
            isEmptyState={isEmptyState}
            isLoading={isLoading}
            onRebalance={() => onOpenModal("rebalance")}
          />
        )}
      </SectionWrapper>
    </div>
  );
}
