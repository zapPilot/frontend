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
export enum RiskLevel {
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
 * Risk Level Display Configuration
 *
 * Comprehensive display configuration for each risk level including:
 * - Colors (Tailwind CSS classes)
 * - Icons (multi-modal indicators for accessibility)
 * - Animation patterns
 * - ARIA labels
 */
export const RISK_COLORS = {
  [RiskLevel.SAFE]: {
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
    emoji: "🟢",
    icon: "✓",
    pattern: "solid" as const,
    ariaLabel: "Safe - Large safety buffer",
  },
  [RiskLevel.MODERATE]: {
    text: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    emoji: "🟡",
    icon: "⚠",
    pattern: "solid" as const,
    ariaLabel: "Warning - Moderate safety buffer",
  },
  [RiskLevel.RISKY]: {
    text: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    dot: "bg-orange-500",
    emoji: "🟠",
    icon: "!",
    pattern: "pulse" as const,
    ariaLabel: "Risky - Low safety buffer",
  },
  [RiskLevel.CRITICAL]: {
    text: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30 shadow-rose-500/20",
    dot: "bg-rose-500",
    emoji: "🔴",
    icon: "!!",
    pattern: "pulse" as const,
    ariaLabel: "Critical - Liquidation risk",
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

export interface RiskConfig {
  level: RiskLevel;
  colors: (typeof RISK_COLORS)[RiskLevel];
  label: (typeof RISK_LABELS)[RiskLevel];
  emoji: string;
}

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
export function getRiskConfig(healthRate: number): RiskConfig {
  const level = getRiskLevel(healthRate);
  const colors = RISK_COLORS[level];

  return {
    level,
    colors,
    label: RISK_LABELS[level],
    emoji: colors.emoji,
  };
}

/**
 * Maps API borrowing_summary.overall_status to RiskLevel
 *
 * The backend provides pre-computed status strings. This function
 * converts them to our internal RiskLevel enum for consistent styling.
 *
 * @param status - Overall status from borrowing_summary API response
 * @returns Corresponding RiskLevel enum value
 *
 * @example
 * ```typescript
 * mapBorrowingStatusToRiskLevel("CRITICAL") // RiskLevel.CRITICAL
 * mapBorrowingStatusToRiskLevel("WARNING")  // RiskLevel.RISKY
 * mapBorrowingStatusToRiskLevel("HEALTHY")  // RiskLevel.SAFE
 * ```
 */
const BORROWING_STATUS_TO_RISK: Record<string, RiskLevel> = {
  HEALTHY: RiskLevel.SAFE,
  WARNING: RiskLevel.RISKY, // Map WARNING to RISKY for visual consistency
  CRITICAL: RiskLevel.CRITICAL,
};

export function mapBorrowingStatusToRiskLevel(
  status: "HEALTHY" | "WARNING" | "CRITICAL"
): RiskLevel {
  return BORROWING_STATUS_TO_RISK[status] ?? RiskLevel.MODERATE;
}
