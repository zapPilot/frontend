"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight,
  Info,
} from "lucide-react";
import type { MetricType, ConsolidatedMetricsData } from "./types";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { getChangeColorClasses } from "@/lib/color-utils";

interface AccordionMetricsCardProps {
  data: ConsolidatedMetricsData;
  className?: string;
  defaultExpanded?: MetricType | "none";
  allowMultipleExpanded?: boolean;
}

/**
 * Variation 3: Expandable Accordion
 *
 * Summary view showing key numbers from all metrics.
 * Expand/collapse sections for detailed breakdowns.
 * Progressive disclosure pattern - start simple, reveal complexity on demand.
 */
export function AccordionMetricsCard({
  data,
  className = "",
  defaultExpanded = "roi",
  allowMultipleExpanded = false,
}: AccordionMetricsCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<MetricType>>(
    new Set(defaultExpanded !== "none" ? [defaultExpanded] : [])
  );

  const toggleSection = (sectionId: MetricType) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);

      if (allowMultipleExpanded) {
        // Multiple sections can be expanded
        if (newSet.has(sectionId)) {
          newSet.delete(sectionId);
        } else {
          newSet.add(sectionId);
        }
      } else {
        // Only one section can be expanded at a time
        if (newSet.has(sectionId)) {
          newSet.clear();
        } else {
          newSet.clear();
          newSet.add(sectionId);
        }
      }

      return newSet;
    });
  };

  const isExpanded = (sectionId: MetricType) => expandedSections.has(sectionId);

  return (
    <div className={`border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-sm ${className}`}>
      {/* Summary Bar */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/30">
        <div className="flex justify-between items-center">
          <h3 className="text-sm text-gray-400 uppercase tracking-wide">Portfolio Metrics</h3>
          <button
            onClick={() => {
              if (expandedSections.size === 3) {
                setExpandedSections(new Set());
              } else {
                setExpandedSections(new Set(["roi", "pnl", "yield"]));
              }
            }}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            {expandedSections.size === 3 ? "Collapse All" : "Expand All"}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-3 text-sm">
          <span className="text-white font-medium">
            {formatPercentage(data.roi.value, false, 2)} ROI
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-white font-medium">
            {formatCurrency(data.pnl.value, { smartPrecision: true, maximumFractionDigits: 0 })} PnL
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-white font-medium">
            {formatCurrency(data.yield.avgDailyYield, { smartPrecision: true, maximumFractionDigits: 0 })}/day
          </span>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="divide-y divide-gray-800">
        <AccordionSection
          id="roi"
          title="Estimated Yearly ROI"
          icon={TrendingUp}
          isExpanded={isExpanded("roi")}
          onToggle={() => toggleSection("roi")}
          summary={formatPercentage(data.roi.value, false, 2)}
          summaryColor={getChangeColorClasses(data.roi.value)}
        >
          <ROIDetails data={data.roi} />
        </AccordionSection>

        <AccordionSection
          id="pnl"
          title="Estimated Yearly PnL"
          icon={DollarSign}
          isExpanded={isExpanded("pnl")}
          onToggle={() => toggleSection("pnl")}
          summary={formatCurrency(data.pnl.value, { smartPrecision: true, maximumFractionDigits: 0 })}
          summaryColor={getChangeColorClasses(data.pnl.changePercentage)}
        >
          <PnLDetails data={data.pnl} />
        </AccordionSection>

        <AccordionSection
          id="yield"
          title="Average Daily Yield"
          icon={Clock}
          isExpanded={isExpanded("yield")}
          onToggle={() => toggleSection("yield")}
          summary={formatCurrency(data.yield.avgDailyYield, { smartPrecision: true })}
          summaryColor="text-emerald-300"
        >
          <YieldDetails data={data.yield} />
        </AccordionSection>
      </div>
    </div>
  );
}

/**
 * Accordion section wrapper
 */
interface AccordionSectionProps {
  id: MetricType;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isExpanded: boolean;
  onToggle: () => void;
  summary: string;
  summaryColor: string;
  children: React.ReactNode;
}

function AccordionSection({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  summary,
  summaryColor,
  children,
}: AccordionSectionProps) {
  return (
    <div className="transition-colors hover:bg-gray-800/20">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${summaryColor}`} />
          <div className="text-left">
            <div className="text-sm text-gray-400">{title}</div>
            <div className={`text-xl font-semibold ${summaryColor}`}>{summary}</div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * ROI details component
 */
function ROIDetails({ data }: { data: ConsolidatedMetricsData["roi"] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-900/20 text-purple-400">
          est.
        </span>
        <span className="text-xs text-gray-400">Based on {data.period} performance data</span>
      </div>

      {/* Period Breakdown */}
      <div className="space-y-3 p-4 rounded-lg bg-gray-800/30">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Period Breakdown</div>
        {Object.entries(data.windows).map(([period, { value, dataPoints }]) => (
          <div key={period} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{period}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium">
                  {formatPercentage(value, false, 2)}
                </span>
                <span className="text-xs text-gray-500">({dataPoints} pts)</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  value >= 0
                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                    : "bg-gradient-to-r from-red-500 to-orange-400"
                }`}
                style={{ width: `${Math.min(Math.abs(value) * 5, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Info className="w-3 h-3" />
        <span>ROI is calculated based on historical performance and may vary</span>
      </div>
    </div>
  );
}

/**
 * PnL details component
 */
function PnLDetails({ data }: { data: ConsolidatedMetricsData["pnl"] }) {
  const colorClasses = getChangeColorClasses(data.changePercentage);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-900/20 text-purple-400">
          est.
        </span>
        <div className={`flex items-center gap-1 text-sm ${colorClasses}`}>
          <span>{data.trend === "up" ? "↗" : data.trend === "down" ? "↘" : "→"}</span>
          <span>{formatPercentage(Math.abs(data.changePercentage), true, 1)} change</span>
        </div>
      </div>

      {/* Trend Visualization */}
      <div className="p-4 rounded-lg bg-gray-800/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Trend Analysis</span>
          <span className={`text-sm font-medium capitalize ${colorClasses}`}>
            {data.trend}
          </span>
        </div>
        <div className="h-3 bg-gray-900 rounded-full overflow-hidden">
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

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gray-800/30">
          <div className="text-xs text-gray-500 mb-1">Current Value</div>
          <div className="text-lg font-semibold text-white">
            {formatCurrency(data.value, { smartPrecision: true })}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/30">
          <div className="text-xs text-gray-500 mb-1">Change</div>
          <div className={`text-lg font-semibold ${colorClasses}`}>
            {formatPercentage(data.changePercentage, true, 1)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Yield details component
 */
function YieldDetails({ data }: { data: ConsolidatedMetricsData["yield"] }) {
  const getBadgeStyles = () => {
    switch (data.badge) {
      case "preliminary":
        return "bg-yellow-900/20 text-yellow-400";
      case "improving":
        return "bg-blue-900/20 text-blue-400";
      case "established":
        return "bg-green-900/20 text-green-400";
      default:
        return "bg-gray-800 text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {data.badge && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getBadgeStyles()}`}>
            {data.badge}
          </span>
        )}
        <span className="text-xs text-gray-400">
          Based on {data.daysWithData} days of data
        </span>
        {data.outliersRemoved > 0 && (
          <span className="text-xs text-yellow-400">
            ({data.outliersRemoved} outliers removed)
          </span>
        )}
      </div>

      {/* Protocol Breakdown */}
      {data.protocolBreakdown.length > 0 && (
        <div className="p-4 rounded-lg bg-gray-800/30">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">
            Protocol Contribution
          </div>
          <div className="space-y-3">
            {data.protocolBreakdown.map((protocol) => (
              <div key={protocol.protocol} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: protocol.color }}
                    />
                    <span className="text-sm text-gray-300">{protocol.protocol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">
                      {formatCurrency(protocol.contribution, { smartPrecision: true })}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({protocol.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${protocol.percentage}%`,
                      backgroundColor: protocol.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Daily yield is calculated as the average across all active positions
      </div>
    </div>
  );
}
