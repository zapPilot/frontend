"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import React from "react";
import { formatCurrency } from "../lib/formatters";
import { CategorySummary } from "../utils/portfolio.utils";
import { ErrorStateCard } from "./ui/ErrorStateCard";
import { AssetCategorySkeleton } from "./ui/LoadingState";

interface AssetCategoriesDetailProps {
  categorySummaries: CategorySummary[];
  onViewAllClick: (categoryId: string) => void;
  balanceHidden?: boolean;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const AssetCategoriesDetail = React.memo<AssetCategoriesDetailProps>(
  ({
    categorySummaries,
    onViewAllClick,
    balanceHidden = false,
    className = "",
    isLoading = false,
    error = null,
    onRetry,
    isRetrying = false,
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

        {/* Category Summaries */}
        {!isLoading && !error && (
          <div className="space-y-3">
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
                          {category.poolCount} positions • {category.percentage.toFixed(1)}%
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

                  {/* View All CTA */}
                  <button
                    onClick={() => onViewAllClick(category.id)}
                    className="w-full p-2 rounded-lg bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-all duration-200 flex items-center justify-center space-x-2 text-blue-400 text-sm font-medium"
                  >
                    <span>View All {category.name} Positions</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No assets found in your portfolio.
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);

AssetCategoriesDetail.displayName = "AssetCategoriesDetail";
