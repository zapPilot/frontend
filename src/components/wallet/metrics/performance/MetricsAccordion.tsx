import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";
import {
    ChevronUp,
    DollarSign,
    Info,
    Percent,
    TrendingUp,
} from "lucide-react";
import React, { useState } from "react";
import { selectBestYieldWindow } from "../../tooltips";
import type { PerformanceMetricsProps } from "./types";

export function MetricsAccordion({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading,
  isYieldLoading,
  shouldShowLoading,
  portfolioChangePercentage,
  className = "",
}: PerformanceMetricsProps) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const toggleMetric = (metric: string) => {
    setExpandedMetric(expandedMetric === metric ? null : metric);
  };

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper to format percentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // ROI Data
  // Use recommended_yearly_roi as the main percentage
  const roiValue = portfolioROI?.recommended_yearly_roi ?? 0;
  // Use estimated_yearly_pnl_usd as the dollar amount context
  const roiAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  const roiColor = roiValue >= 0 ? "text-green-400" : "text-red-400";

  // PnL Data
  // Use estimated_yearly_pnl_usd as the main PnL value
  const pnlAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  // Use portfolioChangePercentage as the secondary percentage
  const pnlValue = portfolioChangePercentage;
  const pnlColor = pnlAmount >= 0 ? "text-green-400" : "text-red-400";

  // Yield Data
  // Select best window
  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows
    ? selectBestYieldWindow(yieldWindows)
    : null;

  const yieldValue = selectedYieldWindow?.window.average_daily_yield_usd ?? 0;
  // Use total_yield_usd from the window as the secondary value
  const yieldAmount = selectedYieldWindow?.window.total_yield_usd ?? 0;
  const yieldColor = "text-purple-400";

  const isLoading = shouldShowLoading || isLandingLoading || isYieldLoading;

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <WalletMetricsSkeleton />
        <WalletMetricsSkeleton />
        <WalletMetricsSkeleton />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ROI Metric */}
      <MetricRow
        label="ROI (Yearly)"
        icon={TrendingUp}
        primaryValue={formatPercent(roiValue)}
        secondaryValue={formatCurrency(roiAmount)}
        colorClass={roiColor}
        isExpanded={expandedMetric === "roi"}
        onToggle={() => toggleMetric("roi")}
      >
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-2">
          <div>
            <span className="block text-gray-500">7d</span>
            {formatPercent(portfolioROI?.roi_7d?.value ?? 0)}
          </div>
          <div>
            <span className="block text-gray-500">30d</span>
            {formatPercent(portfolioROI?.roi_30d?.value ?? 0)}
          </div>
          <div>
            <span className="block text-gray-500">365d</span>
            {formatPercent(portfolioROI?.roi_365d?.value ?? 0)}
          </div>
          <div>
             <span className="block text-gray-500">Rec. Period</span>
             {portfolioROI?.recommended_period ?? "N/A"}
          </div>
        </div>
      </MetricRow>

      {/* PnL Metric */}
      <MetricRow
        label="Est. Yearly PnL"
        icon={DollarSign}
        primaryValue={formatCurrency(pnlAmount)}
        secondaryValue={formatPercent(pnlValue)}
        colorClass={pnlColor}
        isExpanded={expandedMetric === "pnl"}
        onToggle={() => toggleMetric("pnl")}
      >
        <div className="text-xs text-gray-400 mt-2">
          <p>Estimated yearly profit/loss based on current portfolio performance.</p>
        </div>
      </MetricRow>

      {/* Yield Metric */}
      <MetricRow
        label="Avg Daily Yield"
        icon={Percent}
        primaryValue={formatCurrency(yieldValue)}
        secondaryValue={formatCurrency(yieldAmount)}
        colorClass={yieldColor}
        isExpanded={expandedMetric === "yield"}
        onToggle={() => toggleMetric("yield")}
      >
        <div className="text-xs text-gray-400 mt-2">
          <div className="flex justify-between mb-1">
            <span>Total Yield ({selectedYieldWindow?.label ?? "N/A"}):</span>
            <span className="text-white">
              {formatCurrency(yieldAmount)}
            </span>
          </div>
          <div className="flex justify-between">
             <span>Outliers Removed:</span>
             <span className="text-white">
                {selectedYieldWindow?.window.statistics.outliers_removed ?? 0}
             </span>
          </div>
        </div>
      </MetricRow>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  icon: React.ElementType;
  primaryValue: string;
  secondaryValue: string;
  colorClass: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function MetricRow({
  label,
  icon: Icon,
  primaryValue,
  secondaryValue,
  colorClass,
  isExpanded,
  onToggle,
  children,
}: MetricRowProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden transition-all hover:border-gray-700">
      <div
        className="p-3 flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md bg-gray-800 ${colorClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">{label}</p>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-sm font-bold ${colorClass}`}>
                {primaryValue}
              </span>
              <span className="text-xs text-gray-500">/</span>
              <span className="text-xs text-gray-400">{secondaryValue}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-500 hover:text-white transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <Info className="w-4 h-4" />
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-800/50 bg-gray-900/30">
          {children}
        </div>
      )}
    </div>
  );
}
