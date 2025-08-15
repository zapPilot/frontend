"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import React, { useCallback, useRef } from "react";
import { formatCurrency, formatNumber } from "../lib/utils";
import { AssetCategory } from "../types/portfolio";
import { ImageWithFallback } from "./shared/ImageWithFallback";
import { ErrorStateCard } from "./ui/ErrorStateCard";

interface AssetCategoriesDetailProps {
  portfolioData: AssetCategory[];
  expandedCategory: string | null;
  onCategoryToggle: (categoryId: string) => void;
  balanceHidden?: boolean;
  title?: string;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const AssetCategoriesDetail = React.memo<AssetCategoriesDetailProps>(
  ({
    portfolioData,
    expandedCategory,
    onCategoryToggle,
    balanceHidden = false,
    title = "Portfolio Details",
    className = "",
    isLoading = false,
    error = null,
    onRetry,
    isRetrying = false,
  }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Skeleton loading component for categories
    const CategorySkeleton = () => (
      <div className="border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 bg-gray-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 rounded-full bg-gray-700 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right space-y-2">
                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-12 bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="w-5 h-5 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );

    // Handle category toggle with smooth scrolling to expanded item
    const handleCategoryToggle = useCallback(
      (categoryId: string) => {
        onCategoryToggle(categoryId);

        // If expanding a category, scroll it into view after animation
        if (expandedCategory !== categoryId) {
          setTimeout(() => {
            const categoryElement = document.getElementById(
              `category-${categoryId}`
            );
            if (categoryElement && scrollContainerRef.current) {
              categoryElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "nearest",
              });
            }
          }, 100); // Small delay to allow for expansion animation
        }
      },
      [expandedCategory, onCategoryToggle]
    );

    return (
      <motion.div
        ref={scrollContainerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-morphism rounded-3xl p-6 border border-gray-800 ${className}`}
      >
        <h2 className="text-xl font-bold gradient-text mb-6">{title}</h2>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <CategorySkeleton key={`skeleton-${index}`} />
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

        {/* Content */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {portfolioData.map((category, categoryIndex) => (
              <motion.div
                key={category.id}
                id={`category-${category.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
                className="border border-gray-800 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => handleCategoryToggle(category.id)}
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
                        {category?.assets?.length} assets •{" "}
                        {category.percentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        {formatCurrency(category.totalValue, balanceHidden)}
                      </div>
                      <div
                        className={`text-sm ${category.change24h >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {category.change24h >= 0 ? "+" : ""}
                        {category.change24h}%
                      </div>
                    </div>

                    {expandedCategory === category.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedCategory === category.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-800"
                    >
                      <div className="p-4 space-y-3">
                        {category.assets.map((asset, assetIndex) => (
                          <motion.div
                            key={`${asset.symbol}-${asset.protocol}-${assetIndex}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: assetIndex * 0.1 }}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                                <ImageWithFallback
                                  src={`https://zap-assets-worker.davidtnfsh.workers.dev/tokenPictures/${asset.symbol?.toLowerCase().replace(/[^a-z0-9]/g, "")}.webp`}
                                  alt={`${asset.symbol || asset.name || "Unknown"} token icon`}
                                  fallbackType="token"
                                  symbol={asset.symbol}
                                  size={20}
                                />
                              </div>
                              <div>
                                <div className="font-medium text-white">
                                  {asset.name}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {asset.protocol} • {asset.type}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-semibold text-white">
                                {formatCurrency(asset.value, balanceHidden)}
                              </div>
                              <div className="text-sm text-gray-400">
                                {formatNumber(asset.amount, balanceHidden)}{" "}
                                {asset.symbol}
                              </div>
                              <div className="text-sm text-gray-400">
                                {asset.apr > 0
                                  ? `${asset.apr}% APR`
                                  : "APR coming soon"}
                              </div>
                            </div>

                            <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }
);

AssetCategoriesDetail.displayName = "AssetCategoriesDetail";
