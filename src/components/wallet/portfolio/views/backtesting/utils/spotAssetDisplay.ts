import { ASSET_CATEGORIES } from "@/constants/portfolio";
import type {
  BacktestSpotAssetSymbol,
  BacktestStrategyPoint,
} from "@/types/backtesting";

export type SpotAssetSymbol = BacktestSpotAssetSymbol;

const BACKTEST_SPOT_ASSET_COLORS: Record<SpotAssetSymbol, string> = {
  BTC: ASSET_CATEGORIES.btc.chartColor,
  ETH: ASSET_CATEGORIES.eth.chartColor,
} as const;

/**
 * Returns the shared chart color used for a normalized backtesting spot asset.
 *
 * @param asset - Normalized spot asset symbol from backtesting decisions.
 * @returns The portfolio chart color aligned to the requested asset.
 * @example
 * ```ts
 * getBacktestSpotAssetColor("BTC");
 * ```
 */
export function getBacktestSpotAssetColor(asset: SpotAssetSymbol): string {
  return BACKTEST_SPOT_ASSET_COLORS[asset];
}

/**
 * Normalizes arbitrary spot asset values from backtesting payloads.
 *
 * @param value - Unknown backend value for a spot asset.
 * @returns A normalized spot asset symbol or `null` when unsupported.
 * @example
 * ```ts
 * normalizeBacktestSpotAsset(" eth ");
 * ```
 */
function normalizeBacktestSpotAsset(value: unknown): SpotAssetSymbol | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "BTC" || normalized === "ETH") {
    return normalized;
  }

  return null;
}

type SpotAssetStrategyLike = Pick<
  BacktestStrategyPoint,
  "portfolio" | "decision"
>;

/**
 * Resolves the current spot asset for a backtesting strategy point.
 *
 * Uses `portfolio.spot_asset` as the canonical source and falls back to the
 * legacy decision metadata during backend rollout. Stable-only points return
 * `null` because they do not currently hold a spot asset.
 *
 * @param strategy - Strategy point to inspect.
 * @returns The current spot asset symbol or `null` when no spot exposure exists.
 * @example
 * ```ts
 * resolveBacktestSpotAsset(strategyPoint);
 * ```
 */
export function resolveBacktestSpotAsset(
  strategy: SpotAssetStrategyLike | null | undefined
): SpotAssetSymbol | null {
  if (!strategy) {
    return null;
  }

  if (strategy.portfolio.allocation.spot <= 0) {
    return null;
  }

  return (
    normalizeBacktestSpotAsset(strategy.portfolio.spot_asset) ??
    normalizeBacktestSpotAsset(strategy.decision.details?.target_spot_asset)
  );
}
