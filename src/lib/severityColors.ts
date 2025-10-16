/**
 * Severity-based color system for chart metrics
 * Consolidates 8 duplicate color mapping functions into generic pattern
 */

export type SeverityLevel = "excellent" | "good" | "fair" | "poor" | "critical";

const SEVERITY_COLORS: Record<
  SeverityLevel,
  { color: string; bgColor: string }
> = {
  excellent: { color: "text-green-400", bgColor: "bg-green-500/20" },
  good: { color: "text-lime-400", bgColor: "bg-lime-500/20" },
  fair: { color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  poor: { color: "text-orange-400", bgColor: "bg-orange-500/20" },
  critical: { color: "text-red-400", bgColor: "bg-red-500/20" },
} as const;

/**
 * Metric-specific severity level calculators
 */
export const severityMappers = {
  /**
   * Map drawdown percentage to severity
   * @param value - Drawdown value (negative percentage)
   * @returns Severity level
   */
  drawdown: (value: number): SeverityLevel => {
    const abs = Math.abs(value);
    if (abs < 5) return "excellent"; // Minor
    if (abs < 10) return "fair"; // Moderate
    if (abs < 20) return "poor"; // Significant
    return "critical"; // Severe
  },

  /**
   * Map Sharpe ratio to severity
   * @param value - Sharpe ratio
   * @returns Severity level
   */
  sharpe: (value: number): SeverityLevel => {
    if (value >= 2.0) return "excellent";
    if (value >= 1.0) return "good";
    if (value >= 0.5) return "fair";
    if (value >= 0) return "poor";
    return "critical";
  },

  /**
   * Map volatility percentage to severity
   * @param value - Annualized volatility percentage
   * @returns Severity level
   */
  volatility: (value: number): SeverityLevel => {
    if (value < 10) return "excellent";
    if (value < 15) return "good";
    if (value < 25) return "fair";
    if (value < 35) return "poor";
    return "critical";
  },

  /**
   * Map underwater percentage to severity
   * @param value - Underwater value (negative percentage)
   * @returns Severity level
   */
  underwater: (value: number): SeverityLevel => {
    const abs = Math.abs(value);
    if (abs < 2) return "excellent";
    if (abs < 5) return "good";
    if (abs < 10) return "fair";
    if (abs < 15) return "poor";
    return "critical";
  },
} as const;

/**
 * Get Tailwind color classes for a severity level
 * @param level - Severity level
 * @returns Object with color and bgColor Tailwind classes
 */
export const getColorForSeverity = (level: SeverityLevel) =>
  SEVERITY_COLORS[level];

/**
 * Legacy label mappings for backwards compatibility
 */
export const legacyLabelMapping = {
  Minor: "good" as SeverityLevel,
  Moderate: "fair" as SeverityLevel,
  Significant: "poor" as SeverityLevel,
  Severe: "critical" as SeverityLevel,
  Excellent: "excellent" as SeverityLevel,
  Good: "good" as SeverityLevel,
  Fair: "fair" as SeverityLevel,
  Poor: "poor" as SeverityLevel,
  Low: "excellent" as SeverityLevel,
  High: "poor" as SeverityLevel,
  "Very High": "critical" as SeverityLevel,
} as const;
