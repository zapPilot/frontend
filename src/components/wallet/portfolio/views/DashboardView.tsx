import { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { BalanceCard } from "@/components/wallet/portfolio/components/BalanceCard";
import { PortfolioComposition } from "@/components/wallet/portfolio/components/PortfolioComposition";
import { StrategyCard } from "@/components/wallet/portfolio/components/StrategyCard";
import { Regime } from "@/components/wallet/regime/regimeData";
import type { ModalType } from "@/types/portfolio";

interface DashboardViewProps {
  data: WalletPortfolioDataWithDirection;
  currentRegime: Regime | undefined;
  isEmptyState: boolean;
  onOpenModal: (type: ModalType) => void;
}

export function DashboardView({
  data,
  currentRegime,
  isEmptyState,
  onOpenModal,
}: DashboardViewProps) {
  return (
    <div data-testid="dashboard-content">
      {/* HERO SECTION: Balance + Expandable Strategy Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Card */}
        <BalanceCard
          balance={data.balance}
          roi={data.roi}
          isEmptyState={isEmptyState}
          onOpenModal={onOpenModal}
        />

        {/* EXPANDABLE STRATEGY CARD */}
        <StrategyCard
          data={data}
          currentRegime={currentRegime}
          isEmptyState={isEmptyState}
        />
      </div>

      {/* UNIFIED COMPOSITION BAR (V21 Style) - Only visible in Dashboard */}
      <PortfolioComposition
        data={data}
        currentRegime={currentRegime}
        isEmptyState={isEmptyState}
        onRebalance={() => onOpenModal("rebalance")}
      />
    </div>
  );
}
