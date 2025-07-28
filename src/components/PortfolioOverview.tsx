"use client";

import { motion } from "framer-motion";
import { AssetCategory, PieChartData } from "../types/portfolio";
import { AssetCategoriesDetail } from "./AssetCategoriesDetail";
import { PieChart } from "./PieChart";

interface PortfolioOverviewProps {
  portfolioData: AssetCategory[];
  pieChartData?: PieChartData[];
  onLegendItemClick?: (item: PieChartData) => void;
  expandedCategory: string | null;
  onCategoryToggle: (categoryId: string) => void;
  balanceHidden?: boolean;
  title?: string;
  className?: string;
  testId?: string;
}

export function PortfolioOverview({
  portfolioData,
  pieChartData: providedPieChartData,
  expandedCategory,
  onCategoryToggle,
  balanceHidden = false,
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
          <AssetCategoriesDetail
            portfolioData={portfolioData}
            expandedCategory={expandedCategory}
            onCategoryToggle={onCategoryToggle}
            balanceHidden={balanceHidden}
            title=""
            className="!bg-transparent !border-0 !p-0"
          />
        </div>
      </div>
    </motion.div>
  );
}
