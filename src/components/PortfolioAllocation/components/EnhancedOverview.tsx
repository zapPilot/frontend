"use client";

import { motion } from "framer-motion";
import { useCategoryFilters, useTargetChartData } from "../hooks";
import {
  ChartDataPoint,
  OperationMode,
  ProcessedAssetCategory,
  RebalanceMode,
} from "../types";
import { ActionButton } from "./Actions";
import { CategoryListSection } from "./Categories";
import { PortfolioCharts, PerformanceTrendChart } from "./Charts";
import { OverviewHeader } from "./Headers";
import { ExcludedCategoriesChips, RebalanceSummary } from "./Summary";

interface EnhancedOverviewProps {
  processedCategories: ProcessedAssetCategory[];
  chartData: ChartDataPoint[];
  rebalanceMode?: RebalanceMode;
  onZapAction?: () => void;
  swapControls?: React.ReactNode;
  operationMode?: OperationMode;
  excludedCategoryIds: string[];
  onToggleCategoryExclusion: (categoryId: string) => void;
}

export const EnhancedOverview: React.FC<EnhancedOverviewProps> = ({
  processedCategories,
  chartData,
  rebalanceMode,
  onZapAction,
  swapControls,
  operationMode = "zapIn",
  excludedCategoryIds,
  onToggleCategoryExclusion,
}) => {
  // Use hooks to extract business logic from UI components
  const { includedCategories, excludedCategories } =
    useCategoryFilters(processedCategories);
  const targetChartData = useTargetChartData(rebalanceMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="enhanced-overview"
    >
      {/* Header spans full width */}
      <OverviewHeader
        rebalanceMode={rebalanceMode}
        totalCategories={processedCategories.length}
        includedCategories={includedCategories.length}
      />

      {/* Performance Trend Chart - Decision Support */}
      <PerformanceTrendChart
        excludedCategoryIds={excludedCategoryIds}
        className="col-span-full"
      />

      {/* Main Content: Actions Left, Charts Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Action Controls */}
        <div className="space-y-6">
          {swapControls && (
            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-400">
                Quick Action
              </h3>
              {swapControls}
            </div>
          )}
          <ActionButton
            operationMode={operationMode}
            includedCategories={includedCategories}
            rebalanceMode={rebalanceMode}
            onAction={onZapAction}
          />
        </div>

        {/* Right Column: Charts */}
        <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
          {rebalanceMode?.isEnabled ? (
            <div className="space-y-6">
              <PortfolioCharts
                chartData={chartData}
                targetChartData={targetChartData}
                isRebalanceMode={true}
              />
              {rebalanceMode.data && (
                <RebalanceSummary rebalanceData={rebalanceMode.data} />
              )}
            </div>
          ) : (
            <PortfolioCharts chartData={chartData} />
          )}
        </div>
      </div>

      {/* Full-width sections below */}
      <ExcludedCategoriesChips
        excludedCategories={excludedCategories}
        onToggleCategoryExclusion={onToggleCategoryExclusion}
      />

      <CategoryListSection
        categories={processedCategories}
        excludedCategoryIds={excludedCategoryIds}
        onToggleCategoryExclusion={onToggleCategoryExclusion}
        rebalanceMode={rebalanceMode}
      />
    </motion.div>
  );
};
