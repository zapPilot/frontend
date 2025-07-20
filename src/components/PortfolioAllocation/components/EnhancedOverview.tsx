"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { PieChart } from "../../PieChart";
import { PieChartData } from "../../../types/portfolio";
import { useExcludedCategories } from "../ExcludedCategoriesContext";
import { ProcessedAssetCategory, ChartDataPoint } from "../types";

interface EnhancedOverviewProps {
  processedCategories: ProcessedAssetCategory[];
  chartData: ChartDataPoint[];
  onZapAction?: (includedCategories: ProcessedAssetCategory[]) => void;
}

interface AssetCategoryRowProps {
  category: ProcessedAssetCategory;
}

const AssetCategoryRow: React.FC<AssetCategoryRowProps> = ({ category }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toggleCategoryExclusion, isExcluded } = useExcludedCategories();
  const excluded = isExcluded(category.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border transition-all duration-200 ${
        excluded
          ? "border-gray-700/50 bg-gray-900/20"
          : "border-gray-700 bg-gray-900/30 hover:bg-gray-900/50"
      }`}
      data-testid={`category-row-${category.id}`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Category Color Indicator */}
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />

            {/* Category Name */}
            <span
              className={`font-medium ${excluded ? "text-gray-500 line-through" : "text-white"}`}
            >
              {category.name}
            </span>

            {/* Protocol Count */}
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
              {category.protocols.length} protocols
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Allocation Percentage */}
            <div className="text-right">
              <div
                className={`font-bold ${excluded ? "text-gray-500" : "text-white"}`}
              >
                {excluded
                  ? "0%"
                  : `${category.activeAllocationPercentage.toFixed(1)}%`}
              </div>
              {!excluded && (
                <div className="text-sm text-gray-400">
                  ${category.totalValue.toLocaleString()}
                </div>
              )}
            </div>

            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
              data-testid={`expand-button-${category.id}`}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Exclusion Toggle */}
            <button
              onClick={() => toggleCategoryExclusion(category.id)}
              className={`p-2 rounded-lg transition-colors ${
                excluded
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-400"
                  : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
              }`}
              title={excluded ? "Include in Zap" : "Exclude from Zap"}
              data-testid={`toggle-button-${category.id}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Protocol Details */}
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-gray-700/50"
            data-testid={`protocols-list-${category.id}`}
          >
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Underlying Protocols:
              </h4>
              {category.protocols.map(protocol => (
                <div
                  key={protocol.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-white">
                        {protocol.name}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                        {protocol.chain}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">
                      {protocol.allocationPercentage.toFixed(1)}%
                    </div>
                    {protocol.apy && (
                      <div className="text-xs text-green-400">
                        {protocol.apy.toFixed(2)}% APY
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const ExcludedCategoriesChips: React.FC<{
  excludedCategories: ProcessedAssetCategory[];
}> = ({ excludedCategories }) => {
  const { removeCategoryExclusion } = useExcludedCategories();

  if (excludedCategories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-gray-900/20 border border-gray-700/50">
      <span className="text-sm text-gray-400">Excluded from Zap:</span>
      {excludedCategories.map(category => (
        <button
          key={category.id}
          onClick={() => removeCategoryExclusion(category.id)}
          className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors"
          data-testid={`excluded-chip-${category.id}`}
        >
          <span>{category.name}</span>
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
};

export const EnhancedOverview: React.FC<EnhancedOverviewProps> = ({
  processedCategories,
  chartData,
  onZapAction,
}) => {
  const includedCategories = processedCategories.filter(cat => !cat.isExcluded);
  const excludedCategories = processedCategories.filter(cat => cat.isExcluded);

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
          Portfolio Allocation
        </h3>
        <div className="text-sm text-gray-400">
          {includedCategories.length} of {processedCategories.length} categories
          active
        </div>
      </div>

      {/* Excluded Categories Chips */}
      <ExcludedCategoriesChips excludedCategories={excludedCategories} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="flex justify-center" data-testid="pie-chart-container">
          <PieChart
            data={chartData.map(
              item =>
                ({
                  label: item.name,
                  value: Math.round(item.value * 100), // Convert percentage to value for display
                  percentage: item.value,
                  color: item.color,
                }) as PieChartData
            )}
            size={300}
            strokeWidth={10}
          />
        </div>

        {/* Category List */}
        <div className="space-y-4" data-testid="allocation-list">
          {processedCategories.map(category => (
            <AssetCategoryRow key={category.id} category={category} />
          ))}
        </div>
      </div>

      {/* Zap Action Button */}
      <div className="pt-4">
        <button
          onClick={() => onZapAction?.(includedCategories)}
          disabled={includedCategories.length === 0}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:from-purple-500 hover:to-blue-500"
          data-testid="zap-action-button"
        >
          {includedCategories.length === 0
            ? "Select categories to Zap"
            : `Zap with ${includedCategories.length} categor${includedCategories.length === 1 ? "y" : "ies"}`}
        </button>
      </div>
    </motion.div>
  );
};
