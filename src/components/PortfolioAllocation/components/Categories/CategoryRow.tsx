"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { memo } from "react";
import { useDropdown } from "@/hooks/useDropdown";
import { ProcessedAssetCategory, RebalanceMode } from "../../types";

interface AssetCategoryRowProps {
  category: ProcessedAssetCategory;
  rebalanceMode?: RebalanceMode;
  excludedCategoryIds: string[];
  onToggleCategoryExclusion: (categoryId: string) => void;
}

export const AssetCategoryRow = memo<AssetCategoryRowProps>(
  ({
    category,
    rebalanceMode,
    excludedCategoryIds,
    onToggleCategoryExclusion,
  }) => {
    const dropdown = useDropdown(false);
    const excluded = excludedCategoryIds.includes(category.id);

    // Get rebalance data for this category
    const categoryShift = rebalanceMode?.data?.shifts.find(
      s => s.categoryId === category.id
    );
    const targetCategory = rebalanceMode?.data?.target.find(
      t => t.id === category.id
    );
    const isRebalanceMode =
      rebalanceMode?.isEnabled && categoryShift && targetCategory;

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
                {isRebalanceMode ? (
                  // Rebalance Mode: Show Before -> After
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-400">
                        {category.activeAllocationPercentage.toFixed(1)}%
                      </div>
                      <span className="text-gray-500">→</span>
                      <div
                        className={`font-bold ${
                          categoryShift!.action === "increase"
                            ? "text-green-400"
                            : categoryShift!.action === "decrease"
                              ? "text-red-400"
                              : "text-white"
                        }`}
                      >
                        {targetCategory!.activeAllocationPercentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <div
                        className={`${
                          categoryShift!.action === "increase"
                            ? "text-green-400"
                            : categoryShift!.action === "decrease"
                              ? "text-red-400"
                              : "text-gray-400"
                        }`}
                      >
                        {categoryShift!.changeAmount > 0 ? "+" : ""}
                        {categoryShift!.changeAmount.toFixed(1)}%
                      </div>
                      <div className="text-gray-500">•</div>
                      <div className="text-gray-400">
                        {categoryShift!.actionDescription}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Normal Mode: Show Current Allocation
                  <div>
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
                )}
              </div>

              {/* Expand/Collapse Button */}
              <button
                onClick={dropdown.toggle}
                className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
                data-testid={`expand-button-${category.id}`}
              >
                {dropdown.isOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Exclusion Toggle */}
              <button
                onClick={() => onToggleCategoryExclusion(category.id)}
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
          {dropdown.isOpen && (
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
  }
);

AssetCategoryRow.displayName = "AssetCategoryRow";
