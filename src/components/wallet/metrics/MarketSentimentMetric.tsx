import { Brain } from "lucide-react";

import type { MarketSentimentData } from "@/services/sentimentService";

interface MarketSentimentMetricProps {
  sentiment?: MarketSentimentData | null;
  isLoading?: boolean;
}

const SENTIMENT_COLOR_MAP: Record<string, string> = {
  "Extreme Fear": "text-emerald-400",
  Fear: "text-lime-400",
  Neutral: "text-amber-300",
  Greed: "text-orange-400",
  "Extreme Greed": "text-rose-400",
};

function getSentimentColor(status?: string | null): string {
  if (!status) {
    return "text-gray-300";
  }

  return SENTIMENT_COLOR_MAP[status] ?? "text-gray-200";
}

export function MarketSentimentMetric({
  sentiment,
  isLoading,
}: MarketSentimentMetricProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-800 animate-pulse h-full">
        <div className="h-4 w-24 bg-gray-800 rounded mb-3" />
        <div className="flex items-baseline gap-2 mb-2">
          <div className="h-8 w-10 bg-gray-800 rounded" />
          <div className="h-4 w-10 bg-gray-800 rounded" />
        </div>
        <div className="h-px w-full bg-gray-800 mb-2" />
        <div className="h-3 w-32 bg-gray-800 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-800 relative overflow-hidden group hover:border-gray-700 transition-colors h-full">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Brain className="w-12 h-12" />
      </div>
      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <p className="text-sm text-gray-400 mb-1">Market Sentiment</p>
          <div className="flex items-end gap-2">
            <span
              className={`text-2xl font-bold ${getSentimentColor(
                sentiment?.status
              )}`}
            >
              {sentiment?.value ?? "--"}
            </span>
            <span className="text-sm text-gray-400 mb-1">/ 100</span>
          </div>
          <p
            className={`text-xs font-medium ${getSentimentColor(
              sentiment?.status
            )} mb-2`}
          >
            {sentiment?.status ?? "No data"}
          </p>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-300 italic">
            “{sentiment?.quote.quote ?? "Stay patient and disciplined."}”
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            — {sentiment?.quote.author ?? "All Weather Protocol"}
          </p>
        </div>
      </div>
    </div>
  );
}

