"use client";

import { useDropdown } from "@/hooks/useDropdown";
import { motion } from "framer-motion";
import { memo } from "react";
import { ProcessedAssetCategory, CategoryShift } from "../../types";
import { CategoryRowHeader } from "./CategoryRowHeader";
import { CategoryAllocationSummary } from "./CategoryAllocationSummary";
import { CategoryProtocolList } from "./CategoryProtocolList";

interface AssetCategoryRowProps {
  category: ProcessedAssetCategory;
  isExcluded: boolean;
  onToggleCategoryExclusion: (categoryId: string) => void;
  isRebalanceEnabled?: boolean;
  rebalanceShift?: CategoryShift;
  rebalanceTarget?: ProcessedAssetCategory;
  allocation?: number | undefined;
  onAllocationChange?: ((value: number) => void) | undefined;
}

export const AssetCategoryRow = memo<AssetCategoryRowProps>(
  ({
    category,
    isExcluded,
    onToggleCategoryExclusion,
    isRebalanceEnabled,
    rebalanceShift,
    rebalanceTarget,
    allocation,
    onAllocationChange,
  }) => {
    const dropdown = useDropdown(false);
    const excluded = isExcluded;

    const showRebalanceInfo = Boolean(
      isRebalanceEnabled && rebalanceShift && rebalanceTarget
    );

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
          <CategoryRowHeader
            category={category}
            excluded={excluded}
            onToggleCategoryExclusion={onToggleCategoryExclusion}
            onToggleDetails={dropdown.toggle}
            isExpanded={dropdown.isOpen}
            rightContent={
              <div className="text-right">
                <CategoryAllocationSummary
                  category={category}
                  excluded={excluded}
                  showRebalanceInfo={showRebalanceInfo}
                  allocation={allocation}
                  onAllocationChange={onAllocationChange}
                  {...(rebalanceShift ? { rebalanceShift } : {})}
                  {...(rebalanceTarget ? { rebalanceTarget } : {})}
                />
              </div>
            }
          />

          {/* Expanded Protocol Details */}
          {dropdown.isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-700/50"
              data-testid={`protocols-list-${category.id}`}
            >
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  Strategy Details:
                </h4>
                {category.description && (
                  <div className="p-3 rounded-lg bg-gray-800/50">
                    <div className="text-sm text-gray-300">
                      {category.description}
                    </div>
                  </div>
                )}

                <CategoryProtocolList category={category} />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }
);

AssetCategoryRow.displayName = "AssetCategoryRow";
