import { useChartHover } from "../../hooks/useChartHover";
import { ensureNonNegative } from "../../lib/mathUtils";
import {
  AssetAllocationPoint,
  PortfolioDataPoint,
} from "../../types/portfolio";
import type {
  AllocationTimeseriesInputPoint,
  PortfolioStackedDataPoint,
} from "./types";

export const DEFAULT_STACKED_FALLBACK_RATIO = 0.65;

export const CHART_LABELS = {
  performance: "Portfolio value chart showing net worth over time",
  allocation: "Portfolio allocation chart",
  drawdown: "Drawdown and recovery analysis chart",
  sharpe: "Rolling Sharpe ratio chart",
  volatility: "Portfolio volatility chart",
} as const;

export const CHART_CONTENT_ID = "portfolio-chart-content";
export const ENABLE_TEST_AUTO_HOVER = process.env.NODE_ENV === "test";

/**
 * Builds stacked portfolio data using real protocol source types.
 * Falls back to a deterministic split when source data is unavailable.
 */
export const buildStackedPortfolioData = (
  data: PortfolioDataPoint[],
  fallbackRatio: number = DEFAULT_STACKED_FALLBACK_RATIO
): PortfolioStackedDataPoint[] => {
  return data.map(point => {
    let defiValue = 0;
    let walletValue = 0;

    const categories = Array.isArray(point.categories) ? point.categories : [];

    if (categories.length > 0) {
      for (const categoryEntry of categories) {
        const normalizedSource =
          typeof categoryEntry.sourceType === "string"
            ? categoryEntry.sourceType.toLowerCase()
            : undefined;
        const rawValue = Number(categoryEntry.value ?? 0);
        const value = Number.isFinite(rawValue)
          ? ensureNonNegative(rawValue)
          : 0;

        if (normalizedSource === "defi") {
          defiValue += value;
        } else if (normalizedSource === "wallet") {
          walletValue += value;
        }
      }
    }

    if (defiValue === 0 && walletValue === 0) {
      if (Array.isArray(point.protocols) && point.protocols.length > 0) {
        for (const protocol of point.protocols) {
          const normalizedSource =
            typeof protocol.sourceType === "string"
              ? protocol.sourceType.toLowerCase()
              : undefined;
          const rawValue = Number(protocol.value ?? 0);
          const value = Number.isFinite(rawValue)
            ? ensureNonNegative(rawValue)
            : 0;

          if (normalizedSource === "defi") {
            defiValue += value;
          } else if (normalizedSource === "wallet") {
            walletValue += value;
          }
        }
      }
    }

    let stackedTotalValue = defiValue + walletValue;

    if (stackedTotalValue > 0 && point.value > 0) {
      const scale = point.value / stackedTotalValue;
      defiValue *= scale;
      walletValue *= scale;
      stackedTotalValue = defiValue + walletValue;
    }

    if (stackedTotalValue === 0 && point.value > 0) {
      const fallbackDefi = point.value * fallbackRatio;
      defiValue = fallbackDefi;
      walletValue = ensureNonNegative(point.value - fallbackDefi);
      stackedTotalValue = defiValue + walletValue;
    }

    if (stackedTotalValue === 0) {
      stackedTotalValue = ensureNonNegative(point.value);
    }

    return {
      ...point,
      defiValue,
      walletValue,
      stackedTotalValue,
    } satisfies PortfolioStackedDataPoint;
  });
};

export const getStackedTotalValue = (
  point: PortfolioStackedDataPoint
): number => {
  const aggregated =
    point.stackedTotalValue ?? point.defiValue + point.walletValue;
  return aggregated > 0 ? aggregated : point.value;
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
  if (!rawPoints || rawPoints.length === 0) {
    return [];
  }

  const allocationByDate = rawPoints.reduce(
    (acc, point) => {
      const dateKey = point.date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          btc: 0,
          eth: 0,
          stablecoin: 0,
          altcoin: 0,
        };
      }

      const dayData = acc[dateKey]!;
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

      const computedShare =
        !Number.isNaN(percentageValue) && percentageValue !== 0
          ? percentageValue
          : totalValue > 0 && !Number.isNaN(categoryValue)
            ? (categoryValue / totalValue) * 100
            : 0;

      if (Number.isNaN(computedShare) || computedShare === 0) {
        return acc;
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
        // Map DeFi protocols to altcoin category
        dayData.altcoin += computedShare;
      }

      return acc;
    },
    {} as Record<string, AssetAllocationPoint>
  );

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
