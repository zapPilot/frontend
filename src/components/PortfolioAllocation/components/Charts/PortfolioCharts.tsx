"use client";

import { memo } from "react";
import { PieChartData } from "../../../../types/portfolio";
import { PieChart } from "../../../PieChart";
import { ChartDataPoint } from "../../types";

interface PortfolioChartsProps {
  chartData: ChartDataPoint[];
  targetChartData?: ChartDataPoint[];
  isRebalanceMode?: boolean;
}

export const PortfolioCharts = memo<PortfolioChartsProps>(
  ({ chartData, targetChartData, isRebalanceMode = false }) => {
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
                  data={chartData.map(
                    item =>
                      ({
                        label: item.name,
                        value: Math.round(item.value * 100),
                        percentage: item.value,
                        color: item.color,
                      }) as PieChartData
                  )}
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
                  data={targetChartData.map(
                    item =>
                      ({
                        label: item.name,
                        value: Math.round(item.value * 100),
                        percentage: item.value,
                        color: item.color,
                      }) as PieChartData
                  )}
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
        <PieChart
          data={chartData.map(
            item =>
              ({
                label: item.name,
                value: Math.round(item.value * 100), // Convert percentage to value for display
                percentage: item.value,
                color: item.color,
              }) as PieChartData
          )}
          size={300}
          strokeWidth={10}
        />
      </div>
    );
  }
);

PortfolioCharts.displayName = "PortfolioCharts";
