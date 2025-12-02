"use client";

import { motion } from "framer-motion";

import { BaseCard } from "@/components/ui";
import { fadeInUp, SMOOTH_TRANSITION } from "@/lib/animationVariants";

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

interface EnhancedOverviewProps {
  processedCategories: ProcessedAssetCategory[];
  chartData: ChartDataPoint[];
  rebalanceMode?: RebalanceMode;
  onZapAction?: () => void;
  swapControls?: React.ReactNode;
  operationMode?: OperationMode;
  excludedCategoryIds: string[];
  onToggleCategoryExclusion: (categoryId: string) => void;
  actionEnabled?: boolean;
  actionDisabledReason?: string;
  allocations?: Record<string, number>;
  onAllocationChange?: (categoryId: string, value: number) => void;
  isLoading?: boolean;
}

export function EnhancedOverview({
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
  actionEnabled = true,
  actionDisabledReason,
}: EnhancedOverviewProps) {
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

  return (
    <motion.div
      {...fadeInUp}
      transition={SMOOTH_TRANSITION}
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
            <BaseCard
              variant="glass"
              padding="xl"
              borderRadius="xl"
              className="bg-gradient-to-br from-green-500/10 to-blue-500/10"
            >
              <h3 className="text-lg font-semibold mb-4 text-green-400">
                Quick Action
              </h3>
              {swapControls}
            </BaseCard>
          )}
          <ActionButton
            operationMode={operationMode}
            includedCategories={includedCategories}
            rebalanceMode={rebalanceMode}
            onAction={onZapAction}
            isEnabled={actionEnabled}
            disabledReason={actionDisabledReason}
          />
        </div>

        {/* Right Column: Charts */}
        <BaseCard
          variant="glass"
          padding="md"
          borderRadius="xl"
          className="bg-slate-800/20 border-slate-700/30 min-w-0 overflow-hidden"
        >
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
        </BaseCard>
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
        {...(allocations ? { allocations } : {})}
        {...(onAllocationChange ? { onAllocationChange } : {})}
        {...(rebalanceShiftMap ? { rebalanceShiftMap } : {})}
        {...(rebalanceTargetMap ? { rebalanceTargetMap } : {})}
      />
    </motion.div>
  );
}
