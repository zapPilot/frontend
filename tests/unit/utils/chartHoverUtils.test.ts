import { describe, expect, it } from "vitest";

import {
  getDrawdownSeverity,
  getSharpeInterpretation,
  getVolatilityRiskLevel,
} from "@/utils/chartHoverUtils";

describe("chartHoverUtils", () => {
  it.each([
    { input: 0, expected: "Minor" },
    { input: -4.99, expected: "Minor" },
    { input: -5, expected: "Moderate" },
    { input: -9.99, expected: "Moderate" },
    { input: -10, expected: "Significant" },
    { input: -19.99, expected: "Significant" },
    { input: -20, expected: "Severe" },
  ])("maps drawdown %p to severity %p", ({ input, expected }) => {
    expect(getDrawdownSeverity(input)).toBe(expected);
  });

  it.each([
    { value: 2.1, interpretation: "Excellent" },
    { value: 1.5, interpretation: "Good" },
    { value: 0.75, interpretation: "Fair" },
    { value: 0.2, interpretation: "Poor" },
    { value: -0.1, interpretation: "Very Poor" },
  ])("interprets Sharpe ratio %p as %p", ({ value, interpretation }) => {
    expect(getSharpeInterpretation(value)).toBe(interpretation);
  });

  it.each([
    { vol: 10, level: "Low" },
    { vol: 20, level: "Moderate" },
    { vol: 30, level: "High" },
    { vol: 40, level: "Very High" },
  ])("categorises volatility %p as %p", ({ vol, level }) => {
    expect(getVolatilityRiskLevel(vol)).toBe(level);
  });
});
