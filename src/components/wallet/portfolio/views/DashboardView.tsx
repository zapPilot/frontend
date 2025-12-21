import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { BalanceCard } from "@/components/wallet/portfolio/components/BalanceCard";
import { PortfolioComposition } from "@/components/wallet/portfolio/components/PortfolioComposition";
import { StrategyCard } from "@/components/wallet/portfolio/components/StrategyCard";
import type { Regime } from "@/components/wallet/regime/regimeData";
import type { ModalType } from "@/types/portfolio";

/** Layout styling constants */
const STYLES = {
  container: "animate-in fade-in duration-300",
  heroGrid: "grid grid-cols-1 md:grid-cols-2 gap-6",
} as const;

interface DashboardViewProps {
  data: WalletPortfolioDataWithDirection;
  currentRegime: Regime | undefined;
  isEmptyState: boolean;
  isLoading?: boolean;
  onOpenModal: (type: ModalType) => void;
}

export function DashboardView({
  data,
  currentRegime,
  isEmptyState,
  isLoading = false,
  onOpenModal,
}: DashboardViewProps) {
  return (
    <div data-testid="dashboard-content" className={STYLES.container}>
      {/* Hero Section: Balance + Expandable Strategy Card */}
      <div className={STYLES.heroGrid}>
        <BalanceCard
          balance={data.balance}
          roi={data.roi}
          isEmptyState={isEmptyState}
          isLoading={isLoading}
          onOpenModal={onOpenModal}
        />
        <StrategyCard
          data={data}
          currentRegime={currentRegime}
          isEmptyState={isEmptyState}
          isLoading={isLoading}
        />
      </div>

      {/* Unified Composition Bar */}
      <PortfolioComposition
        data={data}
        currentRegime={currentRegime}
        isEmptyState={isEmptyState}
        isLoading={isLoading}
        onRebalance={() => onOpenModal("rebalance")}
      />
    </div>
  );
}
