"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  mapBorrowingStatusToRiskLevel,
  RISK_COLORS,
  RISK_LABELS,
  RiskLevel,
} from "@/constants/riskThresholds";
import type { BorrowingSummary } from "@/services/analyticsService";

import { useTooltipPosition } from "./useTooltipPosition";

interface BorrowingHealthPillProps {
  summary: BorrowingSummary;
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
 */
export function BorrowingHealthPill({
  summary,
  size = "md",
}: BorrowingHealthPillProps) {
  /* jscpd:ignore-start */
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  /* jscpd:ignore-end */

  const { overall_status, worst_health_rate, critical_count, warning_count } =
    summary;

  const riskLevel = mapBorrowingStatusToRiskLevel(overall_status);
  const config = RISK_COLORS[riskLevel];
  const sizeConfig = SIZE_CONFIGS[size];
  const label = RISK_LABELS[riskLevel];

  // Only Pulse for Critical
  const shouldPulse = riskLevel === RiskLevel.CRITICAL;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tooltipPosition = useTooltipPosition(
    isHovered,
    containerRef,
    tooltipRef
  );

  const tooltipContent = isHovered && isMounted && (
    <div
      ref={tooltipRef}
      className="fixed z-50 pointer-events-none"
      style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
    >
      <motion.div
        /* jscpd:ignore-start */
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        /* jscpd:ignore-end */
        className="bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg p-3 shadow-xl w-64"
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-gray-200">
            Borrowing Health
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded border ${config.bg} ${config.text} ${config.border}`}
          >
            {label}
          </span>
        </div>
        <div className="text-xs text-gray-400 mb-2">
          Your lowest health factor is{" "}
          <strong className="text-white">{worst_health_rate.toFixed(2)}</strong>
        </div>
        {(critical_count > 0 || warning_count > 0) && (
          <div className="flex gap-2 text-[10px]">
            {critical_count > 0 && (
              <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                {critical_count} Critical
              </span>
            )}
            {warning_count > 0 && (
              <span className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                {warning_count} Risky
              </span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          inline-flex items-center rounded-full cursor-pointer transition-all border
          ${sizeConfig.container}
          ${config.bg} ${config.border}
          hover:opacity-80
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
      {isMounted && createPortal(tooltipContent, document.body)}
    </>
  );
}
