/**
 * severityColors - Unit Tests
 *
 * Tests for severity-based color system and metric mappers.
 */

import { describe, expect, it } from "vitest";

import {
  getColorForSeverity,
  type SeverityLevel,
  severityMappers,
} from "@/lib/ui/severityColors";

describe("getColorForSeverity", () => {
  it("should return green colors for excellent", () => {
    const result = getColorForSeverity("excellent");
    expect(result.color).toBe("text-green-400");
    expect(result.bgColor).toBe("bg-green-500/20");
  });

  it("should return lime colors for good", () => {
    const result = getColorForSeverity("good");
    expect(result.color).toBe("text-lime-400");
    expect(result.bgColor).toBe("bg-lime-500/20");
  });

  it("should return yellow colors for fair", () => {
    const result = getColorForSeverity("fair");
    expect(result.color).toBe("text-yellow-400");
    expect(result.bgColor).toBe("bg-yellow-500/20");
  });

  it("should return orange colors for poor", () => {
    const result = getColorForSeverity("poor");
    expect(result.color).toBe("text-orange-400");
    expect(result.bgColor).toBe("bg-orange-500/20");
  });

  it("should return red colors for critical", () => {
    const result = getColorForSeverity("critical");
    expect(result.color).toBe("text-red-400");
    expect(result.bgColor).toBe("bg-red-500/20");
  });
});

describe("severityMappers", () => {
  describe("drawdown", () => {
    it("should return excellent for < 5%", () => {
      expect(severityMappers.drawdown(-3)).toBe("excellent");
      expect(severityMappers.drawdown(-4.9)).toBe("excellent");
    });

    it("should return fair for 5-10%", () => {
      expect(severityMappers.drawdown(-5)).toBe("fair");
      expect(severityMappers.drawdown(-9)).toBe("fair");
    });

    it("should return poor for 10-20%", () => {
      expect(severityMappers.drawdown(-10)).toBe("poor");
      expect(severityMappers.drawdown(-19)).toBe("poor");
    });

    it("should return critical for >= 20%", () => {
      expect(severityMappers.drawdown(-20)).toBe("critical");
      expect(severityMappers.drawdown(-50)).toBe("critical");
    });
  });

  describe("sharpe", () => {
    it("should return excellent for >= 2.0", () => {
      expect(severityMappers.sharpe(2.0)).toBe("excellent");
      expect(severityMappers.sharpe(3.5)).toBe("excellent");
    });

    it("should return good for 1.0-2.0", () => {
      expect(severityMappers.sharpe(1.0)).toBe("good");
      expect(severityMappers.sharpe(1.9)).toBe("good");
    });

    it("should return fair for 0.5-1.0", () => {
      expect(severityMappers.sharpe(0.5)).toBe("fair");
      expect(severityMappers.sharpe(0.9)).toBe("fair");
    });

    it("should return poor for 0-0.5", () => {
      expect(severityMappers.sharpe(0)).toBe("poor");
      expect(severityMappers.sharpe(0.4)).toBe("poor");
    });

    it("should return critical for negative values", () => {
      expect(severityMappers.sharpe(-0.1)).toBe("critical");
      expect(severityMappers.sharpe(-1)).toBe("critical");
    });
  });

  describe("volatility", () => {
    it("should return excellent for < 20%", () => {
      expect(severityMappers.volatility(10)).toBe("excellent");
      expect(severityMappers.volatility(19)).toBe("excellent");
    });

    it("should return good for 20-40%", () => {
      expect(severityMappers.volatility(20)).toBe("good");
      expect(severityMappers.volatility(39)).toBe("good");
    });

    it("should return fair for 40-60%", () => {
      expect(severityMappers.volatility(40)).toBe("fair");
      expect(severityMappers.volatility(59)).toBe("fair");
    });

    it("should return poor for 60-85%", () => {
      expect(severityMappers.volatility(60)).toBe("poor");
      expect(severityMappers.volatility(84)).toBe("poor");
    });

    it("should return critical for >= 85%", () => {
      expect(severityMappers.volatility(85)).toBe("critical");
      expect(severityMappers.volatility(100)).toBe("critical");
    });
  });

  describe("underwater", () => {
    it("should return excellent for < 2%", () => {
      expect(severityMappers.underwater(-1)).toBe("excellent");
      expect(severityMappers.underwater(-1.9)).toBe("excellent");
    });

    it("should return good for 2-5%", () => {
      expect(severityMappers.underwater(-2)).toBe("good");
      expect(severityMappers.underwater(-4.9)).toBe("good");
    });

    it("should return fair for 5-10%", () => {
      expect(severityMappers.underwater(-5)).toBe("fair");
      expect(severityMappers.underwater(-9.9)).toBe("fair");
    });

    it("should return poor for 10-15%", () => {
      expect(severityMappers.underwater(-10)).toBe("poor");
      expect(severityMappers.underwater(-14.9)).toBe("poor");
    });

    it("should return critical for >= 15%", () => {
      expect(severityMappers.underwater(-15)).toBe("critical");
      expect(severityMappers.underwater(-30)).toBe("critical");
    });
  });
});

describe("SeverityLevel type", () => {
  it("should only allow valid severity levels", () => {
    // Type check at compile time - just verify the values exist
    const levels: SeverityLevel[] = [
      "excellent",
      "good",
      "fair",
      "poor",
      "critical",
    ];
    expect(levels).toHaveLength(5);
  });
});
