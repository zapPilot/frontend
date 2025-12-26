/**
 * PerformanceTooltip - Portfolio vs BTC benchmark
 */

import type { PerformanceHoverData } from "@/types/ui/chartHover";

import { TooltipRow } from "./TooltipRow";
import { TooltipWrapper } from "./TooltipWrapper";

export function PerformanceTooltip({ data }: { data: PerformanceHoverData }) {
  // Extract benchmark with proper null narrowing to avoid non-null assertions
  const benchmark = data.benchmark;
  // Calculate relative performance only if benchmark is defined (not undefined)
  const relativePerf =
    benchmark !== undefined
      ? ((data.value - benchmark) / benchmark) * 100
      : null;

  return (
    <TooltipWrapper date={data.date} spacing="tight">
      {/* Primary Metric */}
      <TooltipRow
        label="Portfolio Value"
        labelColor="text-purple-300"
        value={data.value}
        valueColor="text-white"
        format="currencyPrecise"
      />

      {/* Benchmark Section with visual separator */}
      <div className="border-t border-gray-700/50 mt-1.5 pt-1.5">
        <TooltipRow
          label="BTC Benchmark"
          labelColor="text-orange-300"
          value={data.benchmark}
          valueColor="text-orange-200"
          format="currencyPrecise"
        />

        {relativePerf !== null && (
          <TooltipRow
            label="Relative"
            labelColor="text-gray-400"
            value={relativePerf}
            valueColor={relativePerf >= 0 ? "text-green-400" : "text-red-400"}
            format="percent"
            prefix={relativePerf >= 0 ? "+" : ""}
          />
        )}
      </div>
    </TooltipWrapper>
  );
}
