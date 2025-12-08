/**
 * Regime Data Configuration
 *
 * Defines market sentiment regimes with corresponding allocation strategies.
 * Based on All-Weather Portfolio principles adapted for crypto markets.
 */

export type RegimeId = "ef" | "f" | "n" | "g" | "eg";

interface Regime {
  id: RegimeId;
  label: string;
  fillColor: string;
  philosophy: string;
  whyThisWorks?: string;
  actions?: string[];
  range?: string;
  allocation: {
    crypto: number;
    stable: number;
  };
}

export const regimes: Regime[] = [
  {
    id: "ef",
    label: "Extreme Fear",
    fillColor: "#10b981", // emerald-400
    philosophy: "Buy when others are fearful. Maintain conservative position sizing.",
    whyThisWorks: "Market panic creates opportunities for disciplined investors. Lower allocations protect capital while maintaining exposure to potential recovery.",
    actions: [
      "Gradually increase crypto exposure",
      "Focus on blue-chip assets",
      "Set strict stop-losses",
      "Monitor for capitulation signals"
    ],
    range: "0-25",
    allocation: {
      crypto: 30,
      stable: 70,
    },
  },
  {
    id: "f",
    label: "Fear",
    fillColor: "#84cc16", // lime-400
    philosophy: "Cautiously increase exposure as sentiment improves.",
    whyThisWorks: "Fear phases often precede recoveries. Moderate allocations balance opportunity with risk management.",
    actions: [
      "Build positions incrementally",
      "Diversify across quality assets",
      "Maintain liquidity reserves",
      "Watch for trend reversals"
    ],
    range: "26-45",
    allocation: {
      crypto: 45,
      stable: 55,
    },
  },
  {
    id: "n",
    label: "Neutral",
    fillColor: "#fcd34d", // amber-300
    philosophy: "Balanced allocation across assets. Monitor for regime shifts.",
    whyThisWorks: "Neutral markets require flexibility. Equal weighting prepares for movement in either direction.",
    actions: [
      "Maintain balanced portfolio",
      "Rebalance regularly",
      "Monitor sentiment indicators",
      "Prepare for volatility"
    ],
    range: "46-54",
    allocation: {
      crypto: 50,
      stable: 50,
    },
  },
  {
    id: "g",
    label: "Greed",
    fillColor: "#fb923c", // orange-400
    philosophy: "Take profits opportunistically. Reduce exposure to overheated markets.",
    whyThisWorks: "Greed phases often precede corrections. Higher allocations capture upside while preparing for pullbacks.",
    actions: [
      "Scale out of winning positions",
      "Lock in profits systematically",
      "Increase stable allocation",
      "Watch for exhaustion signals"
    ],
    range: "55-75",
    allocation: {
      crypto: 75,
      stable: 25,
    },
  },
  {
    id: "eg",
    label: "Extreme Greed",
    fillColor: "#fb7185", // rose-400
    philosophy: "Sell into strength. Preserve capital for the next cycle.",
    whyThisWorks: "Extreme euphoria signals market tops. Maximum crypto exposure captures final gains before inevitable corrections.",
    actions: [
      "Aggressively take profits",
      "Reduce risk exposure",
      "Build cash reserves",
      "Prepare for regime shift"
    ],
    range: "76-100",
    allocation: {
      crypto: 90,
      stable: 10,
    },
  },
];

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

  return regime;
}
