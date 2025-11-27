import { AlertCircle, Brain } from "lucide-react";

import { Skeleton } from "@/components/ui/LoadingSystem";
import type { MarketSentimentData } from "@/services/sentimentService";

interface MarketSentimentMetricV1Props {
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

/**
 * Compact horizontal version of MarketSentimentMetric with reduced height.
 *
 * Key changes from original:
 * - Reduced padding: p-4 instead of p-6
 * - Smaller value font: text-xl/2xl instead of text-3xl/4xl
 * - Inline score and status on same row
 * - Compact quote section with reduced font and spacing
 * - Tighter spacing throughout: mb-1 instead of mb-4
 *
 * @example
 * ```tsx
 * <MarketSentimentMetricV1
 *   sentiment={sentimentData}
 *   isLoading={false}
 * />
 * ```
 */
export function MarketSentimentMetricV1({
  sentiment,
  isLoading,
  error,
}: MarketSentimentMetricV1Props) {
  // Compact card container with p-4 instead of p-6
  const CompactCard = ({ children, error: isError = false }: { children: React.ReactNode; error?: boolean }) => (
    <div
      className={`${
        isError
          ? "bg-gray-900/50 border border-red-900/30 hover:border-red-800/50"
          : "bg-gray-900/50 border border-gray-800 hover:border-gray-700"
      } rounded-xl p-4 h-full flex flex-col items-center justify-center relative overflow-hidden transition-colors group`}
    >
      {/* Decorative icon */}
      {!isLoading && !isError && (
        <div
          className="absolute -right-6 -top-6 p-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none select-none"
          aria-hidden="true"
        >
          <Brain className="w-20 h-20 md:w-24 md:h-24 text-gray-500" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        {children}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <CompactCard>
        <Skeleton variant="text" width="80px" height="32px" className="mb-1" />
        <Skeleton variant="text" width="100px" height="14px" />
      </CompactCard>
    );
  }

  if (error) {
    return (
      <CompactCard error={true}>
        <div className="flex items-center gap-2 text-red-400 mb-1">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Unavailable</span>
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          Market Sentiment
        </p>
      </CompactCard>
    );
  }

  const statusColor = getSentimentColor(sentiment?.status);

  return (
    <CompactCard>
      {/* Main Content - COMPACT VERSION */}
      {/* Inline score and "/100" on same row */}
      <div className="flex items-end gap-1.5 mb-0.5">
        {/* Reduced font: text-xl/2xl instead of text-3xl/4xl */}
        <span
          className={`text-xl md:text-2xl font-bold ${statusColor} tracking-tight`}
        >
          {sentiment?.value ?? "--"}
        </span>
        <span className="text-xs text-gray-400 mb-1 font-medium">/ 100</span>
      </div>

      {/* Reduced spacing: mb-2 instead of mb-4 */}
      <p
        className={`text-xs font-medium ${statusColor} mb-2 uppercase tracking-wide`}
      >
        {sentiment?.status ?? "No data"}
      </p>

      {/* Reduced spacing: mb-2 instead of mb-4 */}
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
        Market Sentiment
      </p>

      {/* Compact Quote Section */}
      {sentiment?.quote && (
        <div className="pt-2 border-t border-gray-800/50 w-full text-center max-w-[85%]">
          {/* Reduced font size and line-clamp for compactness */}
          <p className="text-[10px] leading-tight text-gray-400 italic line-clamp-2">
            &ldquo;{sentiment.quote.quote}&rdquo;
          </p>
        </div>
      )}
    </CompactCard>
  );
}
