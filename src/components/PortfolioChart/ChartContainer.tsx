"use client";

import { useMemo } from "react";
import { PortfolioDataPoint } from "../../types/portfolio";
import {
  generateSVGPath,
  generateAreaPath,
  generateYAxisLabels,
} from "../../lib/chartUtils";

interface ChartContainerProps {
  portfolioHistory: PortfolioDataPoint[];
  height?: number;
  width?: number;
  padding?: number;
}

export function ChartContainer({
  portfolioHistory,
  height = 300,
  width = 800,
  padding = 10,
}: ChartContainerProps) {
  const chartData = useMemo(() => {
    if (portfolioHistory.length === 0) return null;

    const maxValue = Math.max(...portfolioHistory.map(d => d.value));
    const minValue = Math.min(...portfolioHistory.map(d => d.value));

    return {
      maxValue,
      minValue,
      portfolioPath: generateSVGPath(
        portfolioHistory,
        point => point.value,
        width,
        height,
        padding
      ),
      benchmarkPath: generateSVGPath(
        portfolioHistory,
        point => point.benchmark || 0,
        width,
        height,
        padding
      ),
      areaPath: generateAreaPath(
        portfolioHistory,
        point => point.value,
        width,
        height,
        padding
      ),
      yAxisLabels: generateYAxisLabels(minValue, maxValue, 5),
    };
  }, [portfolioHistory, height, width, padding]);

  if (!chartData) {
    return (
      <div className="relative h-80 flex items-center justify-center">
        <div className="text-gray-400">No chart data available</div>
      </div>
    );
  }

  return (
    <div className="relative h-80">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-t border-gray-800/50" />
        ))}
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 -ml-12">
        {chartData.yAxisLabels.map((label, i) => (
          <div key={i} className="flex items-center">
            {label}
          </div>
        ))}
      </div>

      {/* Chart area */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient
            id="portfolioGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="benchmarkGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Fill area under portfolio curve */}
        <path
          d={chartData.areaPath}
          fill="url(#portfolioGradient)"
          className="drop-shadow-sm"
        />

        {/* Benchmark line */}
        <path
          d={chartData.benchmarkPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.7"
        />

        {/* Portfolio line */}
        <path
          d={chartData.portfolioPath}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="3"
          className="drop-shadow-lg"
        />
      </svg>
    </div>
  );
}
