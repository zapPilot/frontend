"use client";

import { TrendingUp } from "lucide-react";
import { GlassCard, APRMetrics } from "../ui";

interface PerformanceHighlightsProps {
  annualAPR: number;
  monthlyReturn: number;
}

export function PerformanceHighlights({
  annualAPR,
  monthlyReturn,
}: PerformanceHighlightsProps) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
        Portfolio Performance Highlights
      </h3>
      <APRMetrics
        annualAPR={annualAPR}
        monthlyReturn={monthlyReturn}
        size="large"
        className="justify-center"
      />
    </GlassCard>
  );
}
