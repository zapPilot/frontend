"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import {
  mapBorrowingStatusToRiskLevel,
  RISK_COLORS,
  RISK_LABELS,
  RiskLevel,
} from "@/constants/riskThresholds";
import type { BorrowingSummary } from "@/services/analyticsService";

interface BorrowingAlertBannerProps {
  /** Borrowing summary data from analytics service */
  summary: BorrowingSummary;
  /** Optional handler for viewing detailed risk breakdown */
  onViewDetails?: (() => void) | undefined;
}

/**
 * Borrowing Alert Banner Component
 *
 * Displays a warning banner when the user has borrowing positions that need attention.
 * Shows critical/warning counts and the worst health rate.
 *
 * Designed to separate "Borrowing" (lending market debt) concepts from
 * "Leverage" (margin trading) concepts handled by RiskMetrics.
 */
export function BorrowingAlertBanner({
  summary,
  onViewDetails,
}: BorrowingAlertBannerProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Client-side detection for responsive behavior if needed
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    overall_status,
    worst_health_rate,
    critical_count,
    warning_count,
    healthy_count,
  } = summary;

  // Map backend status to UI risk level
  const riskLevel = mapBorrowingStatusToRiskLevel(overall_status);
  const config = RISK_COLORS[riskLevel];

  // Don't show if everything is perfectly safe (unless we want to show "Healthy" state explicitly)
  // Currently, we only show for WARNING or CRITICAL to avoid clutter
  const shouldShow =
    riskLevel === RiskLevel.RISKY || riskLevel === RiskLevel.CRITICAL;

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      className={`
        mb-4 p-3 rounded-lg border flex items-start gap-3
        ${config.bg} ${config.border}
      `}
      role="alert"
    >
      {/* Icon */}
      <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.text}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-semibold mb-1 ${config.text}`}>
          Borrowing Status: {RISK_LABELS[riskLevel]}
        </h4>
        <p className={`text-xs mb-2 opacity-90 ${config.text}`}>
          {critical_count > 0 && `${critical_count} critical position(s). `}
          {warning_count > 0 && `${warning_count} warning position(s). `}
          Lowest health factor at{" "}
          <span className="font-bold">{worst_health_rate.toFixed(2)}</span>.
        </p>

        {/* Breakdown Badges (Desktop/Tablet) */}
        {!isMobile && (
          <div className="flex flex-wrap gap-2 mb-2">
            {critical_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {critical_count} Critical
              </span>
            )}
            {warning_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {warning_count} Risky
              </span>
            )}
            {healthy_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {healthy_count} Healthy
              </span>
            )}
          </div>
        )}

        {/* CTA Button */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className={`
              inline-flex items-center gap-1.5
              px-3 py-1.5 text-xs font-medium rounded
              transition-colors duration-200
              ${config.dot} text-white hover:opacity-90
            `}
          >
            View Details
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
