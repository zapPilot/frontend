import { AllocationConfig, RegimeAllocation } from "@/types/backtesting";

export const validateAllocationConfig = (config: AllocationConfig): boolean => {
  const regimes: (keyof Omit<
    AllocationConfig,
    "id" | "name" | "description"
  >)[] = ["extreme_fear", "fear", "neutral", "greed", "extreme_greed"];

  for (const regime of regimes) {
    const alloc = config[regime] as RegimeAllocation;
    const sum = alloc.spot + alloc.lp + alloc.stable;
    if (Math.abs(sum - 100) > 0.01) {
      return false;
    }
  }
  return true;
};

export const PRESET_ALLOCATIONS: AllocationConfig[] = [
  {
    id: "conservative",
    name: "Conservative",
    description: "High stable allocation, minimal LP exposure",
    extreme_fear: { spot: 65, lp: 0, stable: 35 },
    fear: { spot: 20, lp: 35, stable: 45 },
    neutral: { spot: 50, lp: 0, stable: 50 },
    greed: { spot: 50, lp: 5, stable: 45 },
    extreme_greed: { spot: 0, lp: 45, stable: 55 },
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Equal risk distribution across asset types",
    extreme_fear: { spot: 95, lp: 0, stable: 5 },
    fear: { spot: 20, lp: 35, stable: 45 },
    neutral: { spot: 50, lp: 0, stable: 50 },
    greed: { spot: 60, lp: 5, stable: 35 },
    extreme_greed: { spot: 0, lp: 45, stable: 55 },
  },
  {
    id: "aggressive",
    name: "Aggressive",
    description: "Maximum spot and LP exposure, minimal stable",
    extreme_fear: { spot: 100, lp: 0, stable: 0 },
    fear: { spot: 25, lp: 35, stable: 40 },
    neutral: { spot: 50, lp: 0, stable: 50 },
    greed: { spot: 60, lp: 0, stable: 40 },
    extreme_greed: { spot: 0, lp: 45, stable: 55 },
  },
];

export const getAllocationStrategyDisplayName = (configId: string): string => {
  const config = PRESET_ALLOCATIONS.find(c => c.id === configId);
  return config ? config.name : configId.replace(/_/g, " ");
};

export const ALLOCATION_STRATEGY_COLORS: Record<string, string> = {
  smart_dca_conservative: "#10b981",
  smart_dca_balanced: "#3b82f6",
  smart_dca_aggressive: "#ef4444",
  smart_dca_lp_focused: "#06b6d4",
  smart_dca_spot_accumulation: "#f59e0b",
};
