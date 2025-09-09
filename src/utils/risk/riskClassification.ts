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
 * Classify volatility percentage into risk level
 */
export function getVolatilityLevel(volatilityPct: number): RiskLevel {
  if (volatilityPct > VOLATILITY_THRESHOLDS.HIGH) return "very-high";
  if (volatilityPct > VOLATILITY_THRESHOLDS.MEDIUM) return "high";
  if (volatilityPct > VOLATILITY_THRESHOLDS.LOW) return "medium";
  return "low";
}

/**
 * Classify drawdown percentage into risk level
 */
export function getDrawdownLevel(drawdownPct: number): DrawdownLevel {
  const absDrawdown = Math.abs(drawdownPct);
  if (absDrawdown >= DRAWDOWN_THRESHOLDS.HIGH) return "severe";
  if (absDrawdown >= DRAWDOWN_THRESHOLDS.MODERATE) return "high";
  if (absDrawdown >= DRAWDOWN_THRESHOLDS.LOW) return "moderate";
  return "low";
}

/**
 * Generate contextual description for volatility level
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
 * Generate key takeaway message based on risk levels
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
 * Check if portfolio is currently in drawdown
 */
export function isInDrawdown(currentDrawdownPct: number): boolean {
  return currentDrawdownPct < -1;
}

/**
 * Get risk management recommendations based on metrics
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
