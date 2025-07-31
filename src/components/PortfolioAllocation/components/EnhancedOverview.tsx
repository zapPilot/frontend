"use client";

import { motion } from "framer-motion";
import { AssetCategoryRow } from "./Categories";
import { PortfolioCharts } from "./Charts";
import { ExcludedCategoriesChips, RebalanceSummary } from "./Summary";
import {
  ChartDataPoint,
  OperationMode,
  ProcessedAssetCategory,
  RebalanceMode,
} from "../types";

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
  const includedCategories = processedCategories.filter(cat => !cat.isExcluded);
  const excludedCategories = processedCategories.filter(cat => cat.isExcluded);

  // Generate target chart data for rebalance mode
  const targetChartData =
    rebalanceMode?.data?.target
      .filter(cat => !cat.isExcluded)
      .map(cat => ({
        name: cat.name,
        value: cat.activeAllocationPercentage,
        id: cat.id,
        color: cat.color,
        isExcluded: false,
      })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="enhanced-overview"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold gradient-text">
          {rebalanceMode?.isEnabled
            ? "Portfolio Rebalancing"
            : "Portfolio Allocation"}
        </h3>
        <div className="text-sm text-gray-400">
          {rebalanceMode?.isEnabled
            ? `${rebalanceMode.data?.shifts.filter(s => s.action !== "maintain").length || 0} changes planned`
            : `${includedCategories.length} of ${processedCategories.length} categories active`}
        </div>
      </div>

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
            <div className="space-y-4" data-testid="allocation-list">
              {processedCategories.map(category => (
                <AssetCategoryRow
                  key={category.id}
                  category={category}
                  excludedCategoryIds={excludedCategoryIds}
                  onToggleCategoryExclusion={onToggleCategoryExclusion}
                  {...(rebalanceMode ? { rebalanceMode } : {})}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Category List for Rebalance Mode */}
      {rebalanceMode?.isEnabled && (
        <div className="space-y-4" data-testid="allocation-list">
          {processedCategories.map(category => (
            <AssetCategoryRow
              key={category.id}
              category={category}
              excludedCategoryIds={excludedCategoryIds}
              onToggleCategoryExclusion={onToggleCategoryExclusion}
              rebalanceMode={rebalanceMode}
            />
          ))}
        </div>
      )}

      {/* Swap Controls */}
      {swapControls && <div className="pt-4">{swapControls}</div>}

      {/* Action Button */}
      <div className="pt-4">
        <button
          onClick={() => onZapAction?.()}
          disabled={includedCategories.length === 0}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:from-purple-500 hover:to-blue-500"
          data-testid="zap-action-button"
        >
          {operationMode === "rebalance"
            ? `Execute Rebalance (${rebalanceMode?.data?.shifts.filter(s => s.action !== "maintain").length || 0} changes)`
            : operationMode === "zapIn"
              ? includedCategories.length === 0
                ? "Select categories to Zap In"
                : `Zap In to ${includedCategories.length} categor${includedCategories.length === 1 ? "y" : "ies"}`
              : operationMode === "zapOut"
                ? includedCategories.length === 0
                  ? "Select categories to Zap Out"
                  : `Zap Out from ${includedCategories.length} categor${includedCategories.length === 1 ? "y" : "ies"}`
                : includedCategories.length === 0
                  ? "Select categories"
                  : `Execute with ${includedCategories.length} categor${includedCategories.length === 1 ? "y" : "ies"}`}
        </button>
      </div>
    </motion.div>
  );
};
