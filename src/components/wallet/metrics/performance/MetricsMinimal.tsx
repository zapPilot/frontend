import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";
import {
  ChevronDown,
  DollarSign,
  Percent,
  TrendingUp,
} from "lucide-react";
import React, { useState } from "react";
import { selectBestYieldWindow } from "../../tooltips";
import type { PerformanceMetricsProps } from "./types";

export function MetricsMinimal({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading,
  isYieldLoading,
  shouldShowLoading,
  portfolioChangePercentage,
  className = "",
}: PerformanceMetricsProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const roiValue = portfolioROI?.recommended_yearly_roi ?? 0;
  const roiAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  const roiColor = roiValue >= 0 ? "text-green-400" : "text-red-400";

  const pnlAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  const pnlValue = portfolioChangePercentage;
  const pnlColor = pnlAmount >= 0 ? "text-green-400" : "text-red-400";

  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows
    ? selectBestYieldWindow(yieldWindows)
    : null;
  const yieldValue = selectedYieldWindow?.window.average_daily_yield_usd ?? 0;
  const yieldAmount = selectedYieldWindow?.window.total_yield_usd ?? 0;

  const isLoading = shouldShowLoading || isLandingLoading || isYieldLoading;

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <WalletMetricsSkeleton />
        <WalletMetricsSkeleton />
        <WalletMetricsSkeleton />
      </div>
    );
  }

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* ROI Card */}
      <MinimalCard
        id="roi"
        icon={TrendingUp}
        value={formatPercent(roiValue)}
        colorClass={roiColor}
        expanded={expandedCard === "roi"}
        onToggle={() => toggleCard("roi")}
      >
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Estimated Yearly:</span>
            <span className="text-gray-200">{formatCurrency(roiAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>7 Day ROI:</span>
            <span className="text-gray-200">{formatPercent(portfolioROI?.roi_7d?.value ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>30 Day ROI:</span>
            <span className="text-gray-200">{formatPercent(portfolioROI?.roi_30d?.value ?? 0)}</span>
          </div>
        </div>
      </MinimalCard>

      {/* PnL Card */}
      <MinimalCard
        id="pnl"
        icon={DollarSign}
        value={formatCurrency(pnlAmount)}
        colorClass={pnlColor}
        expanded={expandedCard === "pnl"}
        onToggle={() => toggleCard("pnl")}
      >
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Change Percentage:</span>
            <span className="text-gray-200">{formatPercent(pnlValue)}</span>
          </div>
          <div className="text-gray-500 mt-2">
            Based on current portfolio performance
          </div>
        </div>
      </MinimalCard>

      {/* Yield Card */}
      <MinimalCard
        id="yield"
        icon={Percent}
        value={formatCurrency(yieldValue)}
        colorClass="text-purple-400"
        expanded={expandedCard === "yield"}
        onToggle={() => toggleCard("yield")}
      >
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Total ({selectedYieldWindow?.label ?? "N/A"}):</span>
            <span className="text-gray-200">{formatCurrency(yieldAmount)}</span>
          </div>
          <div className="text-gray-500 mt-2">
            Average daily yield from DeFi protocols
          </div>
        </div>
      </MinimalCard>
    </div>
  );
}

interface MinimalCardProps {
  id: string;
  icon: React.ElementType;
  value: string;
  colorClass: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function MinimalCard({
  icon: Icon,
  value,
  colorClass,
  expanded,
  onToggle,
  children,
}: MinimalCardProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${colorClass}`} />
          <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-800/50 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}
