"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { Clock, DollarSign, Info,TrendingUp } from "lucide-react";
import React from "react";

import { selectBestYieldWindow } from "@/components/wallet/tooltips";
import { getChangeColorClasses } from "@/lib/color-utils";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

import type { PerformanceMetricsProps } from "./types";

/**
 * Mini Cards Grid - Variation 4
 *
 * Organized grid layout with mini-cards (~110-120px height).
 * 2-column top row, 1-column bottom row.
 * Subtext always visible, info icons for additional details.
 * Glass morphism styling with hover effects.
 *
 * @example
 * ```tsx
 * <MiniCardsGrid
 *   portfolioROI={data?.portfolio_roi}
 *   yieldSummaryData={yieldData}
 *   portfolioChangePercentage={5.2}
 * />
 * ```
 */
export function MiniCardsGrid({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading = false,
  isYieldLoading = false,
  shouldShowLoading = false,
  portfolioChangePercentage,
  errorMessage,
  className = "",
}: PerformanceMetricsProps) {
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

  // Determine yield badge
  const getYieldBadge = (): string | undefined => {
    if (!yieldSummaryData || daysWithData === 0) return undefined;
    if (daysWithData < 7) return "preliminary";
    if (daysWithData < 14) return "improving";
    return undefined;
  };

  const yieldBadge = getYieldBadge();

  // Color classes
  const roiColorClass = getChangeColorClasses(portfolioChangePercentage);
  const pnlColorClass = getChangeColorClasses(portfolioChangePercentage);

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className={`bg-gray-900/40 rounded-xl border border-gray-800 p-3 h-full ${className}`}>
        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* ROI Mini Card */}
          <MiniCard
            label="ROI"
            value={
              estimatedYearlyROI !== null
                ? formatPercentage(estimatedYearlyROI * 100, false, 2)
                : "—"
            }
            subtext={estimatedYearlyROI !== null ? `${recommendedPeriod} basis` : "No data"}
            icon={TrendingUp}
            colorClass={roiColorClass}
            isLoading={isLandingLoading || shouldShowLoading}
            tooltipContent={
              estimatedYearlyROI !== null
                ? `Estimated yearly ROI based on ${recommendedPeriod} performance. Annualized return on your investment.`
                : "No ROI data available"
            }
            badge="est."
          />

          {/* PnL Mini Card */}
          <MiniCard
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
            subtext={estimatedYearlyPnL !== null ? "Est. yearly" : "No data"}
            icon={DollarSign}
            colorClass={pnlColorClass}
            isLoading={isLandingLoading || shouldShowLoading}
            tooltipContent={
              estimatedYearlyPnL !== null
                ? "Estimated yearly profit/loss based on current portfolio performance trends."
                : "No PnL data available"
            }
            badge="est."
          />

          {/* Yield Mini Card (Full Width) */}
          <div className="sm:col-span-2">
            <MiniCard
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
              subtext={
                avgDailyYield !== null
                  ? `${daysWithData} days${outliersRemoved > 0 ? `, ${outliersRemoved} outliers removed` : ""}`
                  : "No data"
              }
              icon={Clock}
              colorClass="text-emerald-300"
              isLoading={isYieldLoading}
              tooltipContent={
                avgDailyYield !== null
                  ? `Average daily yield calculated over ${daysWithData} days. ${outliersRemoved > 0 ? `${outliersRemoved} statistical outliers were removed for accuracy.` : "No outliers detected."}`
                  : "No yield data available"
              }
              badge={yieldBadge}
            />
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
}

/**
 * Mini Card Component
 */
interface MiniCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  isLoading: boolean;
  tooltipContent: string;
  badge?: string | undefined;
}

function MiniCard({
  label,
  value,
  subtext,
  icon: Icon,
  colorClass,
  isLoading,
  tooltipContent,
  badge,
}: MiniCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-lg p-3 border border-gray-800/50">
        <p className="text-xs text-gray-500 mb-3">{label}</p>
        <div className="w-20 h-6 bg-gray-700 animate-pulse rounded mb-2" />
        <div className="w-full h-3 bg-gray-700 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-lg p-3
                 border border-gray-800/50 hover:border-purple-500/30
                 hover:shadow-lg hover:shadow-purple-500/10 transition-all
                 group relative"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500 group-hover:text-gray-400">{label}</p>
          {badge && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400">
              {badge}
            </span>
          )}
        </div>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              className="w-3.5 h-3.5 text-gray-600 hover:text-purple-400 transition-colors"
              aria-label={`${label} details`}
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm shadow-xl max-w-xs z-50"
              sideOffset={5}
            >
              <p className="text-gray-300">{tooltipContent}</p>
              <Tooltip.Arrow className="fill-gray-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>

      {/* Value Row */}
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
      </div>

      {/* Subtext */}
      <p className="text-xs text-gray-600 group-hover:text-gray-500 transition-colors">
        {subtext}
      </p>
    </div>
  );
}
