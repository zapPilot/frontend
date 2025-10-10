"use client";

import { motion } from "framer-motion";
import { usePortfolioAllocationViewModel } from "../hooks";
import {
  ChartDataPoint,
  OperationMode,
  ProcessedAssetCategory,
  RebalanceMode,
} from "../types";
import { ActionButton } from "./ActionsAndControls";
import { CategoryListSection } from "./Categories";
import { PerformanceTrendChart, PortfolioCharts } from "./Charts";
import { OverviewHeader } from "./Headers";
import { ExcludedCategoriesChips, RebalanceSummary } from "./Summary";

interface AllocationStatusSummary {
  totalAllocated: number;
}

interface EnhancedOverviewProps {
  processedCategories: ProcessedAssetCategory[];
  chartData: ChartDataPoint[];
  rebalanceMode?: RebalanceMode;
  onZapAction?: () => void;
  swapControls?: React.ReactNode;
  operationMode?: OperationMode;
  excludedCategoryIds: string[];
  onToggleCategoryExclusion: (categoryId: string) => void;
  allocations?: Record<string, number> | undefined;
  onAllocationChange?:
    | ((categoryId: string, value: number) => void)
    | undefined;
  allocationStatus?: AllocationStatusSummary | undefined;
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
  allocations,
  onAllocationChange,
  allocationStatus,
}) => {
  const {
    includedCategories,
    excludedCategories,
    excludedCategoryIdsSet,
    targetChartData,
    rebalanceShiftMap,
    rebalanceTargetMap,
    isRebalanceEnabled,
    totalCategories,
  } = usePortfolioAllocationViewModel({
    processedCategories,
    rebalanceMode,
    excludedCategoryIds,
    chartData,
  });

  const totalAllocated = allocationStatus?.totalAllocated ?? 0;

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
        totalCategories={totalCategories}
        includedCategories={includedCategories.length}
      />

      {/* Performance Trend Chart - Decision Support */}
      <PerformanceTrendChart
        excludedCategoryIds={excludedCategoryIds}
        className="col-span-full"
      />

      {/* Main Content: Responsive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 xl:gap-8">
        {/* Left Column: Action Controls */}
        <div className="space-y-4 md:space-y-6">
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
        <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/30 min-w-0 overflow-hidden">
          {rebalanceMode?.isEnabled ? (
            <div className="space-y-4 md:space-y-6">
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
        excludedCategoryIdsSet={excludedCategoryIdsSet}
        onToggleCategoryExclusion={onToggleCategoryExclusion}
        isRebalanceEnabled={isRebalanceEnabled}
        allocations={allocations}
        onAllocationChange={onAllocationChange}
        {...(rebalanceShiftMap ? { rebalanceShiftMap } : {})}
        {...(rebalanceTargetMap ? { rebalanceTargetMap } : {})}
      />
    </motion.div>
  );
};
