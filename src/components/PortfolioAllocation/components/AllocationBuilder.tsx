"use client";

import { motion } from "framer-motion";
import { ChevronDown, Trash2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useExcludedCategories } from "../ExcludedCategoriesContext";
import { ProcessedAssetCategory } from "../types";

interface AllocationBuilderProps {
  processedCategories: ProcessedAssetCategory[];
  onZapAction?: (includedCategories: ProcessedAssetCategory[]) => void;
}

interface CategoryBarProps {
  category: ProcessedAssetCategory;
  maxValue: number;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ category, maxValue }) => {
  const [showProtocols, setShowProtocols] = useState(false);
  const { toggleCategoryExclusion } = useExcludedCategories();

  const barWidth = category.isExcluded
    ? 0
    : (category.activeAllocationPercentage / maxValue) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`rounded-2xl border p-4 transition-all duration-300 ${
        category.isExcluded
          ? "border-gray-700/50 bg-gray-900/10"
          : "border-gray-700 bg-gray-900/30 hover:bg-gray-900/50"
      }`}
      data-testid={`category-bar-${category.id}`}
    >
      <div className="space-y-3">
        {/* Category Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span
              className={`font-medium ${category.isExcluded ? "text-gray-500 line-through" : "text-white"}`}
            >
              {category.name}
            </span>
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
              {category.protocols.length}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div
                className={`font-bold ${category.isExcluded ? "text-gray-500" : "text-white"}`}
              >
                {category.isExcluded
                  ? "0%"
                  : `${category.activeAllocationPercentage.toFixed(1)}%`}
              </div>
              {!category.isExcluded && (
                <div className="text-sm text-gray-400">
                  ${category.totalValue.toLocaleString()}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowProtocols(!showProtocols)}
              className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${showProtocols ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Horizontal Bar */}
        <div className="relative">
          <div className="w-full h-6 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: category.isExcluded
                  ? "transparent"
                  : `linear-gradient(90deg, ${category.color}, ${category.color}90)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          {/* Drag Handle for Exclusion */}
          <motion.button
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all ${
              category.isExcluded
                ? "bg-gray-600 text-gray-400"
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            }`}
            onClick={() => toggleCategoryExclusion(category.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={
              category.isExcluded
                ? "Include in allocation"
                : "Exclude from allocation"
            }
          >
            <Trash2 className="w-3 h-3" />
          </motion.button>
        </div>

        {/* Protocol Details */}
        {showProtocols && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pt-3 border-t border-gray-700/50"
          >
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Protocols:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {category.protocols.map(protocol => (
                  <div
                    key={protocol.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {protocol.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {protocol.chain}
                      </div>
                    </div>
                    <div className="text-xs text-gray-300 ml-2">
                      {protocol.allocationPercentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const ExclusionZone: React.FC<{
  excludedCategories: ProcessedAssetCategory[];
}> = ({ excludedCategories }) => {
  const { removeCategoryExclusion } = useExcludedCategories();

  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-600 bg-gray-900/10 p-6 text-center">
      <div className="flex flex-col items-center space-y-3">
        <div className="p-3 rounded-full bg-gray-800/50">
          <Trash2 className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-300">
            Excluded Categories
          </h3>
          <p className="text-sm text-gray-500">
            Categories here won&apos;t be included in Zap operations
          </p>
        </div>

        {excludedCategories.length > 0 && (
          <div className="w-full space-y-2">
            {excludedCategories.map(category => (
              <motion.button
                key={category.id}
                onClick={() => removeCategoryExclusion(category.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:bg-gray-800/50 transition-all"
                whileHover={{ scale: 1.02 }}
                data-testid={`excluded-category-${category.id}`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full opacity-50"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm text-gray-400">{category.name}</span>
                </div>
                <RotateCcw className="w-4 h-4 text-gray-500" />
              </motion.button>
            ))}
          </div>
        )}

        {excludedCategories.length === 0 && (
          <div className="text-sm text-gray-500 italic">
            All categories are currently active
          </div>
        )}
      </div>
    </div>
  );
};

export const AllocationBuilder: React.FC<AllocationBuilderProps> = ({
  processedCategories,
  onZapAction,
}) => {
  const includedCategories = processedCategories.filter(cat => !cat.isExcluded);
  const excludedCategories = processedCategories.filter(cat => cat.isExcluded);

  const maxAllocation = Math.max(
    ...includedCategories.map(cat => cat.activeAllocationPercentage),
    1
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="allocation-builder"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold gradient-text">
          Portfolio Allocation Builder
        </h3>
        <div className="text-sm text-gray-400">
          {includedCategories.length} active • {excludedCategories.length}{" "}
          excluded
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Categories - Horizontal Bars */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-lg font-medium text-white">Active Categories</h4>
          <div className="space-y-3">
            {includedCategories.map(category => (
              <CategoryBar
                key={category.id}
                category={category}
                maxValue={maxAllocation}
              />
            ))}

            {includedCategories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No active categories</p>
                <p className="text-sm">
                  Restore categories from the exclusion zone
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Exclusion Zone */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Exclusion Zone</h4>
          <ExclusionZone excludedCategories={excludedCategories} />
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
            ? "Restore categories to Zap"
            : `Build Zap with ${includedCategories.length} categor${includedCategories.length === 1 ? "y" : "ies"}`}
        </button>
      </div>
    </motion.div>
  );
};
