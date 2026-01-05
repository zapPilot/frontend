import { Zap } from "lucide-react";
import { useMemo } from "react";

import { type WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { GradientButton } from "@/components/ui";
import {
    getRegimeAllocation,
    type Regime,
} from "@/components/wallet/regime/regimeData";
import { GRADIENTS } from "@/constants/design-system";
import { useAllocationWeights } from "@/hooks/queries/analytics/useAllocationWeights";

import { PortfolioCompositionSkeleton } from "../../views/DashboardSkeleton";
import { AllocationBars, TargetAllocationBar } from "../allocation";
import {
    buildRealCryptoAssets,
    buildTargetAssetsWithWeights,
    buildTargetCryptoAssets,
} from "../utils/portfolioCompositionHelpers";

interface PortfolioCompositionProps {
  data: WalletPortfolioDataWithDirection;
  currentRegime: Regime | undefined;
  /** Optional target allocation to render without regime */
  targetAllocation?: { crypto: number; stable: number } | undefined;
  isEmptyState?: boolean;
  /** Whether user is viewing their own bundle (enables wallet actions) */
  isOwnBundle?: boolean;
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
  barTrack:
    "relative w-full bg-gray-900/50 rounded-xl border border-gray-800 p-3 flex flex-col gap-1 overflow-hidden",
  barLabel: "text-[10px] text-gray-500 font-medium mb-1",
} as const;

export function PortfolioComposition({
  data,
  currentRegime,
  targetAllocation,
  isEmptyState = false,
  isOwnBundle = true,
  isLoading = false,
  onRebalance,
}: PortfolioCompositionProps) {
  // Disable actions if empty state OR not own bundle (visitor mode)
  const isActionsDisabled = isEmptyState || !isOwnBundle;
  // ⚠️ HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS ⚠️
  // Fetch marketcap-weighted allocation weights for BTC/ETH split
  const { data: allocationWeights } = useAllocationWeights();

  // Determine target breakdown source
  // Priority: 1. Explicit prop (from progressive loading) 2. Derived from Regime 3. Fallback
  let target = targetAllocation;

  if (!target && currentRegime) {
    const breakdown = getRegimeAllocation(currentRegime);
    target = {
      crypto: breakdown.spot + breakdown.lp,
      stable: breakdown.stable,
    };
  }

  // Build target assets array with marketcap-weighted BTC/ETH split
  const targetAssets = useMemo(() => {
    if (!target) return [];
    return buildTargetAssetsWithWeights(target, allocationWeights);
  }, [target, allocationWeights]);

  // Early return for loading state
  if (isLoading) {
    return <PortfolioCompositionSkeleton />;
  }

  // If we still have no target (missing prop AND missing regime), we can't render meaningful bars
  if (!target) {
    return null;
  }

  // Determine which assets to display
  // If we lack regime, we can't infer target-specific assets for empty state perfectly,
  // but we can try to be robust.
  // buildTargetCryptoAssets usually depends on regime. If missing, maybe fallback or use current assets.
  const cryptoAssets =
    isEmptyState && currentRegime
      ? buildTargetCryptoAssets(currentRegime)
      : buildRealCryptoAssets(data);

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
              {/* Drift Indicator moved here for context */}
              <span
                className={`text-xs font-bold ${
                  data.delta > 5 ? "text-orange-400" : "text-gray-500"
                }`}
              >
                Drift: {data.delta.toFixed(1)}%
              </span>
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
            disabled={isActionsDisabled}
          >
            Rebalance
          </GradientButton>
        </div>
      </div>

      {/* ALLOCATION BAR TRACK */}
      <div className={STYLES.barTrack}>
        {/* Target Indicator Bar - Dynamic marketcap-weighted BTC/ETH/Stables */}
        <div className={STYLES.barLabel}>Target Allocation</div>
        <TargetAllocationBar assets={targetAssets} />

        {/* ACTUAL BARS */}
        <div className={STYLES.barLabel}>Current Portfolio</div>
        <AllocationBars
          cryptoAssets={cryptoAssets}
          stablePercentage={stablePercentage}
        />
      </div>
    </div>
  );
}
