"use client";

import { motion } from "framer-motion";
import {
  ChartDataPoint,
  OperationMode,
  ProcessedAssetCategory,
  RebalanceMode,
} from "../types";
import { useCategoryFilters, useTargetChartData } from "../hooks";
import { CategoryListSection } from "./Categories";
import { PortfolioCharts } from "./Charts";
import { ExcludedCategoriesChips, RebalanceSummary } from "./Summary";
import { OverviewHeader } from "./Headers";
import { ActionButton } from "./Actions";

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
      {/* Header */}
      <OverviewHeader
        rebalanceMode={rebalanceMode}
        totalCategories={processedCategories.length}
        includedCategories={includedCategories.length}
      />

      {/* Excluded Categories Chips */}
      <ExcludedCategoriesChips
        excludedCategories={excludedCategories}
        onToggleCategoryExclusion={onToggleCategoryExclusion}
      />

      {/* Main Content Grid */}
      <div
        className={`grid grid-cols-1 ${rebalanceMode?.isEnabled ? "lg:grid-cols-1" : "lg:grid-cols-2"} gap-8`}
      >
        {/* Pie Chart(s) */}
        {rebalanceMode?.isEnabled ? (
          // Rebalance Mode: Side-by-side pie charts with summary
          <div className="space-y-6">
            <PortfolioCharts
              chartData={chartData}
              targetChartData={targetChartData}
              isRebalanceMode={true}
            />

            {/* Rebalance Summary */}
            {rebalanceMode.data && (
              <RebalanceSummary rebalanceData={rebalanceMode.data} />
            )}
          </div>
        ) : (
          // Normal Mode: Single pie chart with category list
          <>
            {/* Pie Chart */}
            <PortfolioCharts chartData={chartData} />

            {/* Category List */}
            <CategoryListSection
              categories={processedCategories}
              excludedCategoryIds={excludedCategoryIds}
              onToggleCategoryExclusion={onToggleCategoryExclusion}
              rebalanceMode={rebalanceMode}
            />
          </>
        )}
      </div>

      {/* Category List for Rebalance Mode */}
      {rebalanceMode?.isEnabled && (
        <CategoryListSection
          categories={processedCategories}
          excludedCategoryIds={excludedCategoryIds}
          onToggleCategoryExclusion={onToggleCategoryExclusion}
          rebalanceMode={rebalanceMode}
        />
      )}

      {/* Swap Controls */}
      {swapControls && <div className="pt-4">{swapControls}</div>}

      {/* Action Button */}
      <ActionButton
        operationMode={operationMode}
        includedCategories={includedCategories}
        rebalanceMode={rebalanceMode}
        onAction={onZapAction}
      />
    </motion.div>
  );
};
