import type { BacktestStrategySummary } from "@/types/backtesting";

// ─── Mock Strategy Summaries ─────────────────────────────────────────

export const MOCK_STRATEGIES: Record<string, BacktestStrategySummary> = {
  simple_regime: {
    strategy_id: "simple_regime",
    display_name: "Simple Regime",
    total_invested: 50000,
    final_value: 113650,
    roi_percent: 127.3,
    trade_count: 42,
    max_drawdown_percent: -8.2,
    sharpe_ratio: 1.82,
    sortino_ratio: 2.15,
    calmar_ratio: 2.84,
    volatility: 0.123,
    beta: 0.85,
    parameters: { lookback: 30, threshold: 0.65 },
  },
  dca_classic: {
    strategy_id: "dca_classic",
    display_name: "DCA Classic",
    total_invested: 50000,
    final_value: 78400,
    roi_percent: 56.8,
    trade_count: 52,
    max_drawdown_percent: -18.5,
    sharpe_ratio: 0.94,
    sortino_ratio: 1.12,
    calmar_ratio: 0.91,
    volatility: 0.189,
    beta: 1.0,
    parameters: {},
  },
};

export const MOCK_SORTED_STRATEGY_IDS = ["simple_regime", "dca_classic"];

// ─── Mock Chart Timeline (Jan–Dec 2025, bi-weekly) ──────────────────

function generateChartData(): Record<string, unknown>[] {
  const points: Record<string, unknown>[] = [];
  const startDate = new Date("2025-01-01");
  const months = 12;
  const pointsPerMonth = 3;

  // Growth curves: regime outperforms steadily with smaller drawdowns
  const regimeBase = 50000;
  const dcaBase = 50000;
  const regimeFinal = 113650;
  const dcaFinal = 78400;

  const totalPoints = months * pointsPerMonth;

  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints;
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + Math.round(t * 365));

    // Regime: strong S-curve with small dip around t=0.35
    const regimeDip = t > 0.3 && t < 0.4 ? -0.08 : 0;
    const regimeValue =
      regimeBase + (regimeFinal - regimeBase) * (1 - Math.pow(1 - t, 1.8)) * (1 + regimeDip);

    // DCA: linear-ish with larger dip around t=0.35
    const dcaDip = t > 0.3 && t < 0.45 ? -0.15 : 0;
    const dcaValue =
      dcaBase + (dcaFinal - dcaBase) * t * (1 + dcaDip);

    // Sentiment oscillation
    const sentiment = 50 + 30 * Math.sin(t * Math.PI * 4) + (Math.random() - 0.5) * 10;

    points.push({
      date: date.toISOString().split("T")[0],
      simple_regime_value: Math.round(regimeValue),
      dca_classic_value: Math.round(dcaValue),
      sentiment: Math.round(Math.min(100, Math.max(0, sentiment))),
    });
  }

  return points;
}

export const MOCK_CHART_DATA = generateChartData();

export const MOCK_Y_AXIS_DOMAIN: [number, number] = [8000, 140000];

// ─── Mock Config Defaults ────────────────────────────────────────────

export const MOCK_CONFIG_DEFAULTS = {
  days: 365,
  capital: 50000,
  strategy: "simple_regime",
};

// ─── Derived Secondary Metrics ───────────────────────────────────────

export interface MockSecondaryMetric {
  label: string;
  value: string;
}

export function buildMockSecondaryMetrics(
  strategy: BacktestStrategySummary,
  uppercase?: boolean
): MockSecondaryMetric[] {
  const u = (s: string): string => (uppercase ? s.toUpperCase() : s);
  return [
    { label: u("Sharpe"), value: strategy.sharpe_ratio?.toFixed(2) ?? "N/A" },
    { label: u("Sortino"), value: strategy.sortino_ratio?.toFixed(2) ?? "N/A" },
    {
      label: u("Vol"),
      value: strategy.volatility
        ? `${(strategy.volatility * 100).toFixed(1)}%`
        : "N/A",
    },
    { label: u("Beta"), value: strategy.beta?.toFixed(2) ?? "N/A" },
    {
      label: uppercase ? "FINAL" : "Final Value",
      value: `$${strategy.final_value.toLocaleString()}`,
    },
  ];
}

// ─── Shared Animation Config ────────────────────────────────────────

export const COLLAPSE_ANIMATION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto" as const, opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

// ─── Terminal Phosphor Glow Constants ────────────────────────────────

export const PHOSPHOR_GLOW = "0 0 8px rgba(52,211,153,0.6)";
export const PHOSPHOR_GLOW_DIM = "0 0 8px rgba(52,211,153,0.4)";
