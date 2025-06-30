"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useMemo } from "react";
import { PortfolioDataPoint } from "../../types/portfolio";

interface ChartMetricsProps {
  portfolioHistory: PortfolioDataPoint[];
}

export function ChartMetrics({ portfolioHistory }: ChartMetricsProps) {
  const metrics = useMemo(() => {
    if (portfolioHistory.length === 0) {
      return {
        currentValue: 0,
        totalReturn: 0,
        isPositive: true,
        bestDay: 0,
        worstDay: 0,
        avgDaily: 0,
        winRate: 0,
      };
    }

    const currentValue =
      portfolioHistory[portfolioHistory.length - 1]?.value || 0;
    const firstValue = portfolioHistory[0]?.value || 0;
    const totalReturn = ((currentValue - firstValue) / firstValue) * 100;
    const isPositive = totalReturn >= 0;

    // Calculate daily returns
    const dailyReturns = [];
    for (let i = 1; i < portfolioHistory.length; i++) {
      const prevValue = portfolioHistory[i - 1]?.value || 0;
      const currValue = portfolioHistory[i]?.value || 0;
      if (prevValue > 0) {
        dailyReturns.push(((currValue - prevValue) / prevValue) * 100);
      }
    }

    const bestDay = dailyReturns.length > 0 ? Math.max(...dailyReturns) : 0;
    const worstDay = dailyReturns.length > 0 ? Math.min(...dailyReturns) : 0;
    const avgDaily =
      dailyReturns.length > 0
        ? dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length
        : 0;
    const winRate =
      dailyReturns.length > 0
        ? (dailyReturns.filter(ret => ret > 0).length / dailyReturns.length) *
          100
        : 0;

    return {
      currentValue,
      totalReturn,
      isPositive,
      bestDay,
      worstDay,
      avgDaily,
      winRate,
    };
  }, [portfolioHistory]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number, decimals = 2) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-sm text-gray-400">Portfolio Value</div>
        <div className="text-xl font-bold text-white">
          {formatCurrency(metrics.currentValue)}
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm text-gray-400">Total Return</div>
        <div
          className={`text-xl font-bold flex items-center justify-center gap-1 ${
            metrics.isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {metrics.isPositive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {formatPercentage(metrics.totalReturn)}
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm text-gray-400">Best Day</div>
        <div className="text-lg font-bold text-green-400">
          {formatPercentage(metrics.bestDay)}
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm text-gray-400">Worst Day</div>
        <div className="text-lg font-bold text-red-400">
          {formatPercentage(metrics.worstDay)}
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm text-gray-400">Avg Daily</div>
        <div className="text-lg font-bold text-gray-300">
          {formatPercentage(metrics.avgDaily, 3)}
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm text-gray-400">Win Rate</div>
        <div className="text-lg font-bold text-blue-400">
          {metrics.winRate.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
