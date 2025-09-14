/**
 * Tests for Risk Classification Utilities
 */

import { describe, it, expect } from "vitest";
import {
  getVolatilityLevel,
  getDrawdownLevel,
  getVolatilityDescription,
  generateKeyTakeaway,
  isInDrawdown,
  getRiskRecommendations,
} from "../../../../src/utils/risk/riskClassification";

describe("getVolatilityLevel", () => {
  it('returns "low" for volatility below low threshold', () => {
    expect(getVolatilityLevel(10)).toBe("low");
    expect(getVolatilityLevel(24.9)).toBe("low");
    expect(getVolatilityLevel(0)).toBe("low");
  });

  it('returns "medium" for volatility between low and medium thresholds', () => {
    expect(getVolatilityLevel(25.1)).toBe("medium");
    expect(getVolatilityLevel(35)).toBe("medium");
    expect(getVolatilityLevel(49.9)).toBe("medium");
  });

  it('returns "high" for volatility between medium and high thresholds', () => {
    expect(getVolatilityLevel(50.1)).toBe("high");
    expect(getVolatilityLevel(75)).toBe("high");
    expect(getVolatilityLevel(99.9)).toBe("high");
  });

  it('returns "very-high" for volatility above high threshold', () => {
    expect(getVolatilityLevel(100.1)).toBe("very-high");
    expect(getVolatilityLevel(150)).toBe("very-high");
    expect(getVolatilityLevel(200)).toBe("very-high");
  });

  it("handles edge cases", () => {
    expect(getVolatilityLevel(25.0)).toBe("low"); // Exactly at threshold = low
    expect(getVolatilityLevel(50.0)).toBe("medium"); // Exactly at threshold = medium
    expect(getVolatilityLevel(100.0)).toBe("high"); // Exactly at threshold = high
  });
});

describe("getDrawdownLevel", () => {
  it('returns "low" for small drawdowns', () => {
    expect(getDrawdownLevel(-5)).toBe("low");
    expect(getDrawdownLevel(-9.9)).toBe("low");
    expect(getDrawdownLevel(0)).toBe("low");
    expect(getDrawdownLevel(5)).toBe("low"); // Test absolute value
  });

  it('returns "moderate" for moderate drawdowns', () => {
    expect(getDrawdownLevel(-10)).toBe("moderate");
    expect(getDrawdownLevel(-12)).toBe("moderate");
    expect(getDrawdownLevel(-14.9)).toBe("moderate");
    expect(getDrawdownLevel(12)).toBe("moderate"); // Test absolute value
  });

  it('returns "high" for significant drawdowns', () => {
    expect(getDrawdownLevel(-15)).toBe("high");
    expect(getDrawdownLevel(-18)).toBe("high");
    expect(getDrawdownLevel(-19.9)).toBe("high");
    expect(getDrawdownLevel(18)).toBe("high"); // Test absolute value
  });

  it('returns "severe" for severe drawdowns', () => {
    expect(getDrawdownLevel(-20)).toBe("severe");
    expect(getDrawdownLevel(-25)).toBe("severe");
    expect(getDrawdownLevel(-50)).toBe("severe");
    expect(getDrawdownLevel(25)).toBe("severe"); // Test absolute value
  });

  it("handles edge cases", () => {
    expect(getDrawdownLevel(-10.0)).toBe("moderate");
    expect(getDrawdownLevel(-15.0)).toBe("high");
    expect(getDrawdownLevel(-20.0)).toBe("severe");
  });
});

describe("getVolatilityDescription", () => {
  it("returns correct description for low volatility", () => {
    const result = getVolatilityDescription(15);
    expect(result.context).toBe(
      "relatively conservative compared to growth-oriented investments"
    );
    expect(result.implication).toBe(
      "a balanced approach to growth and stability"
    );
  });

  it("returns correct description for medium volatility", () => {
    const result = getVolatilityDescription(35);
    expect(result.context).toBe(
      "moderately elevated compared to conservative portfolios"
    );
    expect(result.implication).toBe(
      "a balanced approach to growth and stability"
    );
  });

  it("returns correct description for high volatility", () => {
    const result = getVolatilityDescription(75);
    expect(result.context).toBe(
      "significantly higher than typical market indices"
    );
    expect(result.implication).toBe(
      "aggressive growth potential with substantial risk"
    );
  });

  it("returns correct description for very-high volatility", () => {
    const result = getVolatilityDescription(150);
    expect(result.context).toBe("extremely high compared to market benchmarks");
    expect(result.implication).toBe(
      "aggressive growth potential with substantial risk"
    );
  });

  it("handles threshold boundaries correctly", () => {
    const lowResult = getVolatilityDescription(25);
    expect(lowResult.context).toBe(
      "relatively conservative compared to growth-oriented investments"
    );

    const highResult = getVolatilityDescription(100);
    expect(highResult.context).toBe(
      "significantly higher than typical market indices"
    );
  });
});

describe("generateKeyTakeaway", () => {
  it("generates correct takeaway for high volatility and high drawdown", () => {
    const result = generateKeyTakeaway(75, -25);
    expect(result).toBe(
      "This portfolio exhibits a high-risk, high-reward profile with significant price swings and notable historical declines. Suitable for aggressive investors with high risk tolerance."
    );
  });

  it("generates correct takeaway for high volatility and low drawdown", () => {
    const result = generateKeyTakeaway(75, -5);
    expect(result).toBe(
      "This portfolio shows high volatility but manageable drawdowns, suggesting effective risk management during market downturns despite active price movements."
    );
  });

  it("generates correct takeaway for low volatility and high drawdown", () => {
    const result = generateKeyTakeaway(30, -25);
    expect(result).toBe(
      "This portfolio demonstrates moderate volatility but experienced significant drawdowns, possibly indicating concentrated positions or exposure to specific market events."
    );
  });

  it("generates correct takeaway for low volatility and low drawdown", () => {
    const result = generateKeyTakeaway(30, -5);
    expect(result).toBe(
      "This portfolio maintains a balanced risk profile with manageable volatility and drawdowns, suitable for moderate risk tolerance investors."
    );
  });

  it("handles edge cases at thresholds", () => {
    // Test at exact threshold boundaries
    const result1 = generateKeyTakeaway(50, -15);
    expect(result1).toBe(
      "This portfolio maintains a balanced risk profile with manageable volatility and drawdowns, suitable for moderate risk tolerance investors."
    );

    const result2 = generateKeyTakeaway(51, -16);
    expect(result2).toBe(
      "This portfolio exhibits a high-risk, high-reward profile with significant price swings and notable historical declines. Suitable for aggressive investors with high risk tolerance."
    );
  });
});

describe("isInDrawdown", () => {
  it("returns true for significant negative drawdown", () => {
    expect(isInDrawdown(-5)).toBe(true);
    expect(isInDrawdown(-1.1)).toBe(true);
    expect(isInDrawdown(-20)).toBe(true);
  });

  it("returns false for minimal or positive drawdown", () => {
    expect(isInDrawdown(-0.5)).toBe(false);
    expect(isInDrawdown(-1)).toBe(false);
    expect(isInDrawdown(0)).toBe(false);
    expect(isInDrawdown(5)).toBe(false);
  });

  it("handles edge case at -1% threshold", () => {
    expect(isInDrawdown(-1.0)).toBe(false);
    expect(isInDrawdown(-1.01)).toBe(true);
  });
});

describe("getRiskRecommendations", () => {
  it("includes high volatility recommendation for high volatility", () => {
    const recommendations = getRiskRecommendations(150, -10);

    const volatilityRec = recommendations.find(
      r => r.title === "High Volatility"
    );
    expect(volatilityRec).toBeDefined();
    expect(volatilityRec?.description).toBe(
      "Consider position sizing strategies and avoid over-leveraging to manage the significant price swings."
    );
  });

  it("includes significant drawdown recommendation for high drawdown", () => {
    const recommendations = getRiskRecommendations(30, -25);

    const drawdownRec = recommendations.find(
      r => r.title === "Significant Drawdowns"
    );
    expect(drawdownRec).toBeDefined();
    expect(drawdownRec?.description).toBe(
      "Implement stop-loss strategies or hedging mechanisms to limit downside exposure during market stress."
    );
  });

  it("excludes specific recommendations for low risk metrics", () => {
    const recommendations = getRiskRecommendations(20, -5);

    const volatilityRec = recommendations.find(
      r => r.title === "High Volatility"
    );
    const drawdownRec = recommendations.find(
      r => r.title === "Significant Drawdowns"
    );

    expect(volatilityRec).toBeUndefined();
    expect(drawdownRec).toBeUndefined();
  });

  it("always includes general recommendations", () => {
    const recommendations = getRiskRecommendations(10, -2);

    const diversificationRec = recommendations.find(
      r => r.title === "Diversification"
    );
    const monitoringRec = recommendations.find(
      r => r.title === "Regular Monitoring"
    );

    expect(diversificationRec).toBeDefined();
    expect(diversificationRec?.description).toBe(
      "Review portfolio concentration and consider diversification across asset classes, sectors, and geographic regions."
    );

    expect(monitoringRec).toBeDefined();
    expect(monitoringRec?.description).toBe(
      "These metrics can change as market conditions evolve. Regular reassessment helps maintain appropriate risk levels."
    );
  });

  it("includes all recommendations for high risk portfolio", () => {
    const recommendations = getRiskRecommendations(150, -30);

    expect(recommendations).toHaveLength(4);
    expect(recommendations.map(r => r.title)).toEqual([
      "High Volatility",
      "Significant Drawdowns",
      "Diversification",
      "Regular Monitoring",
    ]);
  });

  it("includes only general recommendations for low risk portfolio", () => {
    const recommendations = getRiskRecommendations(15, -5);

    expect(recommendations).toHaveLength(2);
    expect(recommendations.map(r => r.title)).toEqual([
      "Diversification",
      "Regular Monitoring",
    ]);
  });

  it("handles edge cases at thresholds", () => {
    // Test at exact thresholds - volatility > 100 triggers high volatility, drawdown > 15 triggers significant drawdowns
    const recommendations1 = getRiskRecommendations(101, -15);
    expect(
      recommendations1.find(r => r.title === "High Volatility")
    ).toBeDefined();
    expect(
      recommendations1.find(r => r.title === "Significant Drawdowns")
    ).toBeUndefined();

    const recommendations2 = getRiskRecommendations(50, -16);
    expect(
      recommendations2.find(r => r.title === "High Volatility")
    ).toBeUndefined();
    expect(
      recommendations2.find(r => r.title === "Significant Drawdowns")
    ).toBeDefined();
  });

  it("handles zero and positive values", () => {
    const recommendations = getRiskRecommendations(0, 0);

    expect(recommendations).toHaveLength(2);
    expect(recommendations.map(r => r.title)).toEqual([
      "Diversification",
      "Regular Monitoring",
    ]);
  });
});
