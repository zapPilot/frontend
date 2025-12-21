/**
 * Chart Hover Utilities
 * Helper functions for chart hover calculations and styling
 */

import {
  getColorForSeverity,
  type SeverityLevel,
  severityMappers,
} from "./severityColors";

// ============================================================================
// Drawdown Functions
// ============================================================================

/**
 * Calculates drawdown severity level based on percentage
 * @param drawdown - Drawdown percentage (negative value)
 * @returns Severity label
 */
export function getDrawdownSeverity(
  drawdown: number
): "Minor" | "Moderate" | "Significant" | "Severe" {
  const severity = severityMappers.drawdown(drawdown);
  const mapping: Record<
    SeverityLevel,
    "Minor" | "Moderate" | "Significant" | "Severe"
  > = {
    excellent: "Minor",
    good: "Minor",
    fair: "Moderate",
    poor: "Significant",
    critical: "Severe",
  };
  return mapping[severity];
}

// ============================================================================
// Sharpe Ratio Functions
// ============================================================================

/**
 * Interprets Sharpe ratio value
 * @param sharpe - Sharpe ratio value
 * @returns Interpretation label
 */
export function getSharpeInterpretation(
  sharpe: number
): "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor" {
  const severity = severityMappers.sharpe(sharpe);
  const mapping: Record<
    SeverityLevel,
    "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor"
  > = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    critical: "Very Poor",
  };
  return mapping[severity];
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
// Underwater Recovery Functions
// ============================================================================

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Gets color for Sharpe ratio indicator
 * @param sharpe - Sharpe ratio value
 * @returns Hex color code
 */
export function getSharpeColor(sharpe: number): string {
  const severity = severityMappers.sharpe(sharpe);
  const colors: Record<SeverityLevel, string> = {
    excellent: "#10b981",
    good: "#84cc16",
    fair: "#fbbf24",
    poor: "#fb923c",
    critical: "#ef4444",
  };
  return colors[severity];
}

/**
 * Gets Tailwind classes for drawdown severity badge
 * @param severity - Severity level
 * @returns Object with color and bgColor Tailwind classes
 */
export function getDrawdownSeverityColor(
  severity: "Minor" | "Moderate" | "Significant" | "Severe"
): { color: string; bgColor: string } {
  const drawdownSeverityMap: Record<
    "Minor" | "Moderate" | "Significant" | "Severe",
    SeverityLevel
  > = {
    Minor: "good",
    Moderate: "fair",
    Significant: "poor",
    Severe: "critical",
  };

  const severityLevel = drawdownSeverityMap[severity];
  return getColorForSeverity(severityLevel);
}

/**
 * Gets Tailwind classes for volatility risk level badge
 * @param riskLevel - Risk level
 * @returns Object with color and bgColor Tailwind classes
 */
export function getVolatilityRiskColor(
  riskLevel: "Low" | "Moderate" | "High" | "Very High"
): { color: string; bgColor: string } {
  const riskToSeverity: Record<
    "Low" | "Moderate" | "High" | "Very High",
    SeverityLevel
  > = {
    Low: "excellent",
    Moderate: "good",
    High: "poor",
    "Very High": "critical",
  };

  const severityLevel = riskToSeverity[riskLevel];
  return getColorForSeverity(severityLevel);
}
