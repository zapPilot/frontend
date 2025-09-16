"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { memo, ReactNode } from "react";
import { ProcessedAssetCategory } from "../../types";

interface CategoryRowHeaderProps {
  category: ProcessedAssetCategory;
  excluded: boolean;
  onToggleCategoryExclusion: (categoryId: string) => void;
  onToggleDetails: () => void;
  isExpanded: boolean;
  rightContent?: ReactNode;
}

export const CategoryRowHeader = memo<CategoryRowHeaderProps>(
  ({
    category,
    excluded,
    onToggleCategoryExclusion,
    onToggleDetails,
    isExpanded,
    rightContent,
  }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: category.color }}
        />

        <span
          className={`font-medium ${excluded ? "text-gray-500 line-through" : "text-white"}`}
        >
          {category.name}
        </span>

        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
          {category.enabledProtocolCount || 0} protocols
        </span>
      </div>

      <div className="flex items-center space-x-3">
        {rightContent}
        <button
          onClick={onToggleDetails}
          className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          data-testid={`expand-button-${category.id}`}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

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
  )
);

CategoryRowHeader.displayName = "CategoryRowHeader";
