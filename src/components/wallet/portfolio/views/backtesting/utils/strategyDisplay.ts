const STRATEGY_DISPLAY_NAMES: Record<string, string> = {
  dca_classic: "DCA Classic",
  simple_regime: "Simple Regime",
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
  if (strategyId === "dca_classic" || strategyId.includes("dca_classic")) {
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

/**
 * Calculate percentage ratios from constituent absolute values.
 * Returns percentages for spot, stable, and lp components.
 */
export function calculatePercentages(constituents: {
  spot: number | Record<string, number>;
  stable: number;
  lp: number;
}): { spot: number; stable: number; lp: number } {
  let spotValue = 0;
  if (typeof constituents.spot === "number") {
    spotValue = constituents.spot;
  } else if (constituents.spot && typeof constituents.spot === "object") {
    spotValue = Object.values(constituents.spot).reduce((a, b) => a + b, 0);
  }

  const total = spotValue + constituents.stable + constituents.lp;
  if (total === 0) return { spot: 0, stable: 0, lp: 0 };
  return {
    spot: (spotValue / total) * 100,
    stable: (constituents.stable / total) * 100,
    lp: (constituents.lp / total) * 100,
  };
}
