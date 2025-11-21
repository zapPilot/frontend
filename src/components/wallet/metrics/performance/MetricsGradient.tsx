import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";
import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";
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

export function MetricsGradient({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading,
  isYieldLoading,
  shouldShowLoading,
  portfolioChangePercentage,
  className = "",
}: PerformanceMetricsProps) {
  const roiTooltip = useMetricsTooltip<HTMLButtonElement>();
  const yieldTooltip = useMetricsTooltip<HTMLButtonElement>();

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
  const roiIsPositive = roiValue >= 0;

  const pnlAmount = portfolioROI?.estimated_yearly_pnl_usd ?? 0;
  const pnlValue = portfolioChangePercentage;
  const pnlIsPositive = pnlAmount >= 0;

  const yieldWindows = yieldSummaryData?.windows;
  const selectedYieldWindow = yieldWindows
    ? selectBestYieldWindow(yieldWindows)
    : null;
  const yieldValue = selectedYieldWindow?.window.average_daily_yield_usd ?? 0;
  const yieldAmount = selectedYieldWindow?.window.total_yield_usd ?? 0;

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

  // Calculate fill percentages (normalize to 0-100 range)
  const roiPercentage = Math.min(Math.abs(roiValue), 100);
  const pnlPercentage = Math.min(Math.abs(pnlValue), 100);
  const yieldPercentage = 75; // Fixed visual representation for yield

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ROI Bar */}
      <GradientBar
        label="ROI (Yearly)"
        icon={TrendingUp}
        primaryValue={formatPercent(roiValue)}
        secondaryValue={formatCurrency(roiAmount)}
        percentage={roiPercentage}
        isPositive={roiIsPositive}
        triggerRef={roiTooltip.triggerRef}
        onToggle={roiTooltip.toggle}
      />
      {roiTooltip.visible && portfolioROI && (
        <ROITooltip
          tooltipRef={roiTooltip.tooltipRef}
          position={roiTooltip.position}
          windows={
            portfolioROI.windows
              ? Object.entries(portfolioROI.windows)
                  .map(([key, value]: [string, { value: number; data_points: number }]) => ({
                    key,
                    label: formatRoiWindowLabel(key),
                    value: value.value,
                    dataPoints: value.data_points,
                  }))
                  .sort(
                    (a, b) =>
                      deriveRoiWindowSortScore(a.key) - deriveRoiWindowSortScore(b.key)
                  )
              : []
          }
          protocols={[]}
          recommendedPeriodLabel={portfolioROI.recommended_period?.replace("roi_", "") || null}
        />
      )}

      {/* PnL Bar */}
      <GradientBar
        label="Est. Yearly PnL"
        icon={DollarSign}
        primaryValue={formatCurrency(pnlAmount)}
        secondaryValue={formatPercent(pnlValue)}
        percentage={pnlPercentage}
        isPositive={pnlIsPositive}
      />

      {/* Yield Bar */}
      <GradientBar
        label="Avg Daily Yield"
        icon={Percent}
        primaryValue={formatCurrency(yieldValue)}
        secondaryValue={`${formatCurrency(yieldAmount)} total`}
        percentage={yieldPercentage}
        isPositive={true}
        color="purple"
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

interface GradientBarProps {
  label: string;
  icon: React.ElementType;
  primaryValue: string;
  secondaryValue: string;
  percentage: number;
  isPositive: boolean;
  color?: "default" | "purple";
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  onToggle?: () => void;
}

function GradientBar({
  label,
  icon: Icon,
  primaryValue,
  secondaryValue,
  percentage,
  isPositive,
  color = "default",
  triggerRef,
  onToggle,
}: GradientBarProps) {
  const gradientClass = color === "purple"
    ? "from-purple-600 to-purple-400"
    : isPositive
    ? "from-green-600 to-green-400"
    : "from-red-600 to-red-400";

  const textColor = color === "purple"
    ? "text-purple-400"
    : isPositive
    ? "text-green-400"
    : "text-red-400";

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${textColor}`} />
          <span className="text-xs font-medium text-gray-400">{label}</span>
        </div>
        {onToggle && (
          <button
            ref={triggerRef}
            onClick={onToggle}
            className="text-gray-600 hover:text-gray-300 transition-colors"
          >
            <Info className="w-3 h-3" />
          </button>
        )}
      </div>
      
      {/* Gradient Progress Bar */}
      <div className="relative h-10 bg-gray-800/50 rounded-md overflow-hidden mb-2">
        <div
          className={`h-full bg-gradient-to-r ${gradientClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <span className={`text-sm font-bold ${textColor}`}>
            {primaryValue}
          </span>
          <span className="text-xs text-gray-300">{secondaryValue}</span>
        </div>
      </div>
    </div>
  );
}
