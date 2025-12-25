import { type LucideIcon, Pause, TrendingDown, TrendingUp } from "lucide-react";

/**
 * Shared allocation states used across regime transitions.
 * Each state represents a unique portfolio composition in the flow.
 * Using shared objects ensures allocation consistency between connected regimes.
 */
export const ALLOCATION_STATES = {
  HEAVY_STABLE: { spot: 10, lp: 20, stable: 70 },
  HEAVY_SPOT: { spot: 70, lp: 0, stable: 30 },
  PROFIT_TAKEN: { spot: 0, lp: 30, stable: 70 },
  BALANCED_LP: { spot: 60, lp: 10, stable: 30 },
} as const;

export const PHILOSOPHIES = {
  BUFFETT_FEARFUL: {
    philosophy: '"Be greedy when others are fearful"',
    author: "Warren Buffett",
  },
  ROTHSCHILD_BLOOD: {
    philosophy: '"Buy when there\'s blood in the streets"',
    author: "Nathan Rothschild",
  },
  LIVERMORE_SITTING: {
    philosophy: '"It was always my sitting that made the big money"',
    author: "Jesse Livermore",
  },
  BARUCH_PROFIT: {
    philosophy: '"Nobody ever went broke taking a profit"',
    author: "Bernard Baruch",
  },
  BUFFETT_GREEDY: {
    philosophy: '"Be fearful when others are greedy"',
    author: "Warren Buffett",
  },
} as const;

export type RegimeId = "ef" | "f" | "n" | "g" | "eg";

interface AllocationBreakdown {
  spot: number;
  lp: number;
  stable: number;
}

export interface RegimeStrategy {
  philosophy: string;
  author: string;
  useCase?: {
    scenario: string;
    userIntent: string;
    zapAction: string;
    allocationBefore: AllocationBreakdown;
    allocationAfter: AllocationBreakdown;
    hideAllocationTarget?: boolean;
  };
}

export interface Regime {
  id: RegimeId;
  label: string;

  fillColor: string;
  // Visual configuration for UI components
  visual: {
    /** Tailwind badge classes for regime badge styling */
    badge: string;
    /** Tailwind gradient classes for visual elements */
    gradient: string;
    /** Lucide icon component for regime representation */
    icon: LucideIcon;
  };
  strategies:
    | {
        fromLeft: RegimeStrategy;
        fromRight: RegimeStrategy;
        default?: never;
      }
    | {
        fromLeft?: never;
        fromRight?: never;
        default: RegimeStrategy;
      };
}

export const regimes: Regime[] = [
  {
    id: "ef",
    label: "Extreme Fear",
    fillColor: "#22c55e",
    visual: {
      badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      gradient: "from-emerald-400 to-green-500",
      icon: TrendingDown,
    },
    strategies: {
      default: {
        ...PHILOSOPHIES.BUFFETT_FEARFUL,
        useCase: {
          scenario: "Bitcoin drops 33% from recent highs. FGI drops to 15.",
          userIntent: "I want to DCA into BTC/ETH without timing the bottom.",
          zapAction:
            "Aggressively accumulates Bitcoin while prices are low. Shifts capital from stablecoins to crypto over 10 days to capture the bottom.",
          allocationBefore: ALLOCATION_STATES.HEAVY_STABLE,
          allocationAfter: ALLOCATION_STATES.HEAVY_SPOT,
        },
      },
    },
  },
  {
    id: "f",
    label: "Fear",

    fillColor: "#84cc16",
    visual: {
      badge: "bg-green-500/20 text-green-400 border-green-500/30",
      gradient: "from-green-400 to-teal-500",
      icon: TrendingDown,
    },
    strategies: {
      fromLeft: {
        ...PHILOSOPHIES.LIVERMORE_SITTING,
        useCase: {
          scenario:
            "Bitcoin stabilizes after bouncing 12% from recent lows. FGI rises to 35.",
          userIntent: "I want to hold my positions during early recovery.",
          zapAction:
            "Maintains your position to catch the recovery. Zero rebalancing unless risk spikes.",
          allocationBefore: ALLOCATION_STATES.HEAVY_SPOT,
          allocationAfter: ALLOCATION_STATES.HEAVY_SPOT,
          hideAllocationTarget: true,
        },
      },
      fromRight: {
        ...PHILOSOPHIES.ROTHSCHILD_BLOOD,
        useCase: {
          scenario: "Bitcoin drops 8% from recent peak. FGI falls to 35.",
          userIntent: "I want to increase spot exposure as market fear grows.",
          zapAction:
            "Gradually shifts heavily into spot Bitcoin. Unwinds Liquidity Pool positions to remove impermanent loss risk.",
          allocationBefore: ALLOCATION_STATES.PROFIT_TAKEN,
          allocationAfter: ALLOCATION_STATES.HEAVY_STABLE,
        },
      },
    },
  },
  {
    id: "n",
    label: "Neutral",

    fillColor: "#eab308",
    visual: {
      badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      gradient: "from-yellow-400 to-amber-500",
      icon: Pause,
    },
    strategies: {
      default: {
        ...PHILOSOPHIES.LIVERMORE_SITTING,
        useCase: {
          scenario: "FGI hovers between 46-54 for weeks.",
          userIntent: "I don't want to overtrade or pay fees.",
          zapAction:
            "Zero rebalancing. Monitors borrowing rates and auto-repays debt if costs get too high. Enjoy the break.",
          allocationBefore: ALLOCATION_STATES.HEAVY_SPOT,
          allocationAfter: ALLOCATION_STATES.HEAVY_SPOT,
          hideAllocationTarget: true,
        },
      },
    },
  },
  {
    id: "g",
    label: "Greed",

    fillColor: "#f97316",
    visual: {
      badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      gradient: "from-orange-400 to-red-500",
      icon: TrendingUp,
    },
    strategies: {
      fromLeft: {
        ...PHILOSOPHIES.BARUCH_PROFIT,
        useCase: {
          scenario: "FGI rises to 65 during a bull run.",
          userIntent:
            "I want to lock in gains while keeping exposure and earning fees.",
          zapAction:
            "Locks in gains by moving spot Bitcoin into yield-bearing Liquidity Pools. Earns fees while the market chops sideways.",
          allocationBefore: ALLOCATION_STATES.HEAVY_SPOT,
          allocationAfter: ALLOCATION_STATES.BALANCED_LP,
        },
      },
      fromRight: {
        ...PHILOSOPHIES.LIVERMORE_SITTING,
        useCase: {
          scenario: "Bitcoin corrects 25% from peak. FGI drops to 65.",
          userIntent: "I want to avoid catching falling knives.",
          zapAction:
            "Sits tight. Your portfolio was already de-risked before the drop.",
          allocationBefore: ALLOCATION_STATES.PROFIT_TAKEN,
          allocationAfter: ALLOCATION_STATES.PROFIT_TAKEN,
          hideAllocationTarget: true,
        },
      },
    },
  },
  {
    id: "eg",
    label: "Extreme Greed",

    fillColor: "#ef4444",
    visual: {
      badge: "bg-red-500/20 text-red-400 border-red-500/30",
      gradient: "from-red-400 to-orange-500",
      icon: TrendingUp,
    },
    strategies: {
      default: {
        ...PHILOSOPHIES.BUFFETT_GREEDY,
        useCase: {
          scenario: "Bitcoin rallies 67% from recent lows. FGI hits 92.",
          userIntent: "I want to take profits but keep some exposure.",
          zapAction:
            "Takes maximum profits. Sells 50% of crypto into stablecoins to lock in generational wealth before the crash.",
          allocationBefore: ALLOCATION_STATES.BALANCED_LP,
          allocationAfter: ALLOCATION_STATES.PROFIT_TAKEN,
        },
      },
    },
  },
];

// regimeOrder removed - unused (2025-12-22)

/**
 * Get regime configuration by ID
 * @param regimeId - The regime identifier
 * @returns Regime configuration object
 */
export function getRegimeById(regimeId: RegimeId): Regime {
  const regime = regimes.find(r => r.id === regimeId);

  if (!regime) {
    // Fallback to neutral regime if not found
    const neutralRegime = regimes.find(r => r.id === "n");
    if (!neutralRegime) {
      throw new Error("Critical: Neutral regime not found in regimes array");
    }
    return neutralRegime;
  }

  // ... existing code ...
  return regime;
}

/**
 * Get the target allocation for a regime based on its default strategy
 * @param regime - The regime configuration
 * @returns Allocation split (crypto/stable)
 */
export function getRegimeAllocation(regime: Regime) {
  // Try default first, then fromLeft (first tab) if default is missing
  const strategy = regime.strategies.default || regime.strategies.fromLeft;
  const target = strategy?.useCase?.allocationAfter;

  if (target) {
    return {
      spot: target.spot,
      lp: target.lp,
      stable: target.stable,
    };
  }

  throw new Error(
    `Critical: No valid strategy found for regime ${regime.id} to determine allocation`
  );
}
