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
  summary: BorrowingSummary;
  onViewDetails?: (() => void) | undefined;
}

export function BorrowingAlertBanner({
  summary,
  onViewDetails,
}: BorrowingAlertBannerProps) {
  const [isMobile, setIsMobile] = useState(false);

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

  const riskLevel = mapBorrowingStatusToRiskLevel(overall_status);
  const config = RISK_COLORS[riskLevel];

  // Logic: Only show for Warning/Critical (same as before)
  const shouldShow =
    riskLevel === RiskLevel.RISKY || riskLevel === RiskLevel.CRITICAL;

  if (!shouldShow) return null;

  return (
    <div
      className={`
        mb-4 p-3 rounded-lg border flex items-start gap-3
        ${config.bg} ${config.border}
      `}
      role="alert"
    >
      <AlertCircle
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.text}`}
      />

      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-semibold mb-1 ${config.text}`}>
          Borrowing Status: {RISK_LABELS[riskLevel]}
        </h4>
        <p className={`text-xs mb-2 opacity-90 ${config.text}`}>
          {critical_count > 0 && `${critical_count} critical position(s). `}
          {warning_count > 0 && `${warning_count} warning position(s). `}
          Lowest: <span className="font-bold">{worst_health_rate.toFixed(2)}</span>.
        </p>

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
            View Details →
          </button>
        )}
      </div>
    </div>
  );
}
