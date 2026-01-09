/**
 * Risk Metrics Thresholds and Display Configuration
 *
 * Defines health rate thresholds and color mappings for leverage position risk visualization.
 */

/**
 * Health Rate Risk Levels
 *
 * Health Rate represents portfolio safety for leveraged positions:
 * - Formula: (Collateral * LTV) / Debt
 * - 1.0 = 100% (at liquidation threshold)
 * - >1.0 = Safe (buffer above liquidation)
 * - <1.0 = Underwater (at risk of immediate liquidation)
 */
enum RiskLevel {
  SAFE = "SAFE",
  MODERATE = "MODERATE",
  RISKY = "RISKY",
  CRITICAL = "CRITICAL",
}

/**
 * Health Rate Thresholds
 *
 * Defines numerical boundaries for each risk level.
 */
export const HEALTH_RATE_THRESHOLDS = {
  SAFE: 2.0, // Above 2.0 = Green (100% buffer)
  MODERATE: 1.5, // 1.5-2.0 = Yellow (50% buffer)
  RISKY: 1.2, // 1.2-1.5 = Orange (20% buffer)
  CRITICAL: 1.0, // Below 1.2 = Red (approaching liquidation)
} as const;

/**
 * Risk Level Color Scheme
 *
 * Tailwind color classes for each risk level.
 */
export const RISK_COLORS = {
  [RiskLevel.SAFE]: {
    text: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    emoji: "🟢",
  },
  [RiskLevel.MODERATE]: {
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    emoji: "🟡",
  },
  [RiskLevel.RISKY]: {
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    emoji: "🟠",
  },
  [RiskLevel.CRITICAL]: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    emoji: "🔴",
  },
} as const;

/**
 * Risk Level Labels
 *
 * Human-readable labels for each risk level.
 */
export const RISK_LABELS = {
  [RiskLevel.SAFE]: "Safe",
  [RiskLevel.MODERATE]: "Moderate",
  [RiskLevel.RISKY]: "Risky",
  [RiskLevel.CRITICAL]: "Critical",
} as const;

/**
 * Determines risk level from health rate value
 *
 * @param healthRate - Portfolio health rate (1.0 = 100%)
 * @returns Risk level classification
 *
 * @example
 * ```typescript
 * getRiskLevel(2.5) // RiskLevel.SAFE
 * getRiskLevel(1.7) // RiskLevel.MODERATE
 * getRiskLevel(1.3) // RiskLevel.RISKY
 * getRiskLevel(1.1) // RiskLevel.CRITICAL
 * ```
 */
export function getRiskLevel(healthRate: number): RiskLevel {
  if (healthRate >= HEALTH_RATE_THRESHOLDS.SAFE) {
    return RiskLevel.SAFE;
  }
  if (healthRate >= HEALTH_RATE_THRESHOLDS.MODERATE) {
    return RiskLevel.MODERATE;
  }
  if (healthRate >= HEALTH_RATE_THRESHOLDS.RISKY) {
    return RiskLevel.RISKY;
  }
  return RiskLevel.CRITICAL;
}

/**
 * Gets display configuration for a given health rate
 *
 * @param healthRate - Portfolio health rate
 * @returns Display configuration with colors, emoji, and label
 *
 * @example
 * ```typescript
 * const config = getRiskConfig(1.75);
 * // Returns: {
 * //   level: RiskLevel.MODERATE,
 * //   colors: { text: "text-yellow-400", ... },
 * //   label: "Moderate",
 * //   emoji: "🟡"
 * // }
 * ```
 */
export function getRiskConfig(healthRate: number) {
  const level = getRiskLevel(healthRate);
  return {
    level,
    colors: RISK_COLORS[level],
    label: RISK_LABELS[level],
    emoji: RISK_COLORS[level].emoji,
  };
}
