import {
  ALLOCATION_STRATEGY_COLORS,
  getAllocationStrategyDisplayName,
  STRATEGY_COLORS,
  STRATEGY_DISPLAY_NAMES,
} from "../constants";

export function getStrategyDisplayName(strategyId: string): string {
  if (STRATEGY_DISPLAY_NAMES[strategyId]) {
    return STRATEGY_DISPLAY_NAMES[strategyId];
  }

  if (strategyId.startsWith("smart_dca_")) {
    const configId = strategyId.replace("smart_dca_", "");
    return getAllocationStrategyDisplayName(configId);
  }

  return strategyId.replace(/_/g, " ");
}

export function getStrategyColor(strategyId: string): string {
  if (STRATEGY_COLORS[strategyId]) {
    return STRATEGY_COLORS[strategyId];
  }

  if (ALLOCATION_STRATEGY_COLORS[strategyId]) {
    return ALLOCATION_STRATEGY_COLORS[strategyId];
  }

  const fallbackColors = [
    "#8b5cf6",
    "#ec4899",
    "#f97316",
    "#84cc16",
    "#14b8a6",
    "#6366f1",
    "#f43f5e",
    "#eab308",
  ];

  let hash = 0;
  for (let i = 0; i < strategyId.length; i++) {
    hash = strategyId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return fallbackColors[Math.abs(hash) % fallbackColors.length] || "#6b7280";
}

/**
 * Calculate percentage ratios from constituent absolute values.
 * Returns percentages for spot, stable, and lp components.
 */
export function calculatePercentages(constituents: {
  spot: number;
  stable: number;
  lp: number;
}): { spot: number; stable: number; lp: number } {
  const total = constituents.spot + constituents.stable + constituents.lp;
  if (total === 0) return { spot: 0, stable: 0, lp: 0 };
  return {
    spot: (constituents.spot / total) * 100,
    stable: (constituents.stable / total) * 100,
    lp: (constituents.lp / total) * 100,
  };
}
