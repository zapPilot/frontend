"use client";

import { AlertCircle, ArrowRight } from "lucide-react";

import {
    mapBorrowingStatusToRiskLevel,
    RISK_COLORS,
    RiskLevel
} from "@/constants/riskThresholds";
import type { BorrowingSummary } from "@/services/analyticsService";

interface BorrowingContextLineProps {
  summary: BorrowingSummary;
  onViewDetails?: (() => void) | undefined;
}

export function BorrowingContextLine({
  summary,
  onViewDetails,
}: BorrowingContextLineProps) {
  const { overall_status, worst_health_rate, critical_count, warning_count } =
    summary;

  const riskLevel = mapBorrowingStatusToRiskLevel(overall_status);
  const config = RISK_COLORS[riskLevel];

  // Only show if risky/critical
  if (riskLevel === RiskLevel.SAFE) return null;

  const count = critical_count + warning_count;

  return (
    <div
      onClick={onViewDetails}
      className={`
        flex items-center gap-2 text-xs mb-3 cursor-pointer
        ${config.text} hover:opacity-80 transition-opacity
      `}
      role="button"
      tabIndex={0}
    >
      <AlertCircle className="w-3.5 h-3.5" />
      <span className="font-medium">
        {count} positions need attention (Worst Health: {worst_health_rate.toFixed(2)})
      </span>
      <ArrowRight className="w-3 h-3 opacity-50" />
    </div>
  );
}
