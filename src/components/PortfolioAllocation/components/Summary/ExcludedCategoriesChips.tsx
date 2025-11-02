"use client";

import { X } from "lucide-react";
import { memo } from "react";

import { ProcessedAssetCategory } from "../../types";

interface ExcludedCategoriesChipsProps {
  excludedCategories: ProcessedAssetCategory[];
  onToggleCategoryExclusion: (categoryId: string) => void;
}

export const ExcludedCategoriesChips = memo<ExcludedCategoriesChipsProps>(
  ({ excludedCategories, onToggleCategoryExclusion }) => {
    if (excludedCategories.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-gray-900/20 border border-gray-700/50">
        <span className="text-sm text-gray-400">Excluded from Zap:</span>
        {excludedCategories.map(category => (
          <button
            key={category.id}
            onClick={() => onToggleCategoryExclusion(category.id)}
            className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors"
            data-testid={`excluded-chip-${category.id}`}
          >
            <span>{category.name}</span>
            <X className="w-3 h-3" />
          </button>
        ))}
      </div>
    );
  }
);

ExcludedCategoriesChips.displayName = "ExcludedCategoriesChips";
