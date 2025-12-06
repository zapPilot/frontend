/**
 * Market Sentiment Metric - Variation 1
 *
 * Conservative merge: Removes philosophy quote, adds regime label badge.
 * Quote appears only in RebalanceSection to eliminate duplication.
 */

import { AlertCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/LoadingSystem";

interface MarketSentimentMetricV1Props {
  value?: number;
  status?: string;
  regimeLabel?: string; // NEW: Shows derived regime
  isLoading?: boolean;
  error?: boolean;
}

const SENTIMENT_COLOR_MAP: Record<string, string> = {
  "Extreme Fear": "text-emerald-400",
  Fear: "text-lime-400",
  Neutral: "text-amber-300",
  Greed: "text-orange-400",
  "Extreme Greed": "text-rose-400",
};

const SENTIMENT_BORDER_COLOR_MAP: Record<string, string> = {
  "Extreme Fear": "bg-emerald-400/10 border-emerald-400/20",
  Fear: "bg-lime-400/10 border-lime-400/20",
  Neutral: "bg-amber-300/10 border-amber-300/20",
  Greed: "bg-orange-400/10 border-orange-400/20",
  "Extreme Greed": "bg-rose-400/10 border-rose-400/20",
};

const SENTIMENT_HINT_MAP: Record<string, string> = {
  "Extreme Fear": "buy",
  Fear: "watch",
  Neutral: "hold",
  Greed: "trim",
  "Extreme Greed": "sell",
};

const SENTIMENT_HINT_COLOR_MAP: Record<string, string> = {
  "Extreme Fear": "text-emerald-500/80",
  Fear: "text-lime-500/80",
  Neutral: "text-amber-500/80",
  Greed: "text-orange-500/80",
  "Extreme Greed": "text-rose-500/80",
};

function getSentimentColor(status?: string): string {
  if (!status) return "text-gray-300";
  return SENTIMENT_COLOR_MAP[status] ?? "text-gray-200";
}

function getSentimentBorderColor(status?: string): string {
  if (!status) return "bg-gray-300/10 border-gray-300/20";
  return SENTIMENT_BORDER_COLOR_MAP[status] ?? "bg-gray-300/10 border-gray-300/20";
}

function getSentimentHint(status?: string): string | null {
  if (!status) return null;
  return SENTIMENT_HINT_MAP[status] ?? null;
}

function getSentimentHintColor(status?: string): string {
  if (!status) return "text-gray-500";
  return SENTIMENT_HINT_COLOR_MAP[status] ?? "text-gray-500";
}

export function MarketSentimentMetricV1({
  value,
  status,
  regimeLabel,
  isLoading,
  error,
}: MarketSentimentMetricV1Props) {
  const statusColor = getSentimentColor(status);
  const borderColor = getSentimentBorderColor(status);
  const hint = getSentimentHint(status);
  const hintColor = getSentimentHintColor(status);

  const ModernCard = ({
    children,
    error: isError = false,
  }: {
    children: React.ReactNode;
    error?: boolean;
  }) => (
    <div
      className={`relative ${
        isError
          ? "bg-gray-900/50 border border-red-900/30 hover:border-red-800/50"
          : "bg-gray-900/50 border border-gray-800 hover:border-gray-700"
      } rounded-xl overflow-hidden transition-colors h-[140px]`}
    >
      {/* Left gradient accent - color matches sentiment */}
      {!isError && !isLoading && value !== undefined && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            value >= 50
              ? "bg-gradient-to-b from-orange-500 to-rose-500"
              : "bg-gradient-to-b from-emerald-500 to-lime-500"
          }`}
        />
      )}

      <div className="p-3 h-full flex flex-col items-center justify-start pt-2">
        {children}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <ModernCard>
        <Skeleton variant="text" width="70px" height="28px" className="mb-1" />
        <Skeleton variant="text" width="90px" height="12px" />
      </ModernCard>
    );
  }

  if (error) {
    return (
      <ModernCard error={true}>
        <div className="flex items-center gap-2 text-red-400 mb-1">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Unavailable</span>
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
          Sentiment
        </p>
      </ModernCard>
    );
  }

  return (
    <ModernCard>
      {/* Badge label */}
      <div className={`px-2 py-0.5 rounded-full ${borderColor} mb-0.5`}>
        <span
          className={`text-[10px] ${statusColor} uppercase tracking-wider font-medium`}
        >
          Market Sentiment
        </span>
      </div>

      {/* Score and status */}
      <div className="flex items-end gap-1.5 mb-0.5">
        <span
          className={`text-lg md:text-xl font-bold ${statusColor} tracking-tight`}
        >
          {value ?? "--"}
        </span>
        <span className="text-xs text-gray-400 mb-0.5">/100</span>
      </div>

      <p
        className={`text-xs font-medium ${statusColor} mb-1.5 uppercase tracking-wide`}
      >
        {status ?? "No data"}
        {hint && (
          <span
            className={`text-[10px] ${hintColor} font-normal ml-1.5 lowercase`}
          >
            {hint}
          </span>
        )}
      </p>

      {/* NEW: Regime label (replaces quote) */}
      {regimeLabel && (
        <div className="w-full mt-auto">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-2 py-1 text-center">
            <p className="text-[9px] text-purple-300 uppercase tracking-wider font-medium">
              Regime: {regimeLabel}
            </p>
          </div>
        </div>
      )}
    </ModernCard>
  );
}
