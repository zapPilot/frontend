/**
 * Monthly PnL Heatmap Component
 *
 * Displays monthly profit/loss as a color-coded heatmap
 */

import { Calendar } from "lucide-react";

import { BaseCard } from "@/components/ui/BaseCard";

/**
 * Monthly PnL data point
 */
interface MonthlyPnLItem {
  month: string;
  value: number;
}

/**
 * Monthly PnL Heatmap Props
 */
interface MonthlyPnLHeatmapProps {
  monthlyPnL: MonthlyPnLItem[];
}

/**
 * Monthly PnL Heatmap
 *
 * Displays a color-coded grid of monthly profit/loss percentages.
 */
export const MonthlyPnLHeatmap: React.FC<MonthlyPnLHeatmapProps> = ({
  monthlyPnL,
}) => (
  <BaseCard variant="glass" className="p-6">
    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-400" />
      Monthly PnL Heatmap
    </h3>
    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
      {monthlyPnL.length > 0 ? (
        monthlyPnL.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <div
              className={`h-12 rounded-md flex items-center justify-center text-xs font-medium transition-transform hover:scale-105 cursor-pointer ${
                item.value > 0
                  ? "bg-green-500/20 text-green-300 border border-green-500/20"
                  : item.value < 0
                    ? "bg-red-500/20 text-red-300 border border-red-500/20"
                    : "bg-gray-800/50 text-gray-400 border border-gray-700/30"
              }`}
              style={{
                opacity:
                  item.value > 0
                    ? Math.min(0.4 + item.value * 0.06, 1)
                    : item.value < 0
                      ? Math.min(0.4 + Math.abs(item.value) * 0.1, 1)
                      : 0.3,
              }}
            >
              {item.value > 0 ? "+" : ""}
              {item.value.toFixed(1)}%
            </div>
            <span className="text-[10px] text-center text-gray-500 font-mono uppercase">
              {item.month}
            </span>
          </div>
        ))
      ) : (
        <div className="col-span-12 text-center text-gray-500 py-8">
          No monthly data available for this period
        </div>
      )}
    </div>
  </BaseCard>
);
