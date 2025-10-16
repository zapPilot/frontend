/**
 * Chart Hover Utilities
 * Helper functions for chart hover calculations and styling
 */

import { formatters } from "./formatters";
import {
  severityMappers,
  getColorForSeverity,
  legacyLabelMapping,
  type SeverityLevel,
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

/**
 * Finds the peak date before the given index in drawdown data
 * @param drawdownData - Array of drawdown data points
 * @param index - Current index
 * @returns Formatted peak date string
 */
export function findPeakDate(
  drawdownData: Array<{ date: string; portfolio_value: number }>,
  index: number
): string {
  const priorData = drawdownData.slice(0, index + 1);
  const peak = Math.max(...priorData.map(p => p.portfolio_value));
  const peakIndex = priorData.findIndex(p => p.portfolio_value === peak);
  const peakDate: string =
    priorData[peakIndex]?.date ||
    drawdownData[index]?.date ||
    drawdownData[0]?.date ||
    new Date().toISOString();
  return formatters.chartDate(peakDate);
}

/**
 * Calculates days since peak
 * @param drawdownData - Array of drawdown data points
 * @param index - Current index
 * @returns Number of days since peak
 */
export function calculateDaysSincePeak(
  drawdownData: Array<{ date: string; portfolio_value: number }>,
  index: number
): number {
  const priorData = drawdownData.slice(0, index + 1);
  const peak = Math.max(...priorData.map(p => p.portfolio_value));
  const peakIndex = priorData.findIndex(p => p.portfolio_value === peak);
  return index - peakIndex;
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
export function getVolatilityRiskLevel(
  volatility: number
): "Low" | "Moderate" | "High" | "Very High" {
  const severity = severityMappers.volatility(volatility);
  const mapping: Record<
    SeverityLevel,
    "Low" | "Moderate" | "High" | "Very High"
  > = {
    excellent: "Low",
    good: "Low",
    fair: "Moderate",
    poor: "High",
    critical: "Very High",
  };
  return mapping[severity];
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

/**
 * Determines recovery status
 * @param underwater - Underwater percentage
 * @returns Recovery status label
 */
export function getRecoveryStatus(
  underwater: number
): "Recovered" | "Recovering" | "Underwater" {
  if (Math.abs(underwater) < 1) return "Recovered";
  if (Math.abs(underwater) < 10) return "Recovering";
  return "Underwater";
}

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
  const severityLevel = legacyLabelMapping[severity];
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
  const severityLevel = legacyLabelMapping[riskLevel];
  return getColorForSeverity(severityLevel);
}

/**
 * Gets color for recovery status
 * @param status - Recovery status
 * @returns Object with color Tailwind class
 */
export function getRecoveryStatusColor(
  status: "Recovered" | "Recovering" | "Underwater"
): { color: string } {
  const mapping: Record<typeof status, SeverityLevel> = {
    Recovered: "excellent",
    Recovering: "fair",
    Underwater: "critical",
  };
  const colors = getColorForSeverity(mapping[status]);
  return { color: colors.color };
}
