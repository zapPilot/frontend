import { AlertCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/LoadingSystem";
import type { MarketSentimentData } from "@/services/sentimentService";

interface MarketSentimentMetricV2Props {
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
 * Variation 2: Minimal Clean version with maximum height reduction (40-50%).
 *
 * Key changes from original:
 * - Ultra-compact padding: p-3 instead of p-6
 * - Smallest fonts: text-base/lg for value
 * - Single-line quote with line-clamp-1 for extreme compactness
 * - Minimal spacing throughout
 *
 * @example
 * ```tsx
 * <MarketSentimentMetricV2 sentiment={sentimentData} />
 * ```
 */
export function MarketSentimentMetricV2({
  sentiment,
  isLoading,
  error,
}: MarketSentimentMetricV2Props) {
  // Minimal card with p-3
  const MinimalCard = ({ children, error: isError = false }: { children: React.ReactNode; error?: boolean }) => (
    <div
      className={`${
        isError
          ? "bg-gray-900/50 border border-red-900/30 hover:border-red-800/50"
          : "bg-gray-900/50 border border-gray-800 hover:border-gray-700"
      } rounded-xl p-3 h-full flex flex-col items-center justify-center transition-colors`}
    >
      {children}
    </div>
  );

  if (isLoading) {
    return (
      <MinimalCard>
        <Skeleton variant="text" width="60px" height="24px" className="mb-0.5" />
        <Skeleton variant="text" width="80px" height="12px" />
      </MinimalCard>
    );
  }

  if (error) {
    return (
      <MinimalCard error={true}>
        <div className="flex items-center gap-1.5 text-red-400 mb-0.5">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-medium">Unavailable</span>
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
          Sentiment
        </p>
      </MinimalCard>
    );
  }

  const statusColor = getSentimentColor(sentiment?.status);

  return (
    <MinimalCard>
      {/* Score and Status - Minimal */}
      <div className="flex items-end gap-1 mb-0.5">
        {/* Smallest font: text-base/lg */}
        <span className={`text-base md:text-lg font-bold ${statusColor} tracking-tight`}>
          {sentiment?.value ?? "--"}
        </span>
        <span className="text-[10px] text-gray-400 mb-0.5">/100</span>
      </div>

      <p className={`text-[10px] font-medium ${statusColor} mb-1 uppercase tracking-wide`}>
        {sentiment?.status ?? "No data"}
      </p>

      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">
        Sentiment
      </p>

      {/* Ultra-compact quote - single line only */}
      {sentiment?.quote && (
        <div className="pt-1 border-t border-gray-800/50 w-full text-center max-w-full">
          <p className="text-[9px] leading-tight text-gray-400 italic line-clamp-1 px-1">
            &ldquo;{sentiment.quote.quote}&rdquo;
          </p>
        </div>
      )}
    </MinimalCard>
  );
}
