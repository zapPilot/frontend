"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import React, { useCallback, useMemo, useRef } from "react";
import { formatCurrency, formatNumber } from "../lib/formatters";
import { AssetCategory, AssetDetail } from "../types/portfolio";
import {
  formatBorrowingAmount,
  transformPositionsForDisplay,
} from "../utils/borrowingUtils";
import { ImageWithFallback } from "./shared/ImageWithFallback";
import { ErrorStateCard } from "./ui/ErrorStateCard";
import { AssetCategorySkeleton } from "./ui/LoadingState";

interface AssetCategoriesDetailProps {
  portfolioData: AssetCategory[];
  expandedCategory: string | null;
  onCategoryToggle: (categoryId: string) => void;
  balanceHidden?: boolean;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  activeTab?: TabType;
}

type TabType = "assets" | "borrowing";

export const AssetCategoriesDetail = React.memo<AssetCategoriesDetailProps>(
  ({
    portfolioData,
    expandedCategory,
    onCategoryToggle,
    balanceHidden = false,
    className = "",
    isLoading = false,
    error = null,
    onRetry,
    isRetrying = false,
    activeTab = "assets",
  }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Transform portfolio data to separate positions into assets and borrowing
    const { assetsForDisplay, borrowingPositions } = useMemo(
      () => transformPositionsForDisplay(portfolioData),
      [portfolioData]
    );

    // Use unified skeleton component

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

    // Render individual borrowing position
    const renderBorrowingPosition = useCallback(
      (position: AssetDetail, index: number) => (
        <motion.div
          key={`borrowing-position-${position.symbol}-${position.protocol}-${index}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-4 rounded-xl bg-orange-900/20 hover:bg-orange-900/30 transition-all duration-200 border border-orange-500/30"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-800/30 flex items-center justify-center">
              <ImageWithFallback
                src={`https://zap-assets-worker.davidtnfsh.workers.dev/tokenPictures/${position.symbol?.toLowerCase().replace(/[^a-z0-9]/g, "")}.webp`}
                alt={`${position.symbol || position.name || "Unknown"} token icon`}
                fallbackType="token"
                symbol={position.symbol}
                size={20}
              />
            </div>
            <div>
              <div className="font-medium text-orange-300">{position.name}</div>
              <div className="text-sm text-orange-400/70">
                {position.protocol} • {position.type}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-semibold text-orange-300">
              <span className="sr-only">Borrowed amount: </span>
              {formatBorrowingAmount(position.value)}
            </div>
            <div className="text-sm text-orange-400/70">
              -{formatNumber(position.amount, { isHidden: balanceHidden })}{" "}
              {position.symbol}
            </div>
            <div className="text-sm text-orange-400/70">
              {position.apr > 0
                ? `${position.apr}% Borrow Rate`
                : "Rate pending"}
            </div>
          </div>

          <button
            className="p-2 rounded-lg hover:bg-orange-800/30 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-orange-500 focus-visible:outline-offset-2"
            aria-label={`View ${position.name} on ${position.protocol}`}
          >
            <ExternalLink className="w-4 h-4 text-orange-400" />
          </button>
        </motion.div>
      ),
      [balanceHidden]
    );

    return (
      <motion.div
        ref={scrollContainerRef}
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
          <div className="space-y-4">
            {/* Assets Tab */}
            {activeTab === "assets" && (
              <div
                className="space-y-4"
                role="tabpanel"
                id="assets-tabpanel"
                aria-labelledby="assets-tab"
              >
                {assetsForDisplay.length > 0 ? (
                  assetsForDisplay.map((category, categoryIndex) => (
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
                              {formatCurrency(category.totalValue, {
                                isHidden: balanceHidden,
                              })}
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
                                      {formatCurrency(asset.value, {
                                        isHidden: balanceHidden,
                                      })}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                      {formatNumber(asset.amount, {
                                        isHidden: balanceHidden,
                                      })}{" "}
                                      {asset.symbol}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                      {asset.apr > 0
                                        ? `${asset.apr}% APR`
                                        : "APR coming soon"}
                                    </div>
                                  </div>

                                  <button
                                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
                                    aria-label={`View ${asset.name} on ${asset.protocol}`}
                                  >
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No assets found in your portfolio.
                  </div>
                )}
              </div>
            )}

            {/* Borrowing Tab */}
            {activeTab === "borrowing" && (
              <div
                className="space-y-4"
                role="tabpanel"
                id="borrowing-tabpanel"
                aria-labelledby="borrowing-tab"
              >
                {borrowingPositions.length > 0 ? (
                  borrowingPositions.map((position, index) =>
                    renderBorrowingPosition(position, index)
                  )
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No borrowing positions found.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);

AssetCategoriesDetail.displayName = "AssetCategoriesDetail";
