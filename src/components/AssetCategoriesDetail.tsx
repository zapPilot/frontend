"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import React from "react";
import { formatCurrency } from "../lib/formatters";
import { CategorySummary } from "../utils/portfolio.utils";
import { ErrorStateCard } from "./ui/ErrorStateCard";
import { AssetCategorySkeleton } from "./ui/LoadingState";

type TabType = "assets" | "borrowing";

interface AssetCategoriesDetailProps {
  categorySummaries: CategorySummary[];
  debtCategorySummaries?: CategorySummary[];
  balanceHidden?: boolean;
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
    balanceHidden = false,
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
                      className={`border border-gray-800 rounded-2xl p-4 bg-gray-900/20 transition-all duration-200 ${
                        onCategoryClick
                          ? "hover:bg-gray-900/40 hover:border-gray-700 hover:scale-[1.02] cursor-pointer hover:shadow-lg hover:shadow-purple-500/10"
                          : ""
                      } ${isNavigating ? "opacity-75 pointer-events-none" : ""}`}
                      onClick={() => onCategoryClick?.(category.id)}
                      role={onCategoryClick ? "button" : undefined}
                      tabIndex={onCategoryClick ? 0 : undefined}
                      aria-label={
                        onCategoryClick
                          ? `View ${category.name} analytics`
                          : undefined
                      }
                      onKeyDown={e => {
                        if (
                          onCategoryClick &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          onCategoryClick(category.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        {/* Category Info */}
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {category.name}
                              {onCategoryClick && (
                                <ArrowRight className="w-4 h-4 text-gray-400 transition-colors group-hover:text-white" />
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              {category.percentage.toFixed(1)}% of total
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
                            {/* <TrendingUp className="w-3 h-3" /> */}
                            {/* {category.averageAPR.toFixed(2)}% APR */}
                            APR: Coming soon
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
              <>
                {debtCategorySummaries.length > 0 ? (
                  debtCategorySummaries.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border border-orange-800 rounded-2xl p-4 bg-orange-900/20 transition-all duration-200 ${
                        onCategoryClick
                          ? "hover:bg-orange-900/40 hover:border-orange-700 hover:scale-[1.02] cursor-pointer hover:shadow-lg hover:shadow-orange-500/10"
                          : ""
                      } ${isNavigating ? "opacity-75 pointer-events-none" : ""}`}
                      onClick={() => onCategoryClick?.(category.id)}
                      role={onCategoryClick ? "button" : undefined}
                      tabIndex={onCategoryClick ? 0 : undefined}
                      aria-label={
                        onCategoryClick
                          ? `View ${category.name} debt analytics`
                          : undefined
                      }
                      onKeyDown={e => {
                        if (
                          onCategoryClick &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          onCategoryClick(category.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        {/* Category Info */}
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {category.name}
                              {onCategoryClick && (
                                <ArrowRight className="w-4 h-4 text-orange-400 transition-colors group-hover:text-white" />
                              )}
                            </div>
                            <div className="text-sm text-orange-400">
                              {category.percentage.toFixed(1)}% of debt
                            </div>
                          </div>
                        </div>

                        {/* Value */}
                        <div className="text-right">
                          <div className="font-semibold text-orange-400">
                            {formatCurrency(category.totalValue, {
                              isHidden: balanceHidden,
                            })}
                          </div>
                          <div className="text-sm text-orange-300 text-right">
                            Borrowed
                          </div>
                        </div>
                      </div>
                    </motion.div>
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
              </>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);

AssetCategoriesDetail.displayName = "AssetCategoriesDetail";
