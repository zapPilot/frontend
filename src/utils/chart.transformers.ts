import type { AssetCategory } from "../types/portfolio";

/**
 * Transform data to pie chart format for visualization
 *
 * Converts AssetCategory data into the format expected by chart components.
 * Handles percentage calculations and ensures proper chart data structure.
 *
 * @param data - Array of asset categories to transform
 * @param totalValue - Optional total value for recalculating percentages
 * @returns Array of pie chart data points with labels, values, percentages, and colors
 */
export function toPieChartData(
  data: AssetCategory[],
  totalValue?: number
): { label: string; value: number; percentage: number; color: string }[] {
  return data.map(cat => ({
    label: cat.name,
    value:
      totalValue && cat.percentage
        ? (cat.percentage / 100) * totalValue
        : cat.totalValue,
    percentage: cat.percentage,
    color: cat.color,
  }));
}
