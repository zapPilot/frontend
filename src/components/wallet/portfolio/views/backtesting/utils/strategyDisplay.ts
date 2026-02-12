import {
  DCA_CLASSIC_STRATEGY_ID,
  SIMPLE_REGIME_STRATEGY_ID,
} from "../constants";

const STRATEGY_DISPLAY_NAMES: Record<string, string> = {
  [DCA_CLASSIC_STRATEGY_ID]: "DCA Classic",
  [SIMPLE_REGIME_STRATEGY_ID]: "Simple Regime",
};

const DCA_CLASSIC_COLOR = "#4b5563";
const DEFAULT_COLOR = "#3b82f6";

const STRATEGY_PALETTE = [
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f97316", // Orange
  "#84cc16", // Lime
  "#14b8a6", // Teal
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#d946ef", // Fuchsia
  "#f43f5e", // Rose
  "#0ea5e9", // Sky
];

export function getStrategyDisplayName(strategyId: string): string {
  return STRATEGY_DISPLAY_NAMES[strategyId] ?? strategyId.replace(/_/g, " ");
}

export function getStrategyColor(strategyId: string, index?: number): string {
  if (
    strategyId === DCA_CLASSIC_STRATEGY_ID ||
    strategyId.includes(DCA_CLASSIC_STRATEGY_ID)
  ) {
    return DCA_CLASSIC_COLOR;
  }

  if (typeof index === "number") {
    return STRATEGY_PALETTE[index % STRATEGY_PALETTE.length] ?? DEFAULT_COLOR;
  }

  // Fallback to hashing when no index provided
  let hash = 0;
  for (let i = 0; i < strategyId.length; i++) {
    hash = strategyId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (
    STRATEGY_PALETTE[Math.abs(hash) % STRATEGY_PALETTE.length] ?? DEFAULT_COLOR
  );
}

function sumValue(value: number | Record<string, number>): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    return Object.values(value).reduce((a, b) => a + b, 0);
  }
  return 0;
}

/**
 * Calculate percentage ratios from constituent absolute values.
 * Returns percentages for spot, stable, and lp components.
 *
 * Both spot and lp support either a single number or a Record<string, number>
 * to handle both single-token and multi-token (index) modes.
 */
export function calculatePercentages(constituents: {
  spot: number | Record<string, number>;
  stable: number;
  lp: number | Record<string, number>;
}): { spot: number; stable: number; lp: number } {
  const spotValue = sumValue(constituents.spot);
  const lpValue = sumValue(constituents.lp);
  const total = spotValue + constituents.stable + lpValue;
  if (total === 0) return { spot: 0, stable: 0, lp: 0 };
  return {
    spot: (spotValue / total) * 100,
    stable: (constituents.stable / total) * 100,
    lp: (lpValue / total) * 100,
  };
}
