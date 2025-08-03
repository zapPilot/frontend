"use client";

import { memo } from "react";
import { PieChart } from "../../../PieChart";
import { ChartDataPoint } from "../../types";
import { useChartDataTransforms } from "../../hooks";

interface PortfolioChartsProps {
  chartData: ChartDataPoint[];
  targetChartData?: ChartDataPoint[];
  isRebalanceMode?: boolean;
}

export const PortfolioCharts = memo<PortfolioChartsProps>(
  ({ chartData, targetChartData, isRebalanceMode = false }) => {
    // Use hooks to transform chart data instead of inline transformations
    const transformedChartData = useChartDataTransforms(chartData);
    const transformedTargetData = useChartDataTransforms(targetChartData || []);

    if (isRebalanceMode && targetChartData) {
      // Rebalance Mode: Responsive side-by-side pie charts
      return (
        <div className="w-full space-y-4">
          {/* Charts Title */}
          <h3 className="text-lg font-semibold text-white text-center">
            Portfolio Comparison
          </h3>

          {/* Responsive Chart Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {/* Current Portfolio Chart */}
            <div className="flex flex-col items-center space-y-3">
              <h4 className="text-sm font-medium text-slate-300">
                Current Portfolio
              </h4>
              <div className="w-full max-w-[200px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-[220px] xl:max-w-[250px] mx-auto">
                <PieChart
                  data={transformedChartData}
                  size={200} // Base size, will be constrained by max-width
                  strokeWidth={8}
                />
              </div>
            </div>

            {/* Target Portfolio Chart */}
            <div className="flex flex-col items-center space-y-3">
              <h4 className="text-sm font-medium text-slate-300">
                Target Portfolio
              </h4>
              <div className="w-full max-w-[200px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-[220px] xl:max-w-[250px] mx-auto">
                <PieChart
                  data={transformedTargetData}
                  size={200} // Base size, will be constrained by max-width
                  strokeWidth={8}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Normal Mode: Single pie chart
    return (
      <div
        className="flex flex-col items-center space-y-4"
        data-testid="pie-chart-container"
      >
        <h3 className="text-lg font-semibold text-white">
          Portfolio Allocation
        </h3>
        <div className="w-full max-w-[280px] sm:max-w-[300px] md:max-w-[320px] mx-auto">
          <PieChart
            data={transformedChartData}
            size={280} // Base size, will be constrained by max-width
            strokeWidth={10}
          />
        </div>
      </div>
    );
  }
);

PortfolioCharts.displayName = "PortfolioCharts";
