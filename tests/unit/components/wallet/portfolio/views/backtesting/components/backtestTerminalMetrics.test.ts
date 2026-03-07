import { describe, expect, it } from "vitest";

import {
  createHeroMetrics,
  createSecondaryMetrics,
} from "@/components/wallet/portfolio/views/backtesting/components/backtestTerminalMetrics";
import type { BacktestStrategySummary } from "@/types/backtesting";

// --- Test Helpers ---

function createMockSummary(
  overrides: Partial<BacktestStrategySummary> = {}
): BacktestStrategySummary {
  return {
    strategy_id: "simple_regime",
    display_name: "Simple Regime",
    total_invested: 10000,
    final_value: 15000,
    roi_percent: 50,
    trade_count: 42,
    max_drawdown_percent: -12.5,
    sharpe_ratio: 1.25,
    sortino_ratio: 1.8,
    calmar_ratio: 2.5,
    volatility: 0.15,
    beta: 0.85,
    ...overrides,
  };
}

// --- Tests ---

describe("createHeroMetrics", () => {
  it("returns empty array for undefined strategy", () => {
    expect(createHeroMetrics(undefined)).toEqual([]);
  });

  it("returns 3 hero metrics for valid strategy", () => {
    const metrics = createHeroMetrics(createMockSummary());
    expect(metrics).toHaveLength(3);
  });

  it("formats ROI with + prefix and % suffix", () => {
    const metrics = createHeroMetrics(createMockSummary({ roi_percent: 50.7 }));
    const roi = metrics.find(m => m.label === "ROI");

    expect(roi).toBeDefined();
    expect(roi!.value).toBe("+50.7%");
    expect(roi!.color).toBe("text-emerald-400");
  });

  it("formats ROI with one decimal place", () => {
    const metrics = createHeroMetrics(
      createMockSummary({ roi_percent: 123.456 })
    );
    const roi = metrics.find(m => m.label === "ROI");

    expect(roi!.value).toBe("+123.5%");
  });

  it("formats CALMAR ratio with 2 decimal places", () => {
    const metrics = createHeroMetrics(
      createMockSummary({ calmar_ratio: 2.567 })
    );
    const calmar = metrics.find(m => m.label === "CALMAR");

    expect(calmar).toBeDefined();
    expect(calmar!.value).toBe("2.57");
    expect(calmar!.color).toBe("text-cyan-400");
  });

  it("shows N/A for null calmar_ratio", () => {
    const metrics = createHeroMetrics(
      createMockSummary({ calmar_ratio: null })
    );
    const calmar = metrics.find(m => m.label === "CALMAR");

    expect(calmar!.value).toBe("N/A");
  });

  it("formats MAX DRAWDOWN with 1 decimal place and % suffix", () => {
    const metrics = createHeroMetrics(
      createMockSummary({ max_drawdown_percent: -18.3 })
    );
    const drawdown = metrics.find(m => m.label === "MAX DRAWDOWN");

    expect(drawdown).toBeDefined();
    expect(drawdown!.value).toBe("-18.3%");
    expect(drawdown!.color).toBe("text-rose-400");
  });

  it("generates ASCII bar strings using block characters", () => {
    const metrics = createHeroMetrics(createMockSummary({ roi_percent: 100 }));
    const roi = metrics.find(m => m.label === "ROI");

    // Bar should contain block characters (█ and ░)
    expect(roi!.bar).toMatch(/[█░]+/);
    expect(roi!.bar.length).toBe(10);
  });

  it("generates 10-character bars for all metrics", () => {
    const metrics = createHeroMetrics(createMockSummary());

    for (const metric of metrics) {
      expect(metric.bar.length).toBe(10);
    }
  });
});

describe("createSecondaryMetrics", () => {
  it("returns empty array for undefined strategy", () => {
    expect(createSecondaryMetrics(undefined)).toEqual([]);
  });

  it("returns 5 secondary metrics for valid strategy", () => {
    const metrics = createSecondaryMetrics(createMockSummary());
    expect(metrics).toHaveLength(5);
  });

  it("returns metrics in correct order", () => {
    const metrics = createSecondaryMetrics(createMockSummary());
    const labels = metrics.map(m => m.label);

    expect(labels).toEqual(["SHARPE", "SORTINO", "VOL", "BETA", "FINAL"]);
  });

  it("formats SHARPE with 2 decimal places", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ sharpe_ratio: 1.256 })
    );
    const sharpe = metrics.find(m => m.label === "SHARPE");

    expect(sharpe!.value).toBe("1.26");
  });

  it("shows N/A for null sharpe_ratio", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ sharpe_ratio: null })
    );
    const sharpe = metrics.find(m => m.label === "SHARPE");

    expect(sharpe!.value).toBe("N/A");
  });

  it("shows N/A for undefined sharpe_ratio", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ sharpe_ratio: undefined })
    );
    const sharpe = metrics.find(m => m.label === "SHARPE");

    expect(sharpe!.value).toBe("N/A");
  });

  it("formats SORTINO with 2 decimal places", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ sortino_ratio: 2.345 })
    );
    const sortino = metrics.find(m => m.label === "SORTINO");

    expect(sortino!.value).toBe("2.35");
  });

  it("shows N/A for null sortino_ratio", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ sortino_ratio: null })
    );
    const sortino = metrics.find(m => m.label === "SORTINO");

    expect(sortino!.value).toBe("N/A");
  });

  it("formats VOL as percentage with 1 decimal place", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ volatility: 0.15 })
    );
    const vol = metrics.find(m => m.label === "VOL");

    expect(vol!.value).toBe("15.0%");
  });

  it("shows N/A for null volatility", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ volatility: null })
    );
    const vol = metrics.find(m => m.label === "VOL");

    expect(vol!.value).toBe("N/A");
  });

  it("shows N/A for undefined volatility", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ volatility: undefined })
    );
    const vol = metrics.find(m => m.label === "VOL");

    expect(vol!.value).toBe("N/A");
  });

  it("formats BETA with 2 decimal places", () => {
    const metrics = createSecondaryMetrics(createMockSummary({ beta: 0.857 }));
    const beta = metrics.find(m => m.label === "BETA");

    expect(beta!.value).toBe("0.86");
  });

  it("shows N/A for null beta", () => {
    const metrics = createSecondaryMetrics(createMockSummary({ beta: null }));
    const beta = metrics.find(m => m.label === "BETA");

    expect(beta!.value).toBe("N/A");
  });

  it("formats FINAL with $ prefix and locale string", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ final_value: 15000 })
    );
    const final = metrics.find(m => m.label === "FINAL");

    expect(final!.value).toBe("$15,000");
  });

  it("formats large FINAL values with commas", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ final_value: 1234567 })
    );
    const final = metrics.find(m => m.label === "FINAL");

    expect(final!.value).toBe("$1,234,567");
  });

  it("handles zero volatility (falsy but valid)", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ volatility: 0 })
    );
    const vol = metrics.find(m => m.label === "VOL");

    expect(vol!.value).toBe("0.0%");
  });

  it("handles all null optional fields", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({
        sharpe_ratio: null,
        sortino_ratio: null,
        volatility: null,
        beta: null,
      })
    );

    expect(metrics.find(m => m.label === "SHARPE")!.value).toBe("N/A");
    expect(metrics.find(m => m.label === "SORTINO")!.value).toBe("N/A");
    expect(metrics.find(m => m.label === "VOL")!.value).toBe("N/A");
    expect(metrics.find(m => m.label === "BETA")!.value).toBe("N/A");
    // FINAL is not optional, should still format
    expect(metrics.find(m => m.label === "FINAL")!.value).toMatch(/^\$/);
  });
});
