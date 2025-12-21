/**
 * Chart Section Skeleton Component
 *
 * Content-aware loading state showing real tabs and time period buttons
 * with skeleton placeholder only for the chart area
 */

import { ArrowDownRight, TrendingUp } from "lucide-react";

import { BaseCard } from "@/components/ui/BaseCard";

/**
 * Chart tabs matching ChartSection.tsx
 */
const CHART_TABS = [
  { label: "Performance", icon: TrendingUp },
  { label: "Drawdown", icon: ArrowDownRight },
];

/**
 * Time periods matching ChartSection.tsx
 */
const TIME_PERIODS = ["1M", "3M", "6M", "1Y", "ALL"];

/**
 * Chart Section Skeleton
 *
 * Shows real tabs and time period buttons, skeleton for chart area only
 */
export const ChartSectionSkeleton: React.FC = () => (
  <BaseCard variant="glass" className="p-1">
    {/* Real Header with tabs and period selector */}
    <div className="p-4 border-b border-gray-800/50 flex justify-between items-center bg-gray-900/40 rounded-t-xl">
      {/* Real Chart tabs */}
      <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg">
        {CHART_TABS.map((tab, i) => (
          <button
            key={i}
            disabled
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-not-allowed ${
              i === 0
                ? "bg-gray-700 text-white shadow-sm"
                : "text-gray-500"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Real Time period buttons */}
      <div className="flex gap-2">
        {TIME_PERIODS.map((period, i) => (
          <button
            key={period}
            disabled
            className={`px-2 py-0.5 text-xs rounded-md cursor-not-allowed ${
              i === 0
                ? "bg-purple-500/20 text-purple-300"
                : "text-gray-500"
            }`}
          >
            {period}
          </button>
        ))}
      </div>
    </div>

    {/* Skeleton: Chart area only */}
    <div className="p-4">
      <div
        className="h-64 bg-gray-800/30 rounded-xl animate-pulse"
        role="status"
        aria-label="Loading chart"
      />
    </div>
  </BaseCard>
);
