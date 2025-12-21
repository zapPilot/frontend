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
    <div data-testid="dashboard-content" className="animate-in fade-in duration-300">
      {/* HERO SECTION: Balance + Expandable Strategy Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Card */}
        <BalanceCard
          balance={data.balance}
          roi={data.roi}
          isEmptyState={isEmptyState}
          isLoading={isLoading}
          onOpenModal={onOpenModal}
        />

        {/* EXPANDABLE STRATEGY CARD */}
        <StrategyCard
          data={data}
          currentRegime={currentRegime}
          isEmptyState={isEmptyState}
          isLoading={isLoading}
        />
      </div>

      {/* UNIFIED COMPOSITION BAR (V21 Style) - Only visible in Dashboard */}
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
