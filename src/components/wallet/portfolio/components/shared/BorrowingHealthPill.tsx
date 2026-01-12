"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  mapBorrowingStatusToRiskLevel,
  RISK_COLORS,
  RiskLevel,
} from "@/constants/riskThresholds";
import { useBorrowingPositions } from "@/hooks/queries/analytics/useBorrowingPositions";
import type { BorrowingSummary } from "@/services/analyticsService";

import { BorrowingPositionsTooltip } from "./BorrowingPositionsTooltip";
import { useTooltipPosition } from "./useTooltipPosition";

interface BorrowingHealthPillProps {
  summary: BorrowingSummary;
  userId: string;
  size?: "sm" | "md";
}

const SIZE_CONFIGS = {
  sm: {
    container: "px-2 py-1 text-xs gap-1.5",
    dot: "w-2 h-2",
  },
  md: {
    container: "px-3 py-1.5 text-sm gap-2",
    dot: "w-2.5 h-2.5",
  },
} as const;

/**
 * Borrowing Health Pill
 *
 * A lightweight visual indicator for borrowing position health.
 * Displays color-coded status and health rate.
 *
 * Click to expand and view detailed borrowing positions with per-protocol breakdowns.
 */
export function BorrowingHealthPill({
  summary,
  userId,
  size = "md",
}: BorrowingHealthPillProps) {
  /* jscpd:ignore-start */
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  /* jscpd:ignore-end */

  const { overall_status, worst_health_rate } = summary;

  const riskLevel = mapBorrowingStatusToRiskLevel(overall_status);
  const config = RISK_COLORS[riskLevel];
  const sizeConfig = SIZE_CONFIGS[size];

  // Only Pulse for Critical
  const shouldPulse = riskLevel === RiskLevel.CRITICAL;

  // Fetch positions on-demand when expanded
  const {
    data: positionsData,
    isLoading,
    error,
    refetch,
  } = useBorrowingPositions(userId, isExpanded);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tooltipPosition = useTooltipPosition(
    isExpanded,
    containerRef,
    tooltipRef
  );

  // Expanded tooltip (shown on click)
  const expandedTooltip = isExpanded && isMounted && (
    <div
      ref={tooltipRef}
      className="fixed z-50"
      style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
    >
      <BorrowingPositionsTooltip
        positions={positionsData?.positions || []}
        summary={summary}
        totalCollateralUsd={positionsData?.total_collateral_usd || 0}
        totalDebtUsd={positionsData?.total_debt_usd || 0}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
      />
    </div>
  );

  return (
    <>
      <div
        ref={containerRef}
        role="button"
        tabIndex={0}
        aria-label={`Borrowing health: ${worst_health_rate.toFixed(2)}. Click to view detailed positions.`}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className={`
          inline-flex items-center rounded-full cursor-pointer transition-all border
          ${sizeConfig.container}
          ${config.bg} ${config.border}
          hover:opacity-80
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500
        `}
      >
        <motion.div
          className={`rounded-full ${sizeConfig.dot} ${config.dot}`}
          animate={shouldPulse ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className={`font-medium ${config.text}`}>
          <span className="opacity-75 mr-1">Borrowing:</span>
          {worst_health_rate.toFixed(2)}
        </span>
      </div>
      {isMounted && createPortal(expandedTooltip, document.body)}
    </>
  );
}
