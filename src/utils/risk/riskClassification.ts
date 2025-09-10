/**
 * Risk Classification Utilities
 *
 * Utility functions for classifying and analyzing risk metrics
 */

import {
  VOLATILITY_THRESHOLDS,
  DRAWDOWN_THRESHOLDS,
  RiskLevel,
  DrawdownLevel,
} from "./riskConstants";

/**
 * Classify volatility percentage into risk level based on predefined thresholds
 *
 * @param volatilityPct - The annualized volatility percentage to classify
 * @returns The risk level classification:
 *   - "low": ≤ 25% volatility (conservative portfolios)
 *   - "medium": 25% < volatility ≤ 50% (moderate portfolios)
 *   - "high": 50% < volatility ≤ 100% (aggressive portfolios)
 *   - "very-high": > 100% volatility (extremely aggressive portfolios)
 *
 * @example
 * ```typescript
 * getVolatilityLevel(15.5); // returns "low"
 * getVolatilityLevel(35.0); // returns "medium"
 * getVolatilityLevel(75.0); // returns "high"
 * getVolatilityLevel(150.0); // returns "very-high"
 * ```
 */
export function getVolatilityLevel(volatilityPct: number): RiskLevel {
  if (volatilityPct > VOLATILITY_THRESHOLDS.HIGH) return "very-high";
  if (volatilityPct > VOLATILITY_THRESHOLDS.MEDIUM) return "high";
  if (volatilityPct > VOLATILITY_THRESHOLDS.LOW) return "medium";
  return "low";
}

/**
 * Classify maximum drawdown percentage into severity level based on predefined thresholds
 *
 * @param drawdownPct - The maximum drawdown percentage (can be positive or negative)
 * @returns The drawdown severity level:
 *   - "low": < 10% absolute drawdown (minimal historical losses)
 *   - "moderate": 10% ≤ drawdown < 15% (moderate historical losses)
 *   - "high": 15% ≤ drawdown < 20% (significant historical losses)
 *   - "severe": ≥ 20% absolute drawdown (severe historical losses)
 *
 * @example
 * ```typescript
 * getDrawdownLevel(-8.5); // returns "low"
 * getDrawdownLevel(-12.0); // returns "moderate"
 * getDrawdownLevel(-18.0); // returns "high"
 * getDrawdownLevel(-25.0); // returns "severe"
 * getDrawdownLevel(12.0); // returns "moderate" (absolute value used)
 * ```
 */
export function getDrawdownLevel(drawdownPct: number): DrawdownLevel {
  const absDrawdown = Math.abs(drawdownPct);
  if (absDrawdown >= DRAWDOWN_THRESHOLDS.HIGH) return "severe";
  if (absDrawdown >= DRAWDOWN_THRESHOLDS.MODERATE) return "high";
  if (absDrawdown >= DRAWDOWN_THRESHOLDS.LOW) return "moderate";
  return "low";
}

/**
 * Generate human-readable contextual description for volatility level
 *
 * @param volatilityPct - The annualized volatility percentage
 * @returns Object containing:
 *   - context: Comparative description relative to market benchmarks
 *   - implication: Investment strategy implications and risk profile
 *
 * @example
 * ```typescript
 * const desc = getVolatilityDescription(15);
 * // Returns: {
 * //   context: "relatively conservative compared to growth-oriented investments",
 * //   implication: "a balanced approach to growth and stability"
 * // }
 * ```
 */
export function getVolatilityDescription(volatilityPct: number): {
  context: string;
  implication: string;
} {
  const level = getVolatilityLevel(volatilityPct);

  switch (level) {
    case "very-high":
      return {
        context: "extremely high compared to market benchmarks",
        implication: "aggressive growth potential with substantial risk",
      };
    case "high":
      return {
        context: "significantly higher than typical market indices",
        implication: "aggressive growth potential with substantial risk",
      };
    case "medium":
      return {
        context: "moderately elevated compared to conservative portfolios",
        implication: "a balanced approach to growth and stability",
      };
    case "low":
      return {
        context:
          "relatively conservative compared to growth-oriented investments",
        implication: "a balanced approach to growth and stability",
      };
  }
}

/**
 * Generate comprehensive risk assessment summary based on volatility and drawdown metrics
 *
 * @param volatilityPct - The annualized volatility percentage
 * @param drawdownPct - The maximum drawdown percentage
 * @returns A human-readable summary of the portfolio's risk profile and suitability
 *
 * @description
 * Analyzes the combination of volatility and drawdown to determine:
 * - Overall risk-reward profile
 * - Historical performance characteristics
 * - Investor suitability recommendations
 * - Risk management effectiveness
 *
 * @example
 * ```typescript
 * generateKeyTakeaway(75, -25);
 * // Returns: "This portfolio exhibits a high-risk, high-reward profile..."
 *
 * generateKeyTakeaway(20, -8);
 * // Returns: "This portfolio maintains a balanced risk profile..."
 * ```
 */
export function generateKeyTakeaway(
  volatilityPct: number,
  drawdownPct: number
): string {
  const highVolatility = volatilityPct > VOLATILITY_THRESHOLDS.MEDIUM;
  const highDrawdown = Math.abs(drawdownPct) > DRAWDOWN_THRESHOLDS.MODERATE;

  if (highVolatility && highDrawdown) {
    return "This portfolio exhibits a high-risk, high-reward profile with significant price swings and notable historical declines. Suitable for aggressive investors with high risk tolerance.";
  } else if (highVolatility && !highDrawdown) {
    return "This portfolio shows high volatility but manageable drawdowns, suggesting effective risk management during market downturns despite active price movements.";
  } else if (!highVolatility && highDrawdown) {
    return "This portfolio demonstrates moderate volatility but experienced significant drawdowns, possibly indicating concentrated positions or exposure to specific market events.";
  } else {
    return "This portfolio maintains a balanced risk profile with manageable volatility and drawdowns, suitable for moderate risk tolerance investors.";
  }
}

/**
 * Determine if a portfolio is currently experiencing a significant drawdown
 *
 * @param currentDrawdownPct - The current drawdown percentage from peak
 * @returns True if the portfolio is in a significant drawdown state, false otherwise
 *
 * @description
 * Uses a threshold of -1% to determine meaningful drawdown vs normal market fluctuations.
 * Values below -1% are considered significant enough to warrant investor attention.
 *
 * @example
 * ```typescript
 * isInDrawdown(-0.5); // returns false (minor fluctuation)
 * isInDrawdown(-1.0); // returns false (at threshold)
 * isInDrawdown(-2.5); // returns true (significant drawdown)
 * isInDrawdown(1.0);  // returns false (portfolio at gains)
 * ```
 */
export function isInDrawdown(currentDrawdownPct: number): boolean {
  return currentDrawdownPct < -1;
}

/**
 * Generate personalized risk management recommendations based on portfolio metrics
 *
 * @param volatilityPct - The annualized volatility percentage
 * @param drawdownPct - The maximum drawdown percentage
 * @returns Array of recommendation objects with title and description
 *
 * @description
 * Analyzes risk metrics to provide actionable risk management advice:
 * - High volatility triggers position sizing recommendations
 * - Significant drawdowns trigger hedging and stop-loss advice
 * - Always includes general diversification and monitoring guidance
 *
 * Thresholds:
 * - High volatility: > 100% triggers specific recommendations
 * - Significant drawdown: > 15% absolute triggers specific recommendations
 *
 * @example
 * ```typescript
 * const recs = getRiskRecommendations(150, -25);
 * // Returns array with 4 recommendations:
 * // 1. High Volatility management
 * // 2. Significant Drawdowns mitigation
 * // 3. Diversification advice
 * // 4. Regular Monitoring guidance
 *
 * const recs2 = getRiskRecommendations(20, -5);
 * // Returns array with 2 recommendations:
 * // 1. Diversification advice
 * // 2. Regular Monitoring guidance
 * ```
 */
export function getRiskRecommendations(
  volatilityPct: number,
  drawdownPct: number
): Array<{ title: string; description: string }> {
  const recommendations: Array<{ title: string; description: string }> = [];

  if (volatilityPct > VOLATILITY_THRESHOLDS.HIGH) {
    recommendations.push({
      title: "High Volatility",
      description:
        "Consider position sizing strategies and avoid over-leveraging to manage the significant price swings.",
    });
  }

  if (Math.abs(drawdownPct) > DRAWDOWN_THRESHOLDS.MODERATE) {
    recommendations.push({
      title: "Significant Drawdowns",
      description:
        "Implement stop-loss strategies or hedging mechanisms to limit downside exposure during market stress.",
    });
  }

  // Always include these general recommendations
  recommendations.push(
    {
      title: "Diversification",
      description:
        "Review portfolio concentration and consider diversification across asset classes, sectors, and geographic regions.",
    },
    {
      title: "Regular Monitoring",
      description:
        "These metrics can change as market conditions evolve. Regular reassessment helps maintain appropriate risk levels.",
    }
  );

  return recommendations;
}
