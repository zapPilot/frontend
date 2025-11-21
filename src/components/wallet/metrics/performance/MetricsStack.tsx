import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";
import { sortProtocolsByTodayYield } from "@/lib/sortProtocolsByTodayYield";
import {
    DollarSign,
    Info,
    Percent,
    TrendingUp,
} from "lucide-react";
import React from "react";
import { ROITooltip, selectBestYieldWindow, useMetricsTooltip, YieldBreakdownTooltip } from "../../tooltips";
import type { PerformanceMetricsProps } from "./types";

export function MetricsStack({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading,
  isYieldLoading,
  shouldShowLoading,
  portfolioChangePercentage,
  className = "",
}: PerformanceMetricsProps) {
  // Tooltips
  const roiTooltip = useMetricsTooltip<HTMLButtonElement>();
  const yieldTooltip = useMetricsTooltip<HTMLButtonElement>();

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

  // Yield Breakdown for Tooltip
  const sortedProtocolBreakdown = React.useMemo(() => {
    const protocolYieldBreakdown =
      selectedYieldWindow?.window.protocol_breakdown ?? [];
    return sortProtocolsByTodayYield(protocolYieldBreakdown);
  }, [selectedYieldWindow]);
  const outliersRemoved = selectedYieldWindow?.window.statistics.outliers_removed ?? 0;


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
      {/* ROI Card */}
      <MetricCard
        label="ROI (Yearly)"
        icon={TrendingUp}
        primaryValue={formatPercent(roiValue)}
        secondaryValue={formatCurrency(roiAmount)}
        colorClass={roiColor}
        triggerRef={roiTooltip.triggerRef}
        onToggle={roiTooltip.toggle}
      />
      {roiTooltip.visible && portfolioROI && (
        <ROITooltip
          tooltipRef={roiTooltip.tooltipRef}
          position={roiTooltip.position}
          roiData={portfolioROI}
        />
      )}

      {/* PnL Card */}
      <MetricCard
        label="Est. Yearly PnL"
        icon={DollarSign}
        primaryValue={formatCurrency(pnlAmount)}
        secondaryValue={formatPercent(pnlValue)}
        colorClass={pnlColor}
      />

      {/* Yield Card */}
      <MetricCard
        label="Avg Daily Yield"
        icon={Percent}
        primaryValue={formatCurrency(yieldValue)}
        secondaryValue={formatCurrency(yieldAmount)}
        colorClass={yieldColor}
        triggerRef={yieldTooltip.triggerRef}
        onToggle={yieldTooltip.toggle}
      />
      {yieldTooltip.visible && selectedYieldWindow && (
        <YieldBreakdownTooltip
          tooltipRef={yieldTooltip.tooltipRef}
          position={yieldTooltip.position}
          selectedWindow={selectedYieldWindow}
          allWindows={yieldWindows}
          breakdown={sortedProtocolBreakdown}
          outliersRemoved={outliersRemoved}
        />
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  icon: React.ElementType;
  primaryValue: string;
  secondaryValue: string;
  colorClass: string;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  onToggle?: () => void;
}

function MetricCard({
  label,
  icon: Icon,
  primaryValue,
  secondaryValue,
  colorClass,
  triggerRef,
  onToggle,
}: MetricCardProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md bg-gray-800 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-bold ${colorClass}`}>
              {primaryValue}
            </span>
            <span className="text-sm text-gray-500">/</span>
            <span className="text-sm text-gray-400">{secondaryValue}</span>
          </div>
        </div>
      </div>
      {(onToggle) && (
        <button
          ref={triggerRef}
          onClick={onToggle}
          className="text-gray-600 hover:text-gray-300 transition-colors p-1"
        >
          <Info className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
