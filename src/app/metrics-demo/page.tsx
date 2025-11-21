"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TabbedMetricsCard } from "@/components/wallet/metrics/consolidated/TabbedMetricsCard";
import { UnifiedMetricsCard } from "@/components/wallet/metrics/consolidated/UnifiedMetricsCard";
import { AccordionMetricsCard } from "@/components/wallet/metrics/consolidated/AccordionMetricsCard";
import { MOCK_DATA_PRESETS } from "@/components/wallet/metrics/consolidated/mockData";
import type { ConsolidatedMetricsData } from "@/components/wallet/metrics/consolidated/types";

/**
 * Demo page showcasing all three consolidated metrics variations
 */
export default function MetricsDemoPage() {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof MOCK_DATA_PRESETS>("default");
  const [selectedVariation, setSelectedVariation] = useState<"all" | "tabbed" | "unified" | "accordion">("all");

  const currentData: ConsolidatedMetricsData = MOCK_DATA_PRESETS[selectedPreset];

  const presets = [
    { id: "default" as const, label: "Balanced", emoji: "⚖️" },
    { id: "bullish" as const, label: "Strong", emoji: "🚀" },
    { id: "bearish" as const, label: "Weak", emoji: "📉" },
    { id: "neutral" as const, label: "Stable", emoji: "📊" },
  ];

  const variations = [
    { id: "all" as const, label: "Show All", description: "Compare all variations" },
    { id: "tabbed" as const, label: "Tabbed", description: "Single focus with tabs" },
    { id: "unified" as const, label: "Unified", description: "All metrics visible" },
    { id: "accordion" as const, label: "Accordion", description: "Progressive disclosure" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Consolidated Metrics Demo
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Compare three design variations for portfolio metrics
              </p>
            </div>

            {/* View Controls */}
            <div className="flex gap-2">
              {variations.map((variation) => (
                <button
                  key={variation.id}
                  onClick={() => setSelectedVariation(variation.id)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${selectedVariation === variation.id
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                    }
                  `}
                >
                  {variation.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-900/30 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-sm text-gray-400 font-medium">Data Preset:</span>
            <div className="flex gap-2 flex-wrap">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${selectedPreset === preset.id
                      ? "bg-purple-600 text-white ring-2 ring-purple-400"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                    }
                  `}
                >
                  <span className="mr-2">{preset.emoji}</span>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Variation Descriptions */}
        {selectedVariation === "all" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <InfoCard
              title="Variation 1: Tabbed"
              description="Single metric display with tab navigation. Great for focused analysis."
              pros={["Minimal cognitive load", "Smooth animations", "Easy to add more metrics"]}
              cons={["One metric at a time", "Requires interaction"]}
            />
            <InfoCard
              title="Variation 2: Unified"
              description="All metrics in one view. Perfect for quick portfolio overview."
              pros={["See everything at once", "No tab switching", "Compact design"]}
              cons={["High information density", "Less space for details"]}
            />
            <InfoCard
              title="Variation 3: Accordion"
              description="Progressive disclosure with expandable sections. Flexible information access."
              pros={["Start simple, dive deep", "User control", "Space efficient"]}
              cons={["More complex interaction", "May hide information"]}
            />
          </div>
        )}

        {/* Variations Display */}
        <div className="space-y-8">
          {(selectedVariation === "all" || selectedVariation === "tabbed") && (
            <VariationSection
              title="Variation 1: Tabbed Interface"
              description="Single card with tab navigation between ROI/PnL/Yield"
            >
              <TabbedMetricsCard data={currentData} />
            </VariationSection>
          )}

          {(selectedVariation === "all" || selectedVariation === "unified") && (
            <VariationSection
              title="Variation 2: Unified Stats Card"
              description="All three metrics displayed simultaneously in one card"
            >
              <UnifiedMetricsCard data={currentData} showBreakdown />
            </VariationSection>
          )}

          {(selectedVariation === "all" || selectedVariation === "accordion") && (
            <VariationSection
              title="Variation 3: Expandable Accordion"
              description="Compact summary with expandable detailed sections"
            >
              <AccordionMetricsCard data={currentData} defaultExpanded="roi" />
            </VariationSection>
          )}
        </div>

        {/* Current Data Display */}
        <div className="mt-12 p-6 bg-gray-900/30 border border-gray-800 rounded-lg">
          <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
            Current Mock Data ({presets.find(p => p.id === selectedPreset)?.label})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DataPreview
              label="ROI Data"
              data={{
                value: `${currentData.roi.value}%`,
                period: currentData.roi.period,
                windows: Object.keys(currentData.roi.windows).length,
              }}
            />
            <DataPreview
              label="PnL Data"
              data={{
                value: `$${currentData.pnl.value.toLocaleString()}`,
                trend: currentData.pnl.trend,
                change: `${currentData.pnl.changePercentage}%`,
              }}
            />
            <DataPreview
              label="Yield Data"
              data={{
                daily: `$${currentData.yield.avgDailyYield}`,
                days: currentData.yield.daysWithData,
                protocols: currentData.yield.protocolBreakdown.length,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Info card component
 */
interface InfoCardProps {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}

function InfoCard({ title, description, pros, cons }: InfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-gray-900/50 border border-gray-800 rounded-lg"
    >
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-green-400 uppercase tracking-wide mb-2">Pros</div>
          <ul className="space-y-1">
            {pros.map((pro, idx) => (
              <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs text-orange-400 uppercase tracking-wide mb-2">Cons</div>
          <ul className="space-y-1">
            {cons.map((con, idx) => (
              <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-orange-400">✗</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Variation section wrapper
 */
interface VariationSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function VariationSection({ title, description, children }: VariationSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div>{children}</div>
    </motion.div>
  );
}

/**
 * Data preview component
 */
interface DataPreviewProps {
  label: string;
  data: Record<string, string | number>;
}

function DataPreview({ label, data }: DataPreviewProps) {
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">{label}</div>
      <div className="space-y-1">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-gray-400 capitalize">{key}:</span>
            <span className="text-white font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
