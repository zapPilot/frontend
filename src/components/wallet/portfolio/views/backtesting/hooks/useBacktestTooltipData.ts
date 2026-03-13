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

export interface BacktestTooltipProps {
  active?: boolean;
  payload?: BacktestTooltipPayloadEntry[];
  label?: string | number;
  sortedStrategyIds?: string[];
}

export function useBacktestTooltipData({
  payload,
  label,
  sortedStrategyIds,
}: BacktestTooltipProps): ParsedTooltipData | null {
  if (!payload || payload.length === 0) {
    return null;
  }

  return buildParsedTooltipData({
    payload,
    label,
    sortedStrategyIds,
  });
}
