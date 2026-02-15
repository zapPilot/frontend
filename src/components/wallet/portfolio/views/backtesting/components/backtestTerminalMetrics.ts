import type { BacktestStrategySummary } from "@/types/backtesting";

export interface HeroMetric {
  label: string;
  value: string;
  bar: string;
  color: string;
}

export interface SecondaryMetric {
  label: string;
  value: string;
}

function asciiBar(value: number, max: number, width: number): string {
  const filled = Math.round((Math.min(Math.abs(value), max) / max) * width);
  const empty = width - filled;
  return "\u2588".repeat(filled) + "\u2591".repeat(empty);
}

export function createHeroMetrics(
  strategy: BacktestStrategySummary | undefined
): HeroMetric[] {
  if (!strategy) {
    return [];
  }

  return [
    {
      label: "ROI",
      value: `+${strategy.roi_percent.toFixed(1)}%`,
      bar: asciiBar(strategy.roi_percent, 200, 10),
      color: "text-emerald-400",
    },
    {
      label: "CALMAR",
      value: strategy.calmar_ratio?.toFixed(2) ?? "N/A",
      bar: asciiBar(strategy.calmar_ratio ?? 0, 5, 10),
      color: "text-cyan-400",
    },
    {
      label: "MAX DRAWDOWN",
      value: `${strategy.max_drawdown_percent?.toFixed(1)}%`,
      bar: asciiBar(Math.abs(strategy.max_drawdown_percent ?? 0), 30, 10),
      color: "text-rose-400",
    },
  ];
}

export function createSecondaryMetrics(
  strategy: BacktestStrategySummary | undefined
): SecondaryMetric[] {
  if (!strategy) {
    return [];
  }

  return [
    { label: "SHARPE", value: strategy.sharpe_ratio?.toFixed(2) ?? "N/A" },
    { label: "SORTINO", value: strategy.sortino_ratio?.toFixed(2) ?? "N/A" },
    {
      label: "VOL",
      value: strategy.volatility
        ? `${(strategy.volatility * 100).toFixed(1)}%`
        : "N/A",
    },
    { label: "BETA", value: strategy.beta?.toFixed(2) ?? "N/A" },
    { label: "FINAL", value: `$${strategy.final_value.toLocaleString()}` },
  ];
}
