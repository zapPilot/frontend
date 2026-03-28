import { formatCurrency } from "@/utils";

import type { SignalItem, TooltipSections } from "./backtestTooltipDataTypes";

const KNOWN_SIGNALS = ["BTC Price", "Sentiment", "VIX", "DMA 200"];

function formatSentimentValue(
  value: number | undefined,
  sentiment: string | undefined
): string {
  const label = sentiment
    ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
    : "Unknown";

  return `${label} (${value})`;
}

/**
 * Check whether a tooltip series name should be rendered as a signal row.
 *
 * @param name - Tooltip series name
 * @returns Whether the series is a known signal
 */
export function isKnownSignal(name: string): boolean {
  return KNOWN_SIGNALS.includes(name);
}

/**
 * Format a signal value for tooltip display.
 *
 * @param signalName - Signal display name
 * @param value - Raw numeric value
 * @param sentiment - Sentiment label for the current point
 * @returns Formatted display value
 */
export function formatSignalValue(
  signalName: string,
  value: number | undefined,
  sentiment: string | undefined
): string | number {
  if (signalName === "Sentiment") {
    return formatSentimentValue(value, sentiment);
  }

  if (signalName === "BTC Price" || signalName === "DMA 200") {
    if (typeof value === "number") {
      return formatCurrency(value, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }

    return "";
  }

  if (typeof value === "number") {
    return Number(value.toFixed(2));
  }

  return value ?? "";
}

function parseNumericSignal(value: string | number): number | null {
  if (typeof value === "number") {
    return value;
  }

  const cleaned = value.replace(/[$,]/g, "");
  const numericValue = Number(cleaned);

  return Number.isFinite(numericValue) ? numericValue : null;
}

/**
 * Append a synthetic BTC/DMA ratio signal when both inputs are available.
 *
 * @param sections - Mutable tooltip sections
 * @returns Updated signals array
 */
export function appendBtcToDmaRatio(sections: TooltipSections): SignalItem[] {
  const btcSignal = sections.signals.find(
    signal => signal.name === "BTC Price"
  );
  const dmaSignal = sections.signals.find(signal => signal.name === "DMA 200");
  if (!btcSignal || !dmaSignal) {
    return sections.signals;
  }

  const btcValue = parseNumericSignal(btcSignal.value);
  const dmaValue = parseNumericSignal(dmaSignal.value);
  if (btcValue == null || dmaValue == null || dmaValue <= 0) {
    return sections.signals;
  }

  return [
    ...sections.signals,
    {
      name: "BTC / DMA 200",
      value: (btcValue / dmaValue).toFixed(2),
      color: "#a78bfa",
    },
  ];
}
