/**
 * PerformanceTooltip - Portfolio vs BTC benchmark
 */

import type { PerformanceHoverData } from "@/types/ui/chartHover";

import { TooltipRow } from "./TooltipRow";
import { TooltipWrapper } from "./TooltipWrapper";

export function PerformanceTooltip({ data }: { data: PerformanceHoverData }) {
  return (
    <TooltipWrapper date={data.date} spacing="tight">
      <TooltipRow
        label="Portfolio"
        labelColor="text-purple-300"
        value={data.value}
        format="currencyPrecise"
      />
      <TooltipRow
        label="BTC"
        labelColor="text-orange-300"
        value={data.benchmark}
        valueColor="text-gray-200"
        format="percent"
      />
    </TooltipWrapper>
  );
}
