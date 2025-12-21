import {
  AssetAllocationPoint,
  PortfolioDataPoint,
} from "@/types/domain/portfolio";

import { useChartHover } from "../../hooks/useChartHover";
import { ensureNonNegative } from "../../utils/mathUtils";
import type {
  AllocationTimeseriesInputPoint,
  PortfolioStackedDataPoint,
} from "./types";

export const DEFAULT_STACKED_FALLBACK_RATIO = 0.65;

export const CHART_LABELS = {
  performance: "Total return chart showing portfolio value over time",
  "asset-allocation": "Asset allocation chart showing portfolio composition",
  drawdown: "Drawdown analysis chart showing peak-to-trough declines",
  sharpe: "Sharpe ratio chart showing risk-adjusted returns",
  volatility: "Volatility chart showing portfolio risk metrics",
  "daily-yield": "Daily yield returns chart showing earnings over time",
} as const;

export const CHART_CONTENT_ID = "portfolio-chart-content";
export const ENABLE_TEST_AUTO_HOVER = process.env.NODE_ENV === "test";

/**
 * Builds stacked portfolio data using real protocol source types.
 * Falls back to a deterministic split when source data is unavailable.
 */
interface SourceTotals {
  defiValue: number;
  walletValue: number;
}

function normalizeSourceType(value: unknown): string | undefined {
  return typeof value === "string" ? value.toLowerCase() : undefined;
}

function accumulateSourceTotals(
  entries: PortfolioDataPoint["categories"] | PortfolioDataPoint["protocols"]
): SourceTotals {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { defiValue: 0, walletValue: 0 };
  }

  return entries.reduce<SourceTotals>(
    (totals, entry) => {
      const normalizedSource = normalizeSourceType(entry.sourceType);
      const rawValue = entry.value;
      const value = Number.isFinite(rawValue) ? ensureNonNegative(rawValue) : 0;

      if (normalizedSource === "defi") {
        totals.defiValue += value;
      } else if (normalizedSource === "wallet") {
        totals.walletValue += value;
      }

      return totals;
    },
    { defiValue: 0, walletValue: 0 }
  );
}

function normalizeStackedTotals(
  totalValue: number,
  initialDefi: number,
  initialWallet: number,
  fallbackRatio: number
): SourceTotals & { stackedTotalValue: number } {
  let defiValue = initialDefi;
  let walletValue = initialWallet;
  let stackedTotalValue = defiValue + walletValue;

  if (stackedTotalValue > 0 && totalValue > 0) {
    const scale = totalValue / stackedTotalValue;
    defiValue *= scale;
    walletValue *= scale;
    stackedTotalValue = defiValue + walletValue;
  }

  if (stackedTotalValue === 0 && totalValue > 0) {
    const fallbackDefi = totalValue * fallbackRatio;
    defiValue = fallbackDefi;
    walletValue = ensureNonNegative(totalValue - fallbackDefi);
    stackedTotalValue = defiValue + walletValue;
  }

  if (stackedTotalValue === 0) {
    stackedTotalValue = ensureNonNegative(totalValue);
  }

  return { defiValue, walletValue, stackedTotalValue };
}

export const buildStackedPortfolioData = (
  data: PortfolioDataPoint[],
  fallbackRatio: number = DEFAULT_STACKED_FALLBACK_RATIO
): PortfolioStackedDataPoint[] => {
  return data.map(point => {
    const categoryTotals = accumulateSourceTotals(point.categories);
    const protocolTotals =
      categoryTotals.defiValue === 0 && categoryTotals.walletValue === 0
        ? accumulateSourceTotals(point.protocols)
        : { defiValue: 0, walletValue: 0 };

    const initialDefi = categoryTotals.defiValue + protocolTotals.defiValue;
    const initialWallet =
      categoryTotals.walletValue + protocolTotals.walletValue;

    const normalizedTotals = normalizeStackedTotals(
      point.value,
      initialDefi,
      initialWallet,
      fallbackRatio
    );

    return {
      ...point,
      defiValue: normalizedTotals.defiValue,
      walletValue: normalizedTotals.walletValue,
      stackedTotalValue: normalizedTotals.stackedTotalValue,
    } satisfies PortfolioStackedDataPoint;
  });
};

export const getStackedTotalValue = (
  point: PortfolioStackedDataPoint
): number => {
  if (point.stackedTotalValue > 0) {
    return point.stackedTotalValue;
  }

  const fallback = point.defiValue + point.walletValue;
  return fallback > 0 ? fallback : point.value;
};

/**
 * Helper to generate consistent event handler props for chart interactions
 * Consolidates ~72 lines of repeated event handlers across 6 chart types
 */
export const getChartInteractionProps = (
  hoverState: ReturnType<typeof useChartHover>
) => ({
  onMouseMove: hoverState.handleMouseMove,
  onMouseOver: hoverState.handleMouseMove,
  onMouseEnter: hoverState.handleMouseMove,
  onMouseDown: hoverState.handleMouseMove,
  onClick: hoverState.handleMouseMove,
  onPointerMove: hoverState.handlePointerMove,
  onPointerDown: hoverState.handlePointerDown,
  onPointerOver: hoverState.handlePointerMove,
  onMouseLeave: hoverState.handleMouseLeave,
  onMouseOut: hoverState.handleMouseLeave,
  onBlur: hoverState.handleMouseLeave,
  onPointerLeave: hoverState.handleMouseLeave,
  onTouchStart: hoverState.handleTouchMove,
  onTouchMove: hoverState.handleTouchMove,
  onTouchEnd: hoverState.handleTouchEnd,
  onTouchCancel: hoverState.handleTouchEnd,
});

export function buildAllocationHistory(
  rawPoints: AllocationTimeseriesInputPoint[]
): AssetAllocationPoint[] {
  if (rawPoints.length === 0) {
    return [];
  }

  const allocationByDate: Record<string, AssetAllocationPoint> = {};

  for (const point of rawPoints) {
    const dateKey = point.date;
    const dayData =
      allocationByDate[dateKey] ??
      (allocationByDate[dateKey] = {
        date: dateKey,
        btc: 0,
        eth: 0,
        stablecoin: 0,
        altcoin: 0,
      });

    const categoryKey = (point.category ?? point.protocol ?? "")
      .toString()
      .toLowerCase();

    const percentageValue = Number(
      point.allocation_percentage ??
        point.percentage_of_portfolio ??
        point.percentage ??
        0
    );

    const categoryValue = Number(
      point.category_value_usd ?? point.category_value ?? 0
    );
    const totalValue = Number(
      point.total_portfolio_value_usd ?? point.total_value ?? 0
    );

    let computedShare = 0;
    if (!Number.isNaN(percentageValue) && percentageValue !== 0) {
      computedShare = percentageValue;
    } else if (totalValue > 0 && !Number.isNaN(categoryValue)) {
      computedShare = (categoryValue / totalValue) * 100;
    }

    // Filter out negative allocations (debt positions) and invalid values
    // Debt positions should not be included in asset allocation chart
    // They are tracked separately in LandingPageResponse.category_summary_debt
    if (!Number.isFinite(computedShare) || computedShare <= 0) {
      continue;
    }

    if (categoryKey.includes("btc") || categoryKey.includes("bitcoin")) {
      dayData.btc += computedShare;
    } else if (
      categoryKey.includes("eth") ||
      categoryKey.includes("ethereum")
    ) {
      dayData.eth += computedShare;
    } else if (categoryKey.includes("stable")) {
      dayData.stablecoin += computedShare;
    } else {
      dayData.altcoin += computedShare;
    }
  }

  return Object.values(allocationByDate)
    .map(point => {
      const total = point.btc + point.eth + point.stablecoin + point.altcoin;

      if (total <= 0) {
        return point;
      }

      return {
        ...point,
        btc: (point.btc / total) * 100,
        eth: (point.eth / total) * 100,
        stablecoin: (point.stablecoin / total) * 100,
        altcoin: (point.altcoin / total) * 100,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
