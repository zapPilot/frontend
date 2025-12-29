import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { GhostModeOverlay } from "@/components/shared/GhostModeOverlay";
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
import type { DashboardSections } from "@/types/portfolio-progressive";

/** Layout styling constants */
const STYLES = {
  container: "animate-in fade-in duration-300 space-y-8", // Added space-y-8 for spacing
  heroGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
} as const;

interface DashboardViewProps {
  /** Unified data for components (backward compatible) */
  data: WalletPortfolioDataWithDirection;
  /** Section states for progressive loading */
  sections: DashboardSections;
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
  onOpenModal,
}: DashboardViewProps) {
  return (
    <div data-testid="dashboard-content" className={STYLES.container}>
      {/* Hero Section: Balance + Expandable Strategy Card */}
      <div className={STYLES.heroGrid}>
        {/* Balance Card - Ghost Mode bypasses SectionWrapper to show preview data */}
        {isEmptyState ? (
          <GhostModeOverlay enabled={true}>
            <BalanceCard
              balance={data.balance}
              isEmptyState={isEmptyState}
              isLoading={false}
              onOpenModal={onOpenModal}
              lastUpdated={data.lastUpdated}
            />
          </GhostModeOverlay>
        ) : (
          <SectionWrapper
            state={sections.balance}
            skeleton={<BalanceCardSkeleton />}
          >
            {() => (
              <BalanceCard
                balance={data.balance}
                isEmptyState={isEmptyState}
                isLoading={false}
                onOpenModal={onOpenModal}
                lastUpdated={data.lastUpdated}
              />
            )}
          </SectionWrapper>
        )}

        {/* Strategy Card shows market data - no blur needed */}
        <StrategyCard
          data={data}
          // If strategy is loading, suppress the default regime to show skeletons
          // This allows sentiment to load independently without showing "Neutral" fallback
          currentRegime={
            sections.strategy.isLoading ? undefined : currentRegime
          }
          isEmptyState={isEmptyState}
          isLoading={false} // Allow partial rendering
          sentimentSection={sections.sentiment}
        />
      </div>

      {/* Unified Composition Bar - Ghost Mode bypasses SectionWrapper */}
      {isEmptyState ? (
        <GhostModeOverlay enabled={true} showCTA={false}>
          <PortfolioComposition
            data={data}
            currentRegime={currentRegime}
            targetAllocation={data.targetAllocation}
            isEmptyState={isEmptyState}
            isLoading={false}
            onRebalance={() => onOpenModal("rebalance")}
          />
        </GhostModeOverlay>
      ) : (
        <SectionWrapper
          state={sections.composition}
          skeleton={<PortfolioCompositionSkeleton />}
        >
          {() => (
            <PortfolioComposition
              data={data}
              currentRegime={currentRegime}
              targetAllocation={sections.composition.data?.targetAllocation}
              isEmptyState={isEmptyState}
              isLoading={false}
              onRebalance={() => onOpenModal("rebalance")}
            />
          )}
        </SectionWrapper>
      )}
    </div>
  );
}
