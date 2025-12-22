import { Zap } from "lucide-react";

import {
  ASSET_COLORS,
  type WalletPortfolioDataWithDirection,
} from "@/adapters/walletPortfolioDataAdapter";
import { GradientButton } from "@/components/ui";
import {
  getRegimeAllocation,
  type Regime,
} from "@/components/wallet/regime/regimeData";
import { GRADIENTS } from "@/constants/design-system";

import { PortfolioCompositionSkeleton } from "../views/DashboardSkeleton";
import { AllocationBars } from "./AllocationBars";
import { AllocationChip } from "./AllocationChip";
import { PortfolioLegend } from "./PortfolioLegend";
import {
  buildRealCryptoAssets,
  buildTargetCryptoAssets,
} from "./utils/portfolioCompositionHelpers";

interface PortfolioCompositionProps {
  data: WalletPortfolioDataWithDirection;
  currentRegime: Regime | undefined;
  isEmptyState?: boolean;
  isLoading?: boolean;
  onRebalance: () => void;
}

const STYLES = {
  container:
    "bg-gray-900/20 border border-gray-800 rounded-2xl p-8 flex flex-col relative overflow-hidden",
  header: "flex justify-between items-end mb-8",
  title: "text-xl font-bold text-white mb-1",
  subtitle: "text-sm text-gray-400",
  allocationRow: "flex gap-2 items-center",
  allocationLabel: "text-sm text-gray-400 mr-2",
  ghostBarTrack:
    "relative h-24 w-full bg-gray-900/50 rounded-xl border border-gray-800 p-1 flex overflow-hidden",
  ghostBackground: "absolute inset-0 flex opacity-20 pointer-events-none",
  ghostBorder: "h-full border-r border-dashed border-white/30",
  actualBars: "relative w-full h-full flex gap-1 z-10",
} as const;

export function PortfolioComposition({
  data,
  currentRegime,
  isEmptyState = false,
  isLoading = false,
  onRebalance,
}: PortfolioCompositionProps) {
  // Early return for loading state
  if (isLoading) {
    return <PortfolioCompositionSkeleton />;
  }

  // Early return if no regime data
  if (!currentRegime) {
    return null;
  }

  const targetBreakdown = getRegimeAllocation(currentRegime);
  const target = {
    crypto: targetBreakdown.spot + targetBreakdown.lp,
    stable: targetBreakdown.stable,
  };
  const allocationLabel = isEmptyState ? "Recommended" : "Target";

  // Determine which assets to display
  const cryptoAssets = isEmptyState
    ? buildTargetCryptoAssets(currentRegime)
    : buildRealCryptoAssets(data);

  const cryptoPercentage = isEmptyState
    ? target.crypto
    : data.currentAllocation.crypto;
  const stablePercentage = isEmptyState
    ? target.stable
    : data.currentAllocation.stable;

  return (
    <div className={STYLES.container} data-testid="composition-bar">
      <div className={STYLES.header}>
        <div>
          <h2 className={STYLES.title}>Portfolio Composition</h2>
          <div className={STYLES.subtitle}>
            <div className={STYLES.allocationRow}>
              <span className={STYLES.allocationLabel}>{allocationLabel}:</span>
              <AllocationChip
                label={`${target.stable}% Stable`}
                color={ASSET_COLORS.USDT}
              />
              <AllocationChip
                label={`${target.crypto}% Crypto`}
                color={ASSET_COLORS.BTC}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <GradientButton
            data-testid="rebalance-button"
            gradient={GRADIENTS.PRIMARY}
            icon={Zap}
            className="h-8 text-xs"
            onClick={onRebalance}
            disabled={isEmptyState}
          >
            Rebalance
          </GradientButton>
        </div>
      </div>

      {/* THE GHOST BAR TRACK */}
      <div className={STYLES.ghostBarTrack}>
        {/* GHOST TARGET BACKGROUND - Visual guide only */}
        <div className={STYLES.ghostBackground}>
          <div
            style={{ width: `${target.crypto}%` }}
            className={STYLES.ghostBorder}
          />
          <div style={{ width: `${target.stable}%` }} className="h-full" />
        </div>

        {/* ACTUAL BARS (Foreground) */}
        <div className={STYLES.actualBars}>
          <AllocationBars
            cryptoAssets={cryptoAssets}
            cryptoPercentage={cryptoPercentage}
            stablePercentage={stablePercentage}
          />
        </div>
      </div>

      {/* Legend - Conditional rendering for empty state */}
      <PortfolioLegend
        isEmptyState={isEmptyState}
        cryptoAssets={cryptoAssets}
        stablePercentage={stablePercentage}
        delta={data.delta}
        simplifiedCrypto={data.currentAllocation.simplifiedCrypto}
      />
    </div>
  );
}
