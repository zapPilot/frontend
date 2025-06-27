"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "../lib/utils";
import { AssetCategory, PieChartData } from "../types/portfolio";
import { PieChart } from "./PieChart";

interface PortfolioOverviewProps {
  portfolioData: AssetCategory[];
  pieChartData?: PieChartData[];
  onLegendItemClick?: (item: PieChartData) => void;
  title?: string;
  className?: string;
  testId?: string;
}

export function PortfolioOverview({
  portfolioData,
  pieChartData: providedPieChartData,
  onLegendItemClick,
  title = "Portfolio Allocation",
  className = "",
  testId,
}: PortfolioOverviewProps) {
  const pieChartData: PieChartData[] =
    providedPieChartData ||
    portfolioData.map(cat => ({
      label: cat.name,
      value: cat.totalValue,
      percentage: cat.percentage,
      color: cat.color,
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-morphism rounded-3xl p-6 border border-gray-800 ${className}`}
      data-testid={testId || "portfolio-overview"}
    >
      <h3 className="text-xl font-bold gradient-text mb-6">{title}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex justify-center" data-testid="pie-chart-container">
          <PieChart data={pieChartData} size={250} strokeWidth={10} />
        </div>
        <div className="space-y-4" data-testid="allocation-list">
          {pieChartData.map(item => (
            <div
              key={item.label}
              className={`p-4 rounded-2xl bg-gray-900/30 border border-gray-700/50 transition-all duration-200 ${
                onLegendItemClick ? "cursor-pointer hover:bg-gray-900/50" : ""
              }`}
              data-testid={`allocation-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => onLegendItemClick?.(item)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-white">{item.label}</span>
                </div>
                <div className="text-right">
                  <div
                    className="font-bold text-white"
                    data-testid={`percentage-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.percentage.toFixed(1)}%
                  </div>
                  <div
                    className="text-sm text-gray-400"
                    data-testid={`value-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {formatCurrency(item.value)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
