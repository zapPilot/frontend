import { AlertCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/LoadingSystem";
import type { MarketSentimentData } from "@/services/sentimentService";

interface MarketSentimentMetricModernProps {
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
  if (!status) return "text-gray-300";
  return SENTIMENT_COLOR_MAP[status] ?? "text-gray-200";
}

/**
 * Modern market sentiment metric with gradient accents and styled quote container.
 *
 * Key features:
 * - Compact padding: p-3 for reduced height
 * - Moderate fonts: text-lg/xl for sentiment value
 * - Left gradient accent border (color-coded by sentiment)
 * - Styled quote container with micro-background
 * - Badge-style sentiment label
 * - Fixed height (h-[140px]) for consistent alignment
 *
 * @example
 * ```tsx
 * <MarketSentimentMetricModern sentiment={sentimentData} />
 * ```
 */
export function MarketSentimentMetricModern({
  sentiment,
  isLoading,
  error,
}: MarketSentimentMetricModernProps) {
  const statusColor = getSentimentColor(sentiment?.status);

  // Modern card with left gradient accent
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
      {!isError && !isLoading && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            sentiment?.value !== undefined && sentiment.value >= 50
              ? "bg-gradient-to-b from-orange-500 to-rose-500"
              : "bg-gradient-to-b from-emerald-500 to-lime-500"
          }`}
        />
      )}

      <div className="p-3 h-full flex flex-col items-center justify-center">
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
      <div
        className={`px-2 py-0.5 rounded-full bg-${statusColor.replace("text-", "")}/10 border border-${statusColor.replace("text-", "")}/20 mb-0.5`}
      >
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
          {sentiment?.value ?? "--"}
        </span>
        <span className="text-xs text-gray-400 mb-0.5">/100</span>
      </div>

      <p
        className={`text-xs font-medium ${statusColor} mb-1.5 uppercase tracking-wide`}
      >
        {sentiment?.status ?? "No data"}
      </p>

      {/* Styled quote container with micro-background */}
      {sentiment?.quote && (
        <div className="w-full mt-0.5">
          <div className="bg-gray-800/20 border border-gray-800/40 rounded-lg p-1.5 text-center">
            <p className="text-[9px] leading-tight text-gray-400 italic line-clamp-2">
              &ldquo;{sentiment.quote.quote}&rdquo;
            </p>
          </div>
        </div>
      )}
    </ModernCard>
  );
}
