"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, DollarSign, Clock } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { getChangeColorClasses } from "@/lib/color-utils";
import { selectBestYieldWindow } from "@/components/wallet/tooltips";
import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";
import type { HeroPerformanceCardProps, PerformanceMetricType } from "./types";

/**
 * Hero Performance Card - Variation 2
 *
 * Featured metric display with tab switching between ROI, PnL, and Yield.
 * Highlights the selected metric with large typography and gradient styling.
 * Supporting metrics shown as compact indicators below.
 *
 * @example
 * ```tsx
 * <HeroPerformanceCard
 *   portfolioROI={data?.portfolio_roi}
 *   yieldSummaryData={yieldData}
 *   defaultMetric="roi"
 * />
 * ```
 */
export function HeroPerformanceCard({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading = false,
  isYieldLoading = false,
  shouldShowLoading = false,
  portfolioChangePercentage,
  errorMessage,
  defaultMetric = "roi",
  onMetricChange,
  className = "",
}: HeroPerformanceCardProps) {
  const [activeMetric, setActiveMetric] = useState<PerformanceMetricType>(defaultMetric);
  const [direction, setDirection] = useState(0);

  // Handle USER_NOT_FOUND error
  if (errorMessage === "USER_NOT_FOUND") {
    return null;
  }

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("preferred_hero_metric");
    if (saved && (saved === "roi" || saved === "pnl" || saved === "yield")) {
      setActiveMetric(saved);
    }
  }, []);

  // Extract metric data
  const estimatedYearlyROI = portfolioROI?.recommended_yearly_roi
    ? portfolioROI.recommended_yearly_roi / 100
    : null;
  const recommendedPeriod = portfolioROI?.recommended_period?.replace("roi_", "") || "30d";
  const estimatedYearlyPnL = portfolioROI?.estimated_yearly_pnl_usd ?? null;

  // Extract Yield data (select best window)
  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows ? selectBestYieldWindow(yieldWindows) : null;
  const avgDailyYield = selectedYieldWindow?.window.average_daily_yield_usd ?? null;
  const daysWithData = selectedYieldWindow?.window.period.days ?? 0;

  // Handle tab change
  const handleTabChange = (newMetric: PerformanceMetricType) => {
    const metrics: PerformanceMetricType[] = ["roi", "pnl", "yield"];
    const currentIndex = metrics.indexOf(activeMetric);
    const newIndex = metrics.indexOf(newMetric);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveMetric(newMetric);
    localStorage.setItem("preferred_hero_metric", newMetric);
    onMetricChange?.(newMetric);
  };

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const tabs = [
    { id: "roi" as const, label: "ROI", icon: TrendingUp },
    { id: "pnl" as const, label: "PnL", icon: DollarSign },
    { id: "yield" as const, label: "Yield", icon: Clock },
  ];

  // Render hero content based on active metric
  const renderHeroContent = () => {
    const isLoading = isLandingLoading || (activeMetric === "yield" && isYieldLoading);

    if (isLoading || shouldShowLoading) {
      return (
        <div className="flex flex-col items-center">
          <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">
            {activeMetric === "roi" && "Estimated Yearly ROI"}
            {activeMetric === "pnl" && "Estimated Yearly PnL"}
            {activeMetric === "yield" && "Average Daily Yield"}
          </h3>
          <WalletMetricsSkeleton showValue showPercentage={false} />
        </div>
      );
    }

    switch (activeMetric) {
      case "roi": {
        const colorClass = getChangeColorClasses(portfolioChangePercentage);
        return (
          <div className="flex flex-col items-center">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">
              Estimated Yearly ROI
            </h3>
            <div className="flex items-center gap-4">
              <TrendingUp className={`w-10 h-10 md:w-12 md:h-12 ${colorClass}`} />
              <span className={`text-4xl md:text-6xl font-bold ${colorClass}`}>
                {estimatedYearlyROI !== null
                  ? formatPercentage(estimatedYearlyROI * 100, false, 2)
                  : "—"}
              </span>
            </div>
            {estimatedYearlyROI !== null && (
              <p className="text-sm text-gray-500 mt-4">Based on {recommendedPeriod} performance</p>
            )}
          </div>
        );
      }

      case "pnl": {
        const colorClass = getChangeColorClasses(portfolioChangePercentage);
        return (
          <div className="flex flex-col items-center">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">
              Estimated Yearly PnL
            </h3>
            <div className="flex items-center gap-4">
              <DollarSign className={`w-10 h-10 md:w-12 md:h-12 ${colorClass}`} />
              <span className={`text-4xl md:text-6xl font-bold ${colorClass}`}>
                {estimatedYearlyPnL !== null
                  ? formatCurrency(estimatedYearlyPnL, { smartPrecision: true, maximumFractionDigits: 0 })
                  : "—"}
              </span>
            </div>
            {estimatedYearlyPnL !== null && (
              <p className="text-sm text-gray-500 mt-4">Estimated yearly profit/loss</p>
            )}
          </div>
        );
      }

      case "yield": {
        return (
          <div className="flex flex-col items-center">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">
              Average Daily Yield
            </h3>
            <div className="flex items-center gap-4">
              <Clock className="w-10 h-10 md:w-12 md:h-12 text-emerald-300" />
              <span className="text-4xl md:text-6xl font-bold text-emerald-300">
                {avgDailyYield !== null
                  ? formatCurrency(avgDailyYield, { smartPrecision: true })
                  : "—"}
              </span>
            </div>
            {avgDailyYield !== null && (
              <p className="text-sm text-gray-500 mt-4">Based on {daysWithData} days of data</p>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div
      className={`bg-gray-900/40 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors h-full ${className}`}
    >
      {/* Hero Section */}
      <div className="flex flex-col items-center py-8 px-4 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="relative min-h-[180px] flex items-center justify-center w-full">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeMetric}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {renderHeroContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMetric === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Supporting Metrics */}
      <div className="grid grid-cols-3 gap-3 px-4 py-4 border-t border-gray-800">
        {tabs.map((tab) => {
          if (tab.id === activeMetric) return null; // Don't show the active metric again

          let value = "—";
          let isLoading = false;

          if (tab.id === "roi") {
            isLoading = isLandingLoading || shouldShowLoading;
            value =
              estimatedYearlyROI !== null
                ? formatPercentage(estimatedYearlyROI * 100, false, 2)
                : "—";
          } else if (tab.id === "pnl") {
            isLoading = isLandingLoading || shouldShowLoading;
            value =
              estimatedYearlyPnL !== null
                ? formatCurrency(estimatedYearlyPnL, { smartPrecision: true, maximumFractionDigits: 0 })
                : "—";
          } else if (tab.id === "yield") {
            isLoading = isYieldLoading;
            value =
              avgDailyYield !== null
                ? formatCurrency(avgDailyYield, { smartPrecision: true })
                : "—";
          }

          return (
            <div key={tab.id} className="text-center">
              <p className="text-xs text-gray-500 mb-1">{tab.label}</p>
              {isLoading ? (
                <div className="h-6 bg-gray-800 animate-pulse rounded" />
              ) : (
                <p className="text-sm font-semibold text-gray-300">{value}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
