import { Zap } from "lucide-react";
import { useMemo } from "react";

import { type WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { GradientButton } from "@/components/ui";
import {
  getRegimeAllocation,
  type Regime,
} from "@/components/wallet/regime/regimeData";
import { UNIFIED_COLORS } from "@/constants/assets";
import { GRADIENTS } from "@/constants/design-system";
import { useAllocationWeights } from "@/hooks/queries/analytics/useAllocationWeights";

import { PortfolioCompositionSkeleton } from "../../views/DashboardSkeleton";
import {
  mapLegacyConstituentsToUnified,
  UnifiedAllocationBar,
  type UnifiedSegment,
} from "../allocation";
import {
  buildRealCryptoAssets,
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
    "relative w-full bg-gray-900/50 rounded-xl border border-gray-800 p-3 flex flex-col gap-3 overflow-hidden",
} as const;

/**
 * Builds unified target segments from crypto/stable percentages.
 * Uses marketcap-weighted BTC/ETH split when weights are available.
 */
function buildTargetUnifiedSegments(
  target: { crypto: number; stable: number },
  weights: { btc_weight: number; eth_weight: number } | undefined
): UnifiedSegment[] {
  const btcWeight = weights?.btc_weight ?? 0.8;
  const ethWeight = weights?.eth_weight ?? 0.2;

  // BTC portion of crypto goes to "btc" category
  // ETH portion goes to "alt" category (per unified model: ETH = ALT)
  const segments: UnifiedSegment[] = [];

  const btcPercentage = target.crypto * btcWeight;
  const altPercentage = target.crypto * ethWeight;

  if (btcPercentage > 0) {
    segments.push({
      category: "btc",
      label: "BTC",
      percentage: btcPercentage,
      color: UNIFIED_COLORS.BTC,
    });
  }

  if (altPercentage > 0) {
    segments.push({
      category: "alt",
      label: "ALT",
      percentage: altPercentage,
      color: UNIFIED_COLORS.ALT,
    });
  }

  if (target.stable > 0) {
    segments.push({
      category: "stable",
      label: "STABLE",
      percentage: target.stable,
      color: UNIFIED_COLORS.STABLE,
    });
  }

  return segments.sort((a, b) => b.percentage - a.percentage);
}

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

  // Build target segments with marketcap-weighted BTC/ETH split
  const targetSegments = useMemo(() => {
    if (!target) return [];
    return buildTargetUnifiedSegments(target, allocationWeights);
  }, [target, allocationWeights]);

  // Build current portfolio segments
  const currentSegments = useMemo(() => {
    const cryptoAssets =
      isEmptyState && currentRegime
        ? buildTargetCryptoAssets(currentRegime)
        : buildRealCryptoAssets(data);

    const stablePercentage = isEmptyState
      ? (target?.stable ?? 0)
      : data.currentAllocation.stable;

    return mapLegacyConstituentsToUnified(cryptoAssets, stablePercentage);
  }, [data, isEmptyState, currentRegime, target]);

  // Early return for loading state
  if (isLoading) {
    return <PortfolioCompositionSkeleton />;
  }

  // If we still have no target (missing prop AND missing regime), we can't render meaningful bars
  if (!target) {
    return null;
  }

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
        {/* Target Indicator Bar - Thin indicator with unified categories */}
        <UnifiedAllocationBar
          segments={targetSegments}
          size="sm"
          showLabels={false}
          title="Target Allocation"
          testIdPrefix="target"
        />

        {/* Current Portfolio - Standard size with full labels */}
        <UnifiedAllocationBar
          segments={currentSegments}
          size="md"
          title="Current Portfolio"
          testIdPrefix="current"
        />
      </div>
    </div>
  );
}
