"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, DollarSign, Clock, Info, ChevronDown, ChevronUp } from "lucide-react";
import type { ConsolidatedMetricsData } from "./types";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { getChangeColorClasses } from "@/lib/color-utils";

interface UnifiedMetricsCardProps {
  data: ConsolidatedMetricsData;
  className?: string;
  showBreakdown?: boolean;
}

/**
 * Variation 2: Unified Stats Card
 *
 * All three metrics displayed in a single consolidated card.
 * Hierarchical information display with primary and secondary metrics.
 * All data visible simultaneously for easy comparison.
 */
export function UnifiedMetricsCard({
  data,
  className = "",
  showBreakdown = true,
}: UnifiedMetricsCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className={`border border-gray-800 rounded-lg p-6 bg-gray-900/50 backdrop-blur-sm ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg text-white font-semibold">Portfolio Performance Summary</h3>
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-500 cursor-help" />
          <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-10 w-64">
            <div className="bg-gray-800 text-xs text-white p-3 rounded shadow-lg">
              Consolidated view of your portfolio's ROI, PnL, and daily yield metrics
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ROI Section */}
        <MetricSection
          title="Yearly ROI"
          isExpanded={expandedSection === "roi"}
          onToggle={() => toggleSection("roi")}
          showToggle={showBreakdown}
        >
          <ROISection data={data.roi} expanded={expandedSection === "roi"} />
        </MetricSection>

        {/* PnL Section */}
        <MetricSection
          title="Yearly PnL"
          isExpanded={expandedSection === "pnl"}
          onToggle={() => toggleSection("pnl")}
          showToggle={showBreakdown}
        >
          <PnLSection data={data.pnl} expanded={expandedSection === "pnl"} />
        </MetricSection>

        {/* Yield Section */}
        <MetricSection
          title="Avg Daily Yield"
          isExpanded={expandedSection === "yield"}
          onToggle={() => toggleSection("yield")}
          showToggle={showBreakdown}
        >
          <YieldSection data={data.yield} expanded={expandedSection === "yield"} />
        </MetricSection>
      </div>

      {/* Summary Badges */}
      <div className="flex gap-2 mt-6 pt-6 border-t border-gray-800 flex-wrap">
        <Badge text={`${data.roi.period} data`} variant="info" />
        {data.yield.badge && <Badge text={data.yield.badge} variant="success" />}
        {data.yield.outliersRemoved > 0 && (
          <Badge text={`${data.yield.outliersRemoved} outliers removed`} variant="warning" />
        )}
      </div>
    </div>
  );
}

/**
 * Metric section wrapper with optional expand/collapse
 */
interface MetricSectionProps {
  title: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  showToggle: boolean;
}

function MetricSection({
  title,
  children,
  isExpanded,
  onToggle,
  showToggle,
}: MetricSectionProps) {
  return (
    <div
      className={`
        border border-gray-800 rounded-lg p-4 transition-all duration-200
        hover:border-gray-700 hover:bg-gray-800/30
        ${isExpanded ? "ring-2 ring-purple-500/30" : ""}
      `}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{title}</span>
        {showToggle && (
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * ROI section component
 */
function ROISection({ data, expanded }: { data: ConsolidatedMetricsData["roi"]; expanded: boolean }) {
  const colorClasses = getChangeColorClasses(data.value);

  return (
    <div className="space-y-3">
      {/* Primary Value */}
      <div className={`flex items-center gap-2 ${colorClasses}`}>
        <TrendingUp className="w-5 h-5" />
        <span className="text-2xl font-semibold">
          {formatPercentage(data.value, false, 2)}
        </span>
        {data.isEstimated && (
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-purple-900/20 text-purple-400">
            est.
          </span>
        )}
      </div>

      {/* Secondary Info */}
      <div className="text-xs text-gray-400">Based on {data.period} data</div>

      {/* Expanded Breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-gray-800 space-y-2">
              {Object.entries(data.windows).map(([period, { value }]) => (
                <div key={period} className="flex justify-between text-xs">
                  <span className="text-gray-500">{period}</span>
                  <span className="text-gray-300 font-medium">
                    {formatPercentage(value, false, 2)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * PnL section component
 */
function PnLSection({ data, expanded }: { data: ConsolidatedMetricsData["pnl"]; expanded: boolean }) {
  const colorClasses = getChangeColorClasses(data.changePercentage);

  return (
    <div className="space-y-3">
      {/* Primary Value */}
      <div className={`flex items-center gap-2 ${colorClasses}`}>
        <DollarSign className="w-5 h-5" />
        <span className="text-2xl font-semibold">
          {formatCurrency(data.value, {
            smartPrecision: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </span>
        {data.isEstimated && (
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-purple-900/20 text-purple-400">
            est.
          </span>
        )}
      </div>

      {/* Secondary Info */}
      <div className={`flex items-center gap-1 text-xs ${colorClasses}`}>
        <span>{data.trend === "up" ? "↗" : data.trend === "down" ? "↘" : "→"}</span>
        <span>{formatPercentage(Math.abs(data.changePercentage), true, 1)}</span>
      </div>

      {/* Expanded Trend */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-gray-800">
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-gray-500">Trend</span>
                <span className={`font-medium capitalize ${colorClasses}`}>{data.trend}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.trend === "up"
                      ? "bg-gradient-to-r from-green-500 to-emerald-400"
                      : data.trend === "down"
                      ? "bg-gradient-to-r from-red-500 to-orange-400"
                      : "bg-gradient-to-r from-gray-500 to-gray-400"
                  }`}
                  style={{ width: `${Math.min(Math.abs(data.changePercentage) * 5, 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Yield section component
 */
function YieldSection({
  data,
  expanded,
}: {
  data: ConsolidatedMetricsData["yield"];
  expanded: boolean;
}) {
  const getBadgeStyles = () => {
    switch (data.badge) {
      case "preliminary":
        return "bg-yellow-900/20 text-yellow-400";
      case "improving":
        return "bg-blue-900/20 text-blue-400";
      case "established":
        return "bg-green-900/20 text-green-400";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Primary Value */}
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-emerald-400" />
        <span className="text-2xl font-semibold text-emerald-300">
          {formatCurrency(data.avgDailyYield, {
            smartPrecision: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </span>
        {data.badge && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${getBadgeStyles()}`}>
            {data.badge.slice(0, 3)}
          </span>
        )}
      </div>

      {/* Secondary Info */}
      <div className="text-xs text-gray-400">{data.daysWithData} days</div>

      {/* Expanded Protocol Breakdown */}
      <AnimatePresence>
        {expanded && data.protocolBreakdown.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-gray-800 space-y-2">
              {data.protocolBreakdown.slice(0, 3).map((protocol) => (
                <div key={protocol.protocol} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: protocol.color }}
                    />
                    <span className="text-gray-400">{protocol.protocol}</span>
                  </div>
                  <span className="text-gray-300 font-medium">
                    {formatCurrency(protocol.contribution, { smartPrecision: true })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Badge component
 */
interface BadgeProps {
  text: string;
  variant: "info" | "success" | "warning";
}

function Badge({ text, variant }: BadgeProps) {
  const styles = {
    info: "bg-blue-900/20 text-blue-400",
    success: "bg-green-900/20 text-green-400",
    warning: "bg-yellow-900/20 text-yellow-400",
  };

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[variant]}`}>
      {text}
    </span>
  );
}
