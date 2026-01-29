const STRATEGY_DISPLAY_NAMES: Record<string, string> = {
  dca_classic: "DCA Classic",
  simple_regime: "Simple Regime",
};

const STRATEGY_COLORS: Record<string, string> = {
  dca_classic: "#4b5563",
  simple_regime: "#3b82f6",
};

export function getStrategyDisplayName(strategyId: string): string {
  return STRATEGY_DISPLAY_NAMES[strategyId] ?? strategyId.replace(/_/g, " ");
}

export function getStrategyColor(strategyId: string): string {
  if (STRATEGY_COLORS[strategyId]) {
    return STRATEGY_COLORS[strategyId];
  }

  const fallbackColors = [
    "#06b6d4",
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

  return fallbackColors[Math.abs(hash) % fallbackColors.length] ?? "#6b7280";
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
