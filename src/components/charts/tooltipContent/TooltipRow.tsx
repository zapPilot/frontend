/**
 * TooltipRow - Reusable row component for tooltip content
 */

import { formatters } from "@/lib/formatters";

interface TooltipRowProps {
  label: string;
  labelColor?: string;
  value: string | number;
  valueColor?: string;
  format?: "currency" | "percent" | "text" | "currencyPrecise";
  precision?: number;
  prefix?: string;
}

export function TooltipRow({
  label,
  labelColor = "text-gray-400",
  value,
  valueColor = "text-white",
  format = "text",
  precision = 1,
  prefix = "",
}: TooltipRowProps) {
  const formattedValue =
    typeof value === "number"
      ? format === "currency"
        ? formatters.currency(value)
        : format === "currencyPrecise"
          ? formatters.currencyPrecise(value)
          : format === "percent"
            ? formatters.percent(value, precision)
            : String(value)
      : value;

  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-xs ${labelColor}`}>{label}</span>
      <span className={`text-sm font-semibold ${valueColor}`}>
        {prefix}
        {formattedValue}
      </span>
    </div>
  );
}
