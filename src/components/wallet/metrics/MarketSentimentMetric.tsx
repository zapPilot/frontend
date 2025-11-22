import { AlertCircle, Brain } from "lucide-react";

import type { MarketSentimentData } from "@/services/sentimentService";

import { MetricCard } from "./MetricCard";

interface MarketSentimentMetricProps {
  sentiment?: MarketSentimentData | null;
  isLoading?: boolean;
  error?: Error | null;
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
  error,
}: MarketSentimentMetricProps) {
  if (isLoading) {
    return (
      <MetricCard isLoading={true} icon={Brain}>
        <div className="h-10 w-24 bg-gray-800 rounded mb-2" />
        <div className="h-4 w-32 bg-gray-800 rounded" />
      </MetricCard>
    );
  }

  if (error) {
    return (
      <MetricCard error={true} icon={Brain}>
         <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Unavailable</span>
         </div>
         <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Market Sentiment</p>
      </MetricCard>
    );
  }

  const statusColor = getSentimentColor(sentiment?.status);

  return (
    <MetricCard icon={Brain}>
      {/* Main Content */}
      <div className="flex items-end gap-2 mb-1">
        <span className={`text-3xl md:text-4xl font-bold ${statusColor} tracking-tight`}>
          {sentiment?.value ?? "--"}
        </span>
        <span className="text-sm text-gray-400 mb-2 font-medium">/ 100</span>
      </div>

      <p className={`text-sm font-medium ${statusColor} mb-4 uppercase tracking-wide`}>
        {sentiment?.status ?? "No data"}
      </p>
      
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">
        Market Sentiment
      </p>

      {/* Quote */}
      {sentiment?.quote && (
        <div className="pt-3 border-t border-gray-800/50 w-full text-center max-w-[80%]">
          <p className="text-xs text-gray-400 italic line-clamp-2">
            “{sentiment.quote.quote}”
          </p>
        </div>
      )}
    </MetricCard>
  );
}
