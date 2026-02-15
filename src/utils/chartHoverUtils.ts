/**
 * Chart Hover Utilities
 * Helper functions for chart hover calculations and styling
 */

import {
  getColorForSeverity,
  type SeverityLevel,
  severityMappers,
} from "@/lib/ui/severityColors";

// ============================================================================
// Factory Helpers
// ============================================================================

/**
 * Creates a function that maps a numeric value through a severity mapper
 * and returns the corresponding label from the provided lookup table.
 */
function mapSeverity<T>(
  mapper: (v: number) => SeverityLevel,
  labels: Record<SeverityLevel, T>
): (value: number) => T {
  return value => labels[mapper(value)];
}

/**
 * Creates a function that maps a label to its severity-based color pair.
 */
function mapLabelToColor<L extends string>(
  mapping: Record<L, SeverityLevel>
): (label: L) => { color: string; bgColor: string } {
  return label => getColorForSeverity(mapping[label]);
}

// ============================================================================
// Drawdown Functions
// ============================================================================

/**
 * Calculates drawdown severity level based on percentage
 * @param drawdown - Drawdown percentage (negative value)
 * @returns Severity label
 */
const getDrawdownSeverityFromValue = mapSeverity(severityMappers.drawdown, {
  excellent: "Minor",
  good: "Minor",
  fair: "Moderate",
  poor: "Significant",
  critical: "Severe",
} as const);

type DrawdownSeverityLabel = "Minor" | "Moderate" | "Significant" | "Severe";

export function getDrawdownSeverity(drawdown: number): DrawdownSeverityLabel {
  return getDrawdownSeverityFromValue(drawdown);
}

// ============================================================================
// Sharpe Ratio Functions
// ============================================================================

/**
 * Interprets Sharpe ratio value
 * @param sharpe - Sharpe ratio value
 * @returns Interpretation label
 */
const getSharpeInterpretationFromValue = mapSeverity(severityMappers.sharpe, {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  critical: "Very Poor",
} as const);

export function getSharpeInterpretation(sharpe: number): string {
  return getSharpeInterpretationFromValue(sharpe);
}

// ============================================================================
// Volatility Functions
// ============================================================================

/**
 * Determines risk level from volatility percentage
 * @param volatility - Annualized volatility percentage
 * @returns Risk level label
 */
const VOLATILITY_RISK_THRESHOLDS = {
  LOW_MAX: 20,
  MODERATE_MAX: 30,
  HIGH_MAX: 40,
} as const;

export function getVolatilityRiskLevel(
  volatility: number
): "Low" | "Moderate" | "High" | "Very High" {
  if (volatility < VOLATILITY_RISK_THRESHOLDS.LOW_MAX) {
    return "Low";
  }

  if (volatility < VOLATILITY_RISK_THRESHOLDS.MODERATE_MAX) {
    return "Moderate";
  }

  if (volatility < VOLATILITY_RISK_THRESHOLDS.HIGH_MAX) {
    return "High";
  }

  return "Very High";
}

/**
 * Calculates daily volatility from annualized volatility
 * @param annualizedVol - Annualized volatility percentage
 * @returns Daily volatility percentage
 */
export function calculateDailyVolatility(annualizedVol: number): number {
  return annualizedVol / Math.sqrt(252);
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Gets color for Sharpe ratio indicator
 * @param sharpe - Sharpe ratio value
 * @returns Hex color code
 */
const getSharpeColorFromValue = mapSeverity<string>(severityMappers.sharpe, {
  excellent: "#10b981",
  good: "#84cc16",
  fair: "#fbbf24",
  poor: "#fb923c",
  critical: "#ef4444",
});

export function getSharpeColor(sharpe: number): string {
  return getSharpeColorFromValue(sharpe);
}

/**
 * Gets Tailwind classes for drawdown severity badge
 * @param severity - Severity level
 * @returns Object with color and bgColor Tailwind classes
 */
const getDrawdownSeverityColorForLabel = mapLabelToColor({
  Minor: "good",
  Moderate: "fair",
  Significant: "poor",
  Severe: "critical",
} as const);

export function getDrawdownSeverityColor(severity: DrawdownSeverityLabel): {
  color: string;
  bgColor: string;
} {
  return getDrawdownSeverityColorForLabel(severity);
}

/**
 * Gets Tailwind classes for volatility risk level badge
 * @param riskLevel - Risk level
 * @returns Object with color and bgColor Tailwind classes
 */
const getVolatilityRiskColorForLabel = mapLabelToColor({
  Low: "excellent",
  Moderate: "good",
  High: "poor",
  "Very High": "critical",
} as const);

export function getVolatilityRiskColor(
  riskLevel: ReturnType<typeof getVolatilityRiskLevel>
): {
  color: string;
  bgColor: string;
} {
  return getVolatilityRiskColorForLabel(riskLevel);
}
