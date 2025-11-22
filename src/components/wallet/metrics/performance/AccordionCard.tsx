"use client";

import { AnimatePresence,motion } from "framer-motion";
import { ChevronDown,Clock, DollarSign, TrendingUp } from "lucide-react";
import React, { useState } from "react";

import { selectBestYieldWindow } from "@/components/wallet/tooltips";
import { getChangeColorClasses } from "@/lib/color-utils";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

import type { PerformanceMetricsProps } from "./types";

type ExpandedMetric = "roi" | "pnl" | "yield" | null;

/**
 * Accordion Card - Variation 3
 *
 * Most compact collapsed state (~75px height).
 * Shows all metrics as inline pills, click to expand details below.
 * Only one metric expanded at a time with smooth animations.
 *
 * @example
 * ```tsx
 * <AccordionCard
 *   portfolioROI={data?.portfolio_roi}
 *   yieldSummaryData={yieldData}
 *   portfolioChangePercentage={5.2}
 * />
 * ```
 */
export function AccordionCard({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading = false,
  isYieldLoading = false,
  shouldShowLoading = false,
  portfolioChangePercentage,
  errorMessage,
  className = "",
}: PerformanceMetricsProps) {
  const [expandedMetric, setExpandedMetric] = useState<ExpandedMetric>(null);

  // Handle USER_NOT_FOUND error
  if (errorMessage === "USER_NOT_FOUND") {
    return null;
  }

  // Extract ROI data
  const estimatedYearlyROI = portfolioROI?.recommended_yearly_roi
    ? portfolioROI.recommended_yearly_roi / 100
    : null;
  const recommendedPeriod = portfolioROI?.recommended_period?.replace("roi_", "") || "30d";

  // Extract PnL data
  const estimatedYearlyPnL = portfolioROI?.estimated_yearly_pnl_usd ?? null;

  // Extract Yield data (select best window)
  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows ? selectBestYieldWindow(yieldWindows) : null;
  const avgDailyYield = selectedYieldWindow?.window.average_daily_yield_usd ?? null;
  const daysWithData = selectedYieldWindow?.window.period.days ?? 0;
  const outliersRemoved = selectedYieldWindow?.window.statistics.outliers_removed ?? 0;

  // Color classes
  const roiColorClass = getChangeColorClasses(portfolioChangePercentage);
  const pnlColorClass = getChangeColorClasses(portfolioChangePercentage);

  const handleToggle = (metric: ExpandedMetric) => {
    setExpandedMetric(expandedMetric === metric ? null : metric);
  };

  return (
    <div
      className={`bg-gray-900/40 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-3 pb-2">
        <h3 className="text-sm text-gray-400">Performance Summary</h3>
      </div>

      {/* Metrics Pills Row */}
      <div className="flex items-center justify-between gap-2 px-3 pb-3">
        {/* ROI Pill */}
        <MetricPill
          label="ROI"
          value={
            estimatedYearlyROI !== null
              ? formatPercentage(estimatedYearlyROI * 100, false, 2)
              : "—"
          }
          icon={TrendingUp}
          colorClass={roiColorClass}
          isLoading={isLandingLoading || shouldShowLoading}
          isExpanded={expandedMetric === "roi"}
          onClick={() => handleToggle("roi")}
        />

        {/* PnL Pill */}
        <MetricPill
          label="PnL"
          value={
            estimatedYearlyPnL !== null
              ? formatCurrency(estimatedYearlyPnL, {
                  smartPrecision: true,
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : "—"
          }
          icon={DollarSign}
          colorClass={pnlColorClass}
          isLoading={isLandingLoading || shouldShowLoading}
          isExpanded={expandedMetric === "pnl"}
          onClick={() => handleToggle("pnl")}
        />

        {/* Yield Pill */}
        <MetricPill
          label="Yield"
          value={
            avgDailyYield !== null
              ? formatCurrency(avgDailyYield, {
                  smartPrecision: true,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "—"
          }
          icon={Clock}
          colorClass="text-emerald-300"
          isLoading={isYieldLoading}
          isExpanded={expandedMetric === "yield"}
          onClick={() => handleToggle("yield")}
        />
      </div>

      {/* Expanded Details Section */}
      <AnimatePresence mode="wait">
        {expandedMetric === "roi" && (
          <ExpandedDetails
            title="Estimated Yearly ROI"
            details={[
              `Based on ${recommendedPeriod} performance`,
              "Annualized return on investment",
              estimatedYearlyROI !== null ? `Trending: ${portfolioChangePercentage > 0 ? "↑" : "↓"} ${formatPercentage(Math.abs(portfolioChangePercentage), true, 1)}` : "",
            ].filter(Boolean)}
          />
        )}
        {expandedMetric === "pnl" && (
          <ExpandedDetails
            title="Estimated Yearly PnL"
            details={[
              "Estimated yearly profit/loss",
              "Based on current trends",
              estimatedYearlyPnL !== null ? `Change: ${portfolioChangePercentage > 0 ? "↑" : "↓"} ${formatPercentage(Math.abs(portfolioChangePercentage), true, 1)}` : "",
            ].filter(Boolean)}
          />
        )}
        {expandedMetric === "yield" && (
          <ExpandedDetails
            title="Average Daily Yield"
            details={[
              `Calculated over ${daysWithData} days`,
              outliersRemoved > 0 ? `${outliersRemoved} outliers removed` : "No outliers detected",
              daysWithData < 7 ? "⚠️ Preliminary data" : "✓ Sufficient data",
            ].filter(Boolean)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Metric Pill Component
 */
interface MetricPillProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  isLoading: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

function MetricPill({
  label,
  value,
  icon: Icon,
  colorClass,
  isLoading,
  isExpanded,
  onClick,
}: MetricPillProps) {
  if (isLoading) {
    return (
      <div className="flex-1 px-3 py-2 rounded-lg bg-gray-800/50 border border-transparent">
        <div className="w-full h-5 bg-gray-700 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center gap-1 px-2 sm:px-3 py-2 rounded-lg
        bg-gray-800/50 hover:bg-gray-800 border transition-all cursor-pointer group
        ${isExpanded ? "border-purple-500/50 bg-gray-800" : "border-transparent"}
      `}
      aria-expanded={isExpanded}
      aria-label={`${label} ${value}`}
    >
      <div className="flex items-center gap-1">
        <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${colorClass}`} />
        <span className="text-xs text-gray-500 group-hover:text-gray-300">{label}</span>
        <ChevronDown
          className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </div>
      <span className={`text-sm sm:text-base font-semibold ${colorClass}`}>{value}</span>
    </button>
  );
}

/**
 * Expanded Details Component
 */
interface ExpandedDetailsProps {
  title: string;
  details: string[];
}

function ExpandedDetails({ title, details }: ExpandedDetailsProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="border-t border-gray-800 bg-gradient-to-b from-purple-900/10 to-transparent overflow-hidden"
    >
      <div className="p-4">
        <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
          {title}
        </h4>
        <ul className="text-sm text-gray-300 space-y-1.5">
          {details.map((detail, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
