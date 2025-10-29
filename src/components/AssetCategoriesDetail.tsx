"use client";

import { TrendingUp } from "lucide-react";
import React from "react";
import { CategorySummary } from "../utils/portfolio.utils";
import { ErrorStateCard } from "./ui/ErrorStateCard";
import { AssetCategorySkeleton } from "./ui/LoadingSystem";
import { CategoryItem } from "./CategoryItem";
import { BaseCard } from "./ui/BaseCard";

type TabType = "assets" | "borrowing";

interface AssetCategoriesDetailProps {
  categorySummaries: CategorySummary[];
  debtCategorySummaries?: CategorySummary[];
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  activeTab?: TabType;
  onCategoryClick?: (categoryId: string) => void;
  isNavigating?: boolean;
}

export const AssetCategoriesDetail = React.memo<AssetCategoriesDetailProps>(
  ({
    categorySummaries,
    debtCategorySummaries = [],
    className = "",
    isLoading = false,
    error = null,
    onRetry,
    isRetrying = false,
    activeTab = "assets",
    onCategoryClick,
    isNavigating = false,
  }) => {
    return (
      <BaseCard
        variant="glass"
        padding="xl"
        borderRadius="2xl"
        border={true}
        animate={true}
        className={className}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="border border-gray-800 rounded-2xl overflow-hidden"
              >
                <div className="bg-gray-900/30">
                  <AssetCategorySkeleton />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorStateCard
            title="Failed to Load Portfolio"
            message={
              error || "Unable to fetch portfolio data. Please try again."
            }
            {...(onRetry && { onRetry })}
            isRetrying={isRetrying}
            className="!bg-transparent !border-0 !p-0"
          />
        )}

        {/* Tab Content */}
        {!isLoading && !error && (
          <div className="space-y-3">
            {/* Assets Tab Content */}
            {activeTab === "assets" && (
              <div
                role="tabpanel"
                id="assets-tabpanel"
                aria-labelledby="assets-tab assets-tab-mobile"
              >
                {categorySummaries.length > 0 ? (
                  categorySummaries.map(category => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      {...(onCategoryClick ? { onCategoryClick } : {})}
                      isNavigating={isNavigating}
                      variant="assets"
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No assets found in your portfolio.
                  </div>
                )}
              </div>
            )}

            {/* Borrowing Tab Content */}
            {activeTab === "borrowing" && (
              <div
                role="tabpanel"
                id="borrowing-tabpanel"
                aria-labelledby="borrowing-tab borrowing-tab-mobile"
              >
                {debtCategorySummaries.length > 0 ? (
                  debtCategorySummaries.map(category => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      {...(onCategoryClick ? { onCategoryClick } : {})}
                      isNavigating={isNavigating}
                      variant="borrowing"
                    />
                  ))
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-600/10 border border-green-500/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold text-green-400">
                        No Debt Found
                      </h4>
                      <p className="text-gray-400 text-sm max-w-md mx-auto">
                        Your portfolio currently has no borrowing positions.
                        This is great for your financial health!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </BaseCard>
    );
  }
);

AssetCategoriesDetail.displayName = "AssetCategoriesDetail";
