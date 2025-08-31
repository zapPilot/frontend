"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import React from "react";
import { formatCurrency } from "../lib/formatters";
import { CategorySummary } from "../utils/portfolio.utils";
import { ErrorStateCard } from "./ui/ErrorStateCard";
import { AssetCategorySkeleton } from "./ui/LoadingState";

type TabType = "assets" | "borrowing";

interface AssetCategoriesDetailProps {
  categorySummaries: CategorySummary[];
  balanceHidden?: boolean;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  activeTab?: TabType;
}

export const AssetCategoriesDetail = React.memo<AssetCategoriesDetailProps>(
  ({
    categorySummaries,
    balanceHidden = false,
    className = "",
    isLoading = false,
    error = null,
    onRetry,
    isRetrying = false,
    activeTab = "assets",
  }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-morphism rounded-3xl p-6 border border-gray-800 ${className}`}
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
              <>
                {categorySummaries.length > 0 ? (
                  categorySummaries.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-800 rounded-2xl p-4 bg-gray-900/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        {/* Category Info */}
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <div className="font-semibold text-white">
                              {category.name}
                            </div>
                            <div className="text-sm text-gray-400">
                              {category.poolCount} positions •{" "}
                              {category.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Value & APR */}
                        <div className="text-right">
                          <div className="font-semibold text-white">
                            {formatCurrency(category.totalValue, {
                              isHidden: balanceHidden,
                            })}
                          </div>
                          <div className="text-sm text-green-400 flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {category.averageAPR.toFixed(2)}% APR
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No assets found in your portfolio.
                  </div>
                )}
              </>
            )}

            {/* Borrowing Tab Content */}
            {activeTab === "borrowing" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto bg-orange-600/10 border border-orange-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-orange-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-orange-400">
                    Borrowing Positions
                  </h4>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    Borrowing data is not available from the unified API yet.
                    This section will show your lending positions and borrowed
                    amounts when the API is updated.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);

AssetCategoriesDetail.displayName = "AssetCategoriesDetail";
