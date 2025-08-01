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
      // Rebalance Mode: Side-by-side pie charts
      return (
        <div className="space-y-6">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            data-testid="rebalance-pie-charts"
          >
            {/* Current Allocation */}
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-4">Current</h4>
              <div className="flex justify-center">
                <PieChart
                  data={transformedChartData}
                  size={250}
                  strokeWidth={8}
                />
              </div>
            </div>

            {/* Target Allocation */}
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-4">
                After Rebalance
              </h4>
              <div className="flex justify-center">
                <PieChart
                  data={transformedTargetData}
                  size={250}
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
      <div className="flex justify-center" data-testid="pie-chart-container">
        <PieChart data={transformedChartData} size={300} strokeWidth={10} />
      </div>
    );
  }
);

PortfolioCharts.displayName = "PortfolioCharts";
