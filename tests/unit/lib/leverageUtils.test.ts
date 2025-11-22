import { describe, expect, it } from "vitest";

import {
  calculateHealthFactor,
  calculateLeverageRatio,
  formatHealthFactor,
  formatLeverageRatio,
  getLeverageHealthLabel,
  getLeverageHealthStatus,
  getLeverageMetrics,
  LEVERAGE_THRESHOLDS,
} from "@/lib/leverageUtils";

describe("leverageUtils", () => {
  describe("calculateLeverageRatio", () => {
    it("calculates correct leverage ratio with debt", () => {
      // 10,000 assets, 2,000 debt = 1.25x leverage
      const result = calculateLeverageRatio(10000, 2000);
      expect(result).toBe(1.25);
    });

    it("returns 1.0 for no debt (unleveraged)", () => {
      const result = calculateLeverageRatio(10000, 0);
      expect(result).toBe(1.0);
    });

    it("returns 1.0 for negative debt (invalid input)", () => {
      const result = calculateLeverageRatio(10000, -100);
      expect(result).toBe(1.0);
    });

    it("returns 1.0 for negative assets (invalid input)", () => {
      const result = calculateLeverageRatio(-10000, 2000);
      expect(result).toBe(1.0);
    });

    it("returns Infinity when debt exceeds assets", () => {
      const result = calculateLeverageRatio(5000, 6000);
      expect(result).toBe(Infinity);
    });

    it("returns Infinity when debt equals assets", () => {
      const result = calculateLeverageRatio(5000, 5000);
      expect(result).toBe(Infinity);
    });

    it("calculates high leverage correctly", () => {
      // 10,000 assets, 7,500 debt = 4x leverage
      const result = calculateLeverageRatio(10000, 7500);
      expect(result).toBe(4.0);
    });

    it("handles small amounts correctly", () => {
      const result = calculateLeverageRatio(100, 20);
      expect(result).toBe(1.25);
    });

    it("handles large amounts correctly", () => {
      const result = calculateLeverageRatio(1000000, 200000);
      expect(result).toBe(1.25);
    });
  });

  describe("getLeverageHealthStatus", () => {
    it("returns 'safe' for leverage < 2.0x", () => {
      expect(getLeverageHealthStatus(1.0)).toBe("safe");
      expect(getLeverageHealthStatus(1.5)).toBe("safe");
      expect(getLeverageHealthStatus(1.99)).toBe("safe");
    });

    it("returns 'moderate' for leverage 2.0-3.0x", () => {
      expect(getLeverageHealthStatus(2.0)).toBe("moderate");
      expect(getLeverageHealthStatus(2.5)).toBe("moderate");
      expect(getLeverageHealthStatus(2.99)).toBe("moderate");
    });

    it("returns 'high' for leverage 3.0-4.0x", () => {
      expect(getLeverageHealthStatus(3.0)).toBe("high");
      expect(getLeverageHealthStatus(3.5)).toBe("high");
      expect(getLeverageHealthStatus(3.99)).toBe("high");
    });

    it("returns 'critical' for leverage >= 4.0x", () => {
      expect(getLeverageHealthStatus(4.0)).toBe("critical");
      expect(getLeverageHealthStatus(5.0)).toBe("critical");
      expect(getLeverageHealthStatus(10.0)).toBe("critical");
    });

    it("returns 'critical' for infinite leverage", () => {
      expect(getLeverageHealthStatus(Infinity)).toBe("critical");
    });

    it("validates threshold boundaries", () => {
      expect(getLeverageHealthStatus(LEVERAGE_THRESHOLDS.safe - 0.01)).toBe("safe");
      expect(getLeverageHealthStatus(LEVERAGE_THRESHOLDS.safe)).toBe("moderate");
      expect(getLeverageHealthStatus(LEVERAGE_THRESHOLDS.moderate)).toBe("high");
      expect(getLeverageHealthStatus(LEVERAGE_THRESHOLDS.high)).toBe("critical");
    });
  });

  describe("getLeverageHealthLabel", () => {
    it("returns correct labels for each status", () => {
      expect(getLeverageHealthLabel("safe")).toBe("Safe");
      expect(getLeverageHealthLabel("moderate")).toBe("Caution");
      expect(getLeverageHealthLabel("high")).toBe("High Risk");
      expect(getLeverageHealthLabel("critical")).toBe("Critical");
    });
  });

  describe("calculateHealthFactor", () => {
    it("calculates correct health factor with debt", () => {
      // 10,000 assets / 2,000 debt = 5.0 health factor
      const result = calculateHealthFactor(10000, 2000);
      expect(result).toBe(5.0);
    });

    it("returns Infinity for no debt", () => {
      const result = calculateHealthFactor(10000, 0);
      expect(result).toBe(Infinity);
    });

    it("returns 0 for zero or negative assets", () => {
      expect(calculateHealthFactor(0, 2000)).toBe(0);
      expect(calculateHealthFactor(-1000, 2000)).toBe(0);
    });

    it("handles critical positions correctly", () => {
      // Low health factor = risky
      const result = calculateHealthFactor(10000, 8000);
      expect(result).toBe(1.25);
    });

    it("handles safe positions correctly", () => {
      // High health factor = safe
      const result = calculateHealthFactor(10000, 1000);
      expect(result).toBe(10.0);
    });
  });

  describe("getLeverageMetrics", () => {
    it("returns complete metrics for leveraged position", () => {
      const result = getLeverageMetrics(10000, 2000);

      expect(result).toMatchObject({
        ratio: 1.25,
        debtPercentage: 20,
        healthStatus: "safe",
        healthLabel: "Safe",
        healthFactor: 5.0,
        hasDebt: true,
      });
    });

    it("returns unleveraged metrics when no debt", () => {
      const result = getLeverageMetrics(10000, 0);

      expect(result).toMatchObject({
        ratio: 1.0,
        debtPercentage: 0,
        healthStatus: "safe",
        healthLabel: "Safe",
        healthFactor: Infinity,
        hasDebt: false,
      });
    });

    it("returns critical metrics for underwater position", () => {
      const result = getLeverageMetrics(5000, 6000);

      expect(result.healthStatus).toBe("critical");
      expect(result.ratio).toBe(Infinity);
      expect(result.hasDebt).toBe(true);
    });

    it("calculates debt percentage correctly", () => {
      const result = getLeverageMetrics(10000, 3333);

      expect(result.debtPercentage).toBeCloseTo(33.33, 2);
    });

    it("handles moderate risk correctly", () => {
      // 2.5x leverage = moderate risk
      const result = getLeverageMetrics(10000, 6000);

      expect(result.healthStatus).toBe("moderate");
      expect(result.healthLabel).toBe("Caution");
      expect(result.ratio).toBe(2.5);
    });

    it("handles high risk correctly", () => {
      // 3.33x leverage = high risk
      const result = getLeverageMetrics(10000, 7000);

      expect(result.healthStatus).toBe("high");
      expect(result.healthLabel).toBe("High Risk");
      expect(result.ratio).toBeCloseTo(3.33, 2);
    });

    it("handles zero assets edge case", () => {
      const result = getLeverageMetrics(0, 0);

      expect(result.ratio).toBe(1.0);
      expect(result.debtPercentage).toBe(0);
      expect(result.hasDebt).toBe(false);
    });
  });

  describe("formatLeverageRatio", () => {
    it("formats regular leverage ratios", () => {
      expect(formatLeverageRatio(1.5)).toBe("1.50x");
      expect(formatLeverageRatio(2.25)).toBe("2.25x");
      expect(formatLeverageRatio(3.0)).toBe("3.00x");
    });

    it("formats unleveraged position", () => {
      expect(formatLeverageRatio(1.0)).toBe("No Leverage");
    });

    it("formats infinite leverage", () => {
      expect(formatLeverageRatio(Infinity)).toBe("Critical");
    });

    it("rounds to 2 decimal places", () => {
      expect(formatLeverageRatio(1.23456)).toBe("1.23x");
      expect(formatLeverageRatio(2.99999)).toBe("3.00x");
    });
  });

  describe("formatHealthFactor", () => {
    it("formats regular health factors", () => {
      expect(formatHealthFactor(2.5)).toBe("2.50");
      expect(formatHealthFactor(1.25)).toBe("1.25");
      expect(formatHealthFactor(10.0)).toBe("10.00");
    });

    it("formats infinite health factor", () => {
      expect(formatHealthFactor(Infinity)).toBe("∞");
    });

    it("formats zero health factor", () => {
      expect(formatHealthFactor(0)).toBe("0");
    });

    it("rounds to 2 decimal places", () => {
      expect(formatHealthFactor(1.23456)).toBe("1.23");
      expect(formatHealthFactor(5.99999)).toBe("6.00");
    });
  });

  describe("integration scenarios", () => {
    it("handles typical safe DeFi position", () => {
      // User has $50k assets, borrowed $10k = 1.25x leverage
      const totalAssets = 50000;
      const totalDebt = 10000;

      const ratio = calculateLeverageRatio(totalAssets, totalDebt);
      const status = getLeverageHealthStatus(ratio);
      const metrics = getLeverageMetrics(totalAssets, totalDebt);

      expect(ratio).toBe(1.25);
      expect(status).toBe("safe");
      expect(metrics.healthFactor).toBe(5.0);
      expect(formatLeverageRatio(ratio)).toBe("1.25x");
    });

    it("handles moderate risk position", () => {
      // User has $30k assets, borrowed $18k = 2.5x leverage
      const totalAssets = 30000;
      const totalDebt = 18000;

      const metrics = getLeverageMetrics(totalAssets, totalDebt);

      expect(metrics.ratio).toBe(2.5);
      expect(metrics.healthStatus).toBe("moderate");
      expect(metrics.healthLabel).toBe("Caution");
      expect(metrics.debtPercentage).toBe(60);
    });

    it("handles high risk position near liquidation", () => {
      // User has $20k assets, borrowed $17k = 6.67x leverage
      const totalAssets = 20000;
      const totalDebt = 17000;

      const metrics = getLeverageMetrics(totalAssets, totalDebt);

      expect(metrics.healthStatus).toBe("critical");
      expect(metrics.healthFactor).toBeCloseTo(1.18, 2);
      expect(metrics.debtPercentage).toBe(85);
    });

    it("handles unleveraged portfolio", () => {
      // User has $100k assets, no debt
      const totalAssets = 100000;
      const totalDebt = 0;

      const metrics = getLeverageMetrics(totalAssets, totalDebt);

      expect(metrics.ratio).toBe(1.0);
      expect(metrics.healthStatus).toBe("safe");
      expect(metrics.hasDebt).toBe(false);
      expect(formatLeverageRatio(metrics.ratio)).toBe("No Leverage");
    });

    it("handles liquidated position", () => {
      // Debt exceeds assets (liquidation scenario)
      const totalAssets = 8000;
      const totalDebt = 10000;

      const metrics = getLeverageMetrics(totalAssets, totalDebt);

      expect(metrics.ratio).toBe(Infinity);
      expect(metrics.healthStatus).toBe("critical");
      expect(metrics.healthFactor).toBe(0.8);
      expect(formatLeverageRatio(metrics.ratio)).toBe("Critical");
    });
  });

  describe("edge cases and error handling", () => {
    it("handles very small numbers", () => {
      const result = getLeverageMetrics(0.001, 0.0002);
      expect(result.ratio).toBe(1.25);
      expect(result.healthStatus).toBe("safe");
    });

    it("handles very large numbers", () => {
      const result = getLeverageMetrics(1e15, 2e14);
      expect(result.ratio).toBe(1.25);
      expect(result.healthStatus).toBe("safe");
    });

    it("handles floating point precision", () => {
      const result = getLeverageMetrics(10000, 3333.33);
      expect(result.debtPercentage).toBeCloseTo(33.33, 1);
    });

    it("handles equal assets and debt", () => {
      const result = getLeverageMetrics(10000, 10000);
      expect(result.ratio).toBe(Infinity);
      expect(result.healthStatus).toBe("critical");
    });
  });
});
