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
  expandedCategory: string | null;
  onCategoryToggle: (categoryId: string) => void;
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
    expandedCategory,
    onCategoryToggle,
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
          <div className="space-y-4">
            {categorySummaries.length > 0 ? (
              categorySummaries.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-800 rounded-2xl overflow-hidden"
                >
                  {/* Category Header - Always Visible */}
                  <button
                    onClick={() => onCategoryToggle(category.id)}
                    className="w-full p-4 bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-200 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="text-left">
                        <div className="font-semibold text-white">
                          {category.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {category.poolCount} positions •{" "}
                          {category.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {formatCurrency(category.totalValue, {
                            isHidden: balanceHidden,
                          })}
                        </div>
                        <div className="text-sm text-green-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {category.averageAPR.toFixed(2)}% APR
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Category Summary */}
                  {expandedCategory === category.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-800 bg-gray-900/20"
                    >
                      <div className="p-4 space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 rounded-xl bg-gray-800/30">
                            <div className="text-2xl font-bold text-white">
                              {category.poolCount}
                            </div>
                            <div className="text-sm text-gray-400">
                              Positions
                            </div>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-gray-800/30">
                            <div className="text-2xl font-bold text-green-400">
                              {category.averageAPR.toFixed(2)}%
                            </div>
                            <div className="text-sm text-gray-400">Avg APR</div>
                          </div>
                        </div>

                        {/* Top Protocols */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">
                            Top Protocols by Value
                          </h4>
                          <div className="space-y-2">
                            {category.topProtocols.map(
                              (protocol, protocolIndex) => (
                                <div
                                  key={`${protocol.name}-${protocolIndex}`}
                                  className="flex items-center justify-between p-2 rounded-lg bg-gray-800/20"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div className="text-sm font-medium text-white">
                                      {protocol.name}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      ({protocol.count} position
                                      {protocol.count !== 1 ? "s" : ""})
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-white">
                                    {formatCurrency(protocol.value, {
                                      isHidden: balanceHidden,
                                    })}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* View All CTA */}
                        <button
                          onClick={() => onViewAllClick(category.id)}
                          className="w-full mt-4 p-3 rounded-xl bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 transition-all duration-200 flex items-center justify-center space-x-2 text-blue-400 font-medium"
                        >
                          <span>View All {category.name} Positions</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
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
