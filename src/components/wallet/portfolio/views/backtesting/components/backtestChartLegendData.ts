import { CHART_SIGNALS, type SignalKey } from "../utils/chartHelpers";

export interface LegendItem {
  label: string;
  color: string;
}

const EVENT_LEGEND_KEYS: SignalKey[] = ["buy_spot", "sell_spot"];

export const INDICATOR_LEGEND: LegendItem[] = [
  { label: "BTC Price", color: "#3b82f6" },
  { label: "DMA 200", color: "#f59e0b" },
  { label: "Sentiment", color: "#a855f7" },
];

/** Event subset shown in the chart legend (excludes borrow/repay/liquidate). */
export const EVENT_LEGEND: LegendItem[] = EVENT_LEGEND_KEYS.flatMap(key => {
  const signal = CHART_SIGNALS.find(config => config.key === key);
  return signal ? [{ label: signal.name, color: signal.color }] : [];
});
