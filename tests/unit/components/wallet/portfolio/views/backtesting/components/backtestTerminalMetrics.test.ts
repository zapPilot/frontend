import { describe, expect, it } from "vitest";

import {
  createHeroMetrics,
  createSecondaryMetrics,
} from "@/components/wallet/portfolio/views/backtesting/components/backtestTerminalMetrics";
import type { BacktestStrategySummary } from "@/types/backtesting";

function createMockSummary(
  overrides: Partial<BacktestStrategySummary> = {}
): BacktestStrategySummary {
  return {
    strategy_id: "dma_gated_fgi_default",
    display_name: "DMA Gated FGI Default",
    signal_id: "dma_gated_fgi",
    total_invested: 10000,
    final_value: 15000,
    roi_percent: 50,
    calmar_ratio: 1.24,
    max_drawdown_percent: -12.3,
    trade_count: 42,
    final_allocation: {
      spot: 0.7,
      stable: 0.3,
    },
    parameters: {},
    ...overrides,
  };
}

describe("createHeroMetrics", () => {
  it("returns an empty array for undefined strategy", () => {
    expect(createHeroMetrics(undefined)).toEqual([]);
  });

  it("returns ROI, CALMAR, and MAX DRAWDOWN metrics", () => {
    const metrics = createHeroMetrics(createMockSummary());

    expect(metrics.map(metric => metric.label)).toEqual([
      "ROI",
      "CALMAR",
      "MAX DRAWDOWN",
    ]);
  });

  it("formats ROI with a sign and percentage", () => {
    const metrics = createHeroMetrics(createMockSummary({ roi_percent: 50.7 }));
    expect(metrics[0]).toMatchObject({
      label: "ROI",
      value: "+50.7%",
      color: "text-emerald-400",
    });
  });

  it("formats CALMAR to two decimals", () => {
    const metrics = createHeroMetrics(
      createMockSummary({ calmar_ratio: 1.236 })
    );
    expect(metrics[1]).toMatchObject({
      label: "CALMAR",
      value: "1.24",
      color: "text-cyan-400",
    });
  });

  it('falls back to "N/A" when CALMAR is absent', () => {
    const metrics = createHeroMetrics(
      createMockSummary({ calmar_ratio: null })
    );

    expect(metrics[1]).toMatchObject({
      label: "CALMAR",
      value: "N/A",
    });
  });

  it("formats MAX DRAWDOWN from the absolute drawdown percentage", () => {
    const metrics = createHeroMetrics(
      createMockSummary({ max_drawdown_percent: -18.456 })
    );

    expect(metrics[2]).toMatchObject({
      label: "MAX DRAWDOWN",
      value: "18.5%",
      color: "text-rose-400",
    });
  });

  it('falls back to "N/A" when MAX DRAWDOWN is absent', () => {
    const metrics = createHeroMetrics(
      createMockSummary({ max_drawdown_percent: null })
    );

    expect(metrics[2]).toMatchObject({
      label: "MAX DRAWDOWN",
      value: "N/A",
    });
  });
});

describe("createSecondaryMetrics", () => {
  it("returns an empty array for undefined strategy", () => {
    expect(createSecondaryMetrics(undefined)).toEqual([]);
  });

  it("returns INVESTED, TRADES, STABLE, and SIGNAL metrics", () => {
    const metrics = createSecondaryMetrics(createMockSummary());

    expect(metrics).toEqual([
      { label: "INVESTED", value: "$10,000" },
      { label: "TRADES", value: "42" },
      { label: "STABLE", value: "30.0%" },
      { label: "SIGNAL", value: "dma_gated_fgi" },
    ]);
  });

  it("falls back to N/A when signal_id is absent", () => {
    const metrics = createSecondaryMetrics(
      createMockSummary({ signal_id: null })
    );

    expect(metrics[3]).toEqual({ label: "SIGNAL", value: "N/A" });
  });
});
