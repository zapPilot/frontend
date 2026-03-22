import type {
  UnifiedCategory,
  UnifiedSegment,
} from "@/components/wallet/portfolio/components/allocation";
import type {
  BacktestBucket,
  BacktestPortfolioAllocation,
  BacktestTransferMetadata,
} from "@/types/backtesting";

interface BacktestBucketConfig {
  label: string;
  shortLabel: string;
  color: string;
  segmentCategory: UnifiedCategory;
}

type BacktestTransferDirection = "stable_to_spot" | "spot_to_stable";

/** Spot asset colors matching CHART_SIGNALS (switch_to_btc / switch_to_eth). */
const SPOT_ASSET_COLORS: Record<"BTC" | "ETH", string> = {
  BTC: "#f97316",
  ETH: "#8b5cf6",
};

export const BACKTEST_BUCKETS = [
  "spot",
  "stable",
] as const satisfies readonly BacktestBucket[];

const BACKTEST_BUCKET_CONFIG: Record<BacktestBucket, BacktestBucketConfig> = {
  spot: {
    label: "Spot",
    shortLabel: "SPOT",
    color: "#f59e0b",
    segmentCategory: "btc",
  },
  stable: {
    label: "Stable",
    shortLabel: "STABLE",
    color: "#10b981",
    segmentCategory: "stable",
  },
};

export function isBacktestBucket(value: unknown): value is BacktestBucket {
  return (
    typeof value === "string" &&
    BACKTEST_BUCKETS.includes(value as BacktestBucket)
  );
}

export function isBacktestTransfer(
  value: unknown
): value is BacktestTransferMetadata {
  if (!value || typeof value !== "object") {
    return false;
  }

  const transfer = value as Partial<BacktestTransferMetadata>;

  return (
    isBacktestBucket(transfer.from_bucket) &&
    isBacktestBucket(transfer.to_bucket) &&
    typeof transfer.amount_usd === "number"
  );
}

export function hasBacktestAllocation(
  allocation: BacktestPortfolioAllocation
): boolean {
  return BACKTEST_BUCKETS.some(bucket => allocation[bucket] > 0);
}

export function buildBacktestAllocationSegments(
  allocation: BacktestPortfolioAllocation,
  spotAssetLabel?: "BTC" | "ETH"
): UnifiedSegment[] {
  return BACKTEST_BUCKETS.map(bucket => {
    const config = BACKTEST_BUCKET_CONFIG[bucket];
    const segmentLabel =
      bucket === "spot"
        ? (spotAssetLabel ?? config.shortLabel)
        : config.shortLabel;

    const segmentColor =
      bucket === "spot" && spotAssetLabel
        ? (SPOT_ASSET_COLORS[spotAssetLabel] ?? config.color)
        : config.color;

    return {
      category: config.segmentCategory,
      label: segmentLabel,
      percentage: allocation[bucket] * 100,
      color: segmentColor,
    };
  }).filter(segment => segment.percentage > 0);
}

export function getBacktestTransferDirection(
  fromBucket: BacktestBucket,
  toBucket: BacktestBucket
): BacktestTransferDirection | null {
  if (fromBucket === "stable" && toBucket === "spot") {
    return "stable_to_spot";
  }

  if (fromBucket === "spot" && toBucket === "stable") {
    return "spot_to_stable";
  }

  return null;
}
