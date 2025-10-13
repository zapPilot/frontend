/**
 * Chart Hover Utilities
 * Helper functions for chart hover calculations and styling
 */

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
  const absDrawdown = Math.abs(drawdown);
  if (absDrawdown < 5) return "Minor";
  if (absDrawdown < 10) return "Moderate";
  if (absDrawdown < 20) return "Significant";
  return "Severe";
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
  return new Date(peakDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  if (sharpe > 2.0) return "Excellent";
  if (sharpe > 1.0) return "Good";
  if (sharpe > 0.5) return "Fair";
  if (sharpe > 0) return "Poor";
  return "Very Poor";
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
  if (volatility < 15) return "Low";
  if (volatility < 25) return "Moderate";
  if (volatility < 35) return "High";
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

/**
 * Determines recovery status
 * @param underwater - Underwater percentage
 * @param isRecoveryPoint - Whether this is a recovery point
 * @returns Recovery status label
 */
export function getRecoveryStatus(
  underwater: number,
  isRecoveryPoint: boolean
): "Recovered" | "Near Peak" | "Underwater" {
  if (underwater === 0) return "Recovered";
  if (isRecoveryPoint) return "Near Peak";
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
  if (sharpe > 2.0) return "#10b981"; // Excellent - Green
  if (sharpe > 1.0) return "#84cc16"; // Good - Lime
  if (sharpe > 0.5) return "#eab308"; // Fair - Yellow
  if (sharpe > 0) return "#f97316"; // Poor - Orange
  return "#ef4444"; // Very Poor - Red
}

/**
 * Gets Tailwind classes for drawdown severity badge
 * @param severity - Severity level
 * @returns Object with color and bgColor Tailwind classes
 */
export function getDrawdownSeverityColor(
  severity: "Minor" | "Moderate" | "Significant" | "Severe"
): { color: string; bgColor: string } {
  switch (severity) {
    case "Minor":
      return { color: "text-green-400", bgColor: "bg-green-500/20" };
    case "Moderate":
      return { color: "text-yellow-400", bgColor: "bg-yellow-500/20" };
    case "Significant":
      return { color: "text-orange-400", bgColor: "bg-orange-500/20" };
    case "Severe":
      return { color: "text-red-400", bgColor: "bg-red-500/20" };
  }
}

/**
 * Gets Tailwind classes for volatility risk level badge
 * @param riskLevel - Risk level
 * @returns Object with color and bgColor Tailwind classes
 */
export function getVolatilityRiskColor(
  riskLevel: "Low" | "Moderate" | "High" | "Very High"
): { color: string; bgColor: string } {
  switch (riskLevel) {
    case "Low":
      return { color: "text-green-400", bgColor: "bg-green-500/20" };
    case "Moderate":
      return { color: "text-yellow-400", bgColor: "bg-yellow-500/20" };
    case "High":
      return { color: "text-orange-400", bgColor: "bg-orange-500/20" };
    case "Very High":
      return { color: "text-red-400", bgColor: "bg-red-500/20" };
  }
}

/**
 * Gets color for recovery status
 * @param status - Recovery status
 * @returns Object with color and bgColor Tailwind classes
 */
export function getRecoveryStatusColor(
  status: "Recovered" | "Near Peak" | "Underwater"
): { color: string; bgColor: string } {
  switch (status) {
    case "Recovered":
      return { color: "text-green-400", bgColor: "bg-green-500/20" };
    case "Near Peak":
      return { color: "text-yellow-400", bgColor: "bg-yellow-500/20" };
    case "Underwater":
      return { color: "text-red-400", bgColor: "bg-red-500/20" };
  }
}
