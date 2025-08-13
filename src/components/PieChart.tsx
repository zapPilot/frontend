"use client";

import { motion } from "framer-motion";
import { memo, useMemo } from "react";
import { PORTFOLIO_CONFIG } from "../constants/portfolio";
import { formatCurrency } from "../lib/utils";
import { PieChartData } from "../types/portfolio";

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  strokeWidth?: number;
  renderBalanceDisplay?: () => React.ReactNode;
  totalValue?: number; // Optional authoritative total value
}

const PieChartComponent = ({
  data,
  size = PORTFOLIO_CONFIG.DEFAULT_PIE_CHART_SIZE,
  strokeWidth = PORTFOLIO_CONFIG.DEFAULT_PIE_CHART_STROKE_WIDTH,
  renderBalanceDisplay,
  totalValue: providedTotalValue,
}: PieChartProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Memoize expensive calculations
  const chartData = useMemo(() => {
    let cumulativePercentage = 0;
    return data.map((item, index) => {
      const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = (-cumulativePercentage * circumference) / 100;
      cumulativePercentage += item.percentage;

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
        index,
      };
    });
  }, [data, circumference]);

  // Use provided totalValue if available, otherwise calculate from data
  // This ensures data consistency when totalValue comes from authoritative source
  const totalValue = useMemo(() => {
    if (providedTotalValue !== undefined) {
      return providedTotalValue;
    }
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [providedTotalValue, data]);

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          {chartData.map((item, index) => (
            <motion.circle
              key={`pie-${item.label}-${item.percentage}-${index}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={item.strokeDasharray}
              strokeDashoffset={item.strokeDashoffset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{
                strokeDasharray: item.strokeDasharray,
                strokeDashoffset: item.strokeDashoffset,
              }}
              transition={{
                duration: 1,
                delay: item.index * PORTFOLIO_CONFIG.ANIMATION_DELAY_STEP * 2,
                ease: "easeOut",
              }}
              className="hover:brightness-110 transition-all duration-200 cursor-pointer"
              style={{
                filter: `drop-shadow(0 0 8px ${item.color}40)`,
                willChange: "transform", // GPU acceleration hint
              }}
            />
          ))}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {renderBalanceDisplay
                ? renderBalanceDisplay()
                : formatCurrency(totalValue)}
            </div>
            <div className="text-sm text-gray-400">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export memoized component
export const PieChart = memo(PieChartComponent);
