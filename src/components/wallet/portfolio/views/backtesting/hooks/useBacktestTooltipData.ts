import type { IndicatorKey } from "../components/backtestChartLegendData";
import {
  AllocationBlock,
  BacktestTooltipPayloadEntry,
  buildParsedTooltipData,
  DetailItem,
  EventItem,
  ParsedTooltipData,
  SignalItem,
  TooltipItem,
} from "./backtestTooltipDataUtils";

export type {
  AllocationBlock,
  BacktestTooltipPayloadEntry,
  DetailItem,
  EventItem,
  ParsedTooltipData,
  SignalItem,
  TooltipItem,
};

/** Maps indicator keys to their signal names in tooltip payload. */
const INDICATOR_KEY_TO_SIGNAL_NAMES: Record<IndicatorKey, string[]> = {
  btcPrice: ["BTC Price"],
  dma200: ["DMA 200"],
  sentiment: ["Sentiment"],
};

export interface BacktestTooltipProps {
  active?: boolean;
  payload?: BacktestTooltipPayloadEntry[];
  label?: string | number;
  sortedStrategyIds?: string[];
  activeIndicators?: Set<IndicatorKey>;
}

export function useBacktestTooltipData({
  payload,
  label,
  sortedStrategyIds,
  activeIndicators,
}: BacktestTooltipProps): ParsedTooltipData | null {
  if (!payload || payload.length === 0) {
    return null;
  }

  const result = buildParsedTooltipData({
    payload,
    label,
    sortedStrategyIds,
  });

  if (!result || !activeIndicators) {
    return result;
  }

  const hiddenSignalNames = new Set<string>();
  for (const [key, names] of Object.entries(INDICATOR_KEY_TO_SIGNAL_NAMES)) {
    if (!activeIndicators.has(key as IndicatorKey)) {
      for (const name of names) {
        hiddenSignalNames.add(name);
      }
    }
  }

  if (hiddenSignalNames.size === 0) {
    return result;
  }

  result.sections.signals = result.sections.signals.filter(
    signal => !hiddenSignalNames.has(signal.name)
  );

  // Also filter the derived BTC/DMA ratio when either source is hidden
  if (hiddenSignalNames.has("BTC Price") || hiddenSignalNames.has("DMA 200")) {
    result.sections.signals = result.sections.signals.filter(
      signal => signal.name !== "BTC / DMA 200"
    );
  }

  return result;
}
