import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";
import {
    DollarSign,
    Percent,
    TrendingUp,
} from "lucide-react";
import React, { useState } from "react";
import { selectBestYieldWindow } from "../../tooltips";
import type { PerformanceMetricsProps } from "./types";

export function MetricsTabs({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading,
  isYieldLoading,
  shouldShowLoading,
  portfolioChangePercentage,
  className = "",
}: PerformanceMetricsProps) {
  const [activeTab, setActiveTab] = useState<"roi" | "pnl" | "yield">("roi");

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
  const roiValue = portfolioROI?.recommended_yearly_roi ?? 0;
  const roiAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  const roiColor = roiValue >= 0 ? "text-green-400" : "text-red-400";

  // PnL Data
  const pnlAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  const pnlValue = portfolioChangePercentage;
  const pnlColor = pnlAmount >= 0 ? "text-green-400" : "text-red-400";

  // Yield Data
  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows
    ? selectBestYieldWindow(yieldWindows)
    : null;
  const yieldValue = selectedYieldWindow?.window.average_daily_yield_usd ?? 0;
  const yieldAmount = selectedYieldWindow?.window.total_yield_usd ?? 0;
  const yieldColor = "text-purple-400";

  const isLoading = shouldShowLoading || isLandingLoading || isYieldLoading;

  if (isLoading) {
    return (
      <div className={`bg-gray-900/50 border border-gray-800 rounded-lg p-4 h-[200px] ${className}`}>
        <div className="flex gap-4 mb-4">
           <div className="h-8 w-20 bg-gray-800 rounded animate-pulse" />
           <div className="h-8 w-20 bg-gray-800 rounded animate-pulse" />
           <div className="h-8 w-20 bg-gray-800 rounded animate-pulse" />
        </div>
        <WalletMetricsSkeleton />
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden ${className}`}>
      {/* Tabs Header */}
      <div className="flex border-b border-gray-800">
        <TabButton
          active={activeTab === "roi"}
          onClick={() => setActiveTab("roi")}
          label="ROI"
          icon={TrendingUp}
        />
        <TabButton
          active={activeTab === "pnl"}
          onClick={() => setActiveTab("pnl")}
          label="PnL"
          icon={DollarSign}
        />
        <TabButton
          active={activeTab === "yield"}
          onClick={() => setActiveTab("yield")}
          label="Yield"
          icon={Percent}
        />
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "roi" && (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${roiColor}`}>
                {formatPercent(roiValue)}
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-lg text-gray-300">{formatCurrency(roiAmount)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                <div className="bg-gray-800/50 p-2 rounded">
                    <span className="block text-gray-500 mb-1">7d</span>
                    {formatPercent(portfolioROI?.roi_7d?.value ?? 0)}
                </div>
                <div className="bg-gray-800/50 p-2 rounded">
                    <span className="block text-gray-500 mb-1">30d</span>
                    {formatPercent(portfolioROI?.roi_30d?.value ?? 0)}
                </div>
                <div className="bg-gray-800/50 p-2 rounded">
                    <span className="block text-gray-500 mb-1">365d</span>
                    {formatPercent(portfolioROI?.roi_365d?.value ?? 0)}
                </div>
            </div>
          </div>
        )}

        {activeTab === "pnl" && (
          <div className="space-y-4">
             <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${pnlColor}`}>
                {formatCurrency(pnlAmount)}
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-lg text-gray-300">{formatPercent(pnlValue)}</span>
            </div>
            <p className="text-sm text-gray-400">
              Estimated yearly profit/loss based on current portfolio performance.
            </p>
          </div>
        )}

        {activeTab === "yield" && (
          <div className="space-y-4">
             <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${yieldColor}`}>
                {formatCurrency(yieldValue)}
              </span>
              <span className="text-sm text-gray-400">daily avg</span>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span>Total Yield ({selectedYieldWindow?.label ?? "N/A"})</span>
                    <span className="text-white">{formatCurrency(yieldAmount)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Outliers Removed</span>
                    <span className="text-white">{selectedYieldWindow?.window.statistics.outliers_removed ?? 0}</span>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ElementType;
}

function TabButton({ active, onClick, label, icon: Icon }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${
        active
          ? "text-white bg-gray-800/50"
          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? "text-blue-400" : ""}`} />
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
      )}
    </button>
  );
}
