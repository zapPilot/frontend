"use client";

import { motion } from "framer-motion";
import { PieChart, PieChartLegend } from "./PieChart";
import { AssetCategory, PieChartData } from "../types/portfolio";

interface PortfolioOverviewProps {
  portfolioData: AssetCategory[];
  onLegendItemClick?: (item: PieChartData) => void;
  title?: string;
  className?: string;
}

export function PortfolioOverview({
  portfolioData,
  onLegendItemClick,
  title = "Asset Distribution",
  className = "",
}: PortfolioOverviewProps) {
  const pieChartData: PieChartData[] = portfolioData.map(cat => ({
    label: cat.name,
    value: cat.totalValue,
    percentage: cat.percentage,
    color: cat.color,
  }));

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Pie Chart */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-morphism rounded-3xl p-6 border border-gray-800"
      >
        <h2 className="text-xl font-bold gradient-text mb-6">{title}</h2>
        <PieChart data={pieChartData} size={250} />
      </motion.div>

      {/* Category Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 glass-morphism rounded-3xl p-6 border border-gray-800"
      >
        <h2 className="text-xl font-bold gradient-text mb-6">Categories</h2>
        <PieChartLegend data={pieChartData} onItemClick={onLegendItemClick} />
      </motion.div>
    </div>
  );
}
