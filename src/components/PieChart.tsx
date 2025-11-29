"use client";

import { motion, useReducedMotion } from "framer-motion";
import { memo, useMemo } from "react";

import { PORTFOLIO_CONFIG } from "../constants/portfolio";
import { useResolvedBalanceVisibility } from "../hooks/useResolvedBalanceVisibility";
import { formatCurrency } from "../lib/formatters";
import { PieChartData } from '@/types/domain/portfolio';

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  strokeWidth?: number;
  renderBalanceDisplay?: () => React.ReactNode;
  totalValue?: number; // Optional authoritative total value
  totalBorrowing?: number; // Amount being borrowed
  showNetValue?: boolean; // Whether to show net vs gross value
}

const PieChartComponent = ({
  data,
  size = PORTFOLIO_CONFIG.DEFAULT_PIE_CHART_SIZE,
  strokeWidth = PORTFOLIO_CONFIG.DEFAULT_PIE_CHART_STROKE_WIDTH,
  renderBalanceDisplay,
  totalValue: providedTotalValue,
  totalBorrowing = 0,
  showNetValue = true,
}: PieChartProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const prefersReducedMotion = useReducedMotion();
  const balanceHidden = useResolvedBalanceVisibility();

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

  // Calculate values for display
  const calculatedValues = useMemo(() => {
    const calculatedTotal = data.reduce((sum, item) => sum + item.value, 0);
    const displayTotal =
      providedTotalValue !== undefined ? providedTotalValue : calculatedTotal;
    const netValue = showNetValue
      ? displayTotal - totalBorrowing
      : displayTotal;
    const hasBorrowing = totalBorrowing > 0;

    return {
      displayTotal,
      netValue,
      hasBorrowing,
    };
  }, [providedTotalValue, data, totalBorrowing, showNetValue]);

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
          role="presentation"
          aria-hidden="true"
        >
          {chartData.map((item, index) => {
            const key = `pie-${item.label}-${item.percentage}-${index}`;
            const commonProps = {
              cx: size / 2,
              cy: size / 2,
              r: radius,
              fill: "transparent",
              stroke: item.color,
              strokeWidth,
              strokeDasharray: item.strokeDasharray,
              strokeDashoffset: item.strokeDashoffset,
              strokeLinecap: "round" as const,
              className: "hover:brightness-110 transition-all duration-200",
            };
            const animate = !prefersReducedMotion && chartData.length <= 8;
            return animate ? (
              <motion.circle
                key={key}
                {...commonProps}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{
                  strokeDasharray: item.strokeDasharray,
                  strokeDashoffset: item.strokeDashoffset,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ) : (
              <circle key={key} {...commonProps} />
            );
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {renderBalanceDisplay ? (
              renderBalanceDisplay()
            ) : (
              <>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(calculatedValues.netValue, {
                    isHidden: balanceHidden,
                  })}
                </div>
                <div className="text-sm text-gray-400">Total Value</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export memoized component
export const PieChart = memo(PieChartComponent);
