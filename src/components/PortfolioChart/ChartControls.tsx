"use client";

import { TrendingUp, Calendar, PieChart, Activity } from "lucide-react";
import { CHART_PERIODS } from "../../lib/portfolioUtils";

interface ChartControlsProps {
  selectedPeriod: string;
  selectedChart: "performance" | "allocation" | "drawdown";
  onPeriodChange: (period: string) => void;
  onChartChange: (chart: "performance" | "allocation" | "drawdown") => void;
}

export function ChartControls({
  selectedPeriod,
  selectedChart,
  onPeriodChange,
  onChartChange,
}: ChartControlsProps) {
  const chartTypes = [
    {
      id: "performance" as const,
      label: "Performance",
      icon: TrendingUp,
    },
    {
      id: "allocation" as const,
      label: "Allocation",
      icon: PieChart,
    },
    {
      id: "drawdown" as const,
      label: "Drawdown",
      icon: Activity,
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      {/* Chart Type Selection */}
      <div className="flex gap-2">
        {chartTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChartChange(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              selectedChart === id
                ? "bg-purple-600 text-white"
                : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Period Selection */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-400" />
        <div className="flex gap-1">
          {CHART_PERIODS.map(period => (
            <button
              key={period.value}
              onClick={() => onPeriodChange(period.value)}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                selectedPeriod === period.value
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
