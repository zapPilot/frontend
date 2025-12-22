/**
 * CSV Generator Utility
 *
 * RFC 4180 compliant CSV generation for analytics export
 * Provides pure functions for generating CSV content from analytics data
 */

import type { CsvGenerationOptions, ExportMetadata } from "@/types/export";
import { formatAddress } from "@/utils/formatters";

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_OPTIONS: Required<CsvGenerationOptions> = {
  includeBOM: true,
  lineEnding: "\r\n",
  delimiter: ",",
  quote: '"',
};

// =============================================================================
// CSV FIELD ESCAPING (RFC 4180)
// =============================================================================

/**
 * Escape a CSV field according to RFC 4180 specification
 *
 * Fields containing comma, quote, or newline must be:
 * 1. Wrapped in double quotes
 * 2. Internal quotes must be doubled ("" → """")
 *
 * @param value - Field value to escape
 * @param options - CSV generation options
 * @returns Properly escaped field
 *
 * @example
 * escapeCsvField('Hello, World') // '"Hello, World"'
 * escapeCsvField('Say "Hi"') // '"Say ""Hi"""'
 */
export function escapeCsvField(
  value: string | number | null | undefined,
  options: CsvGenerationOptions = {}
): string {
  const { delimiter = ",", quote = '"' } = { ...DEFAULT_OPTIONS, ...options };

  // Convert to string and handle null/undefined
  const stringValue = value?.toString() ?? "";

  // Detect if field needs quoting
  const needsQuoting = new RegExp(`[${delimiter}${quote}\r\n]`).test(
    stringValue
  );

  if (!needsQuoting) {
    return stringValue;
  }

  // Escape internal quotes by doubling them
  const escaped = stringValue.replace(new RegExp(quote, "g"), quote + quote);

  // Wrap in quotes
  return `${quote}${escaped}${quote}`;
}

/**
 * Format a CSV row from an array of values
 *
 * @param values - Array of field values
 * @param options - CSV generation options
 * @returns Formatted CSV row (without line ending)
 */
export function formatCsvRow(
  values: (string | number | null | undefined)[],
  options: CsvGenerationOptions = {}
): string {
  const { delimiter = "," } = { ...DEFAULT_OPTIONS, ...options };
  return values.map(v => escapeCsvField(v, options)).join(delimiter);
}

// =============================================================================
// SECTION BUILDERS
// =============================================================================

/**
 * Build header section with report metadata
 */
export function buildHeaderSection(metadata: ExportMetadata): string[] {
  const { userId, timePeriod, data, timestamp } = metadata;

  const periodLabels: Record<string, string> = {
    "1M": "1M (30 days)",
    "3M": "3M (90 days)",
    "6M": "6M (180 days)",
    "1Y": "1Y (365 days)",
    ALL: "All (730 days)",
  };

  // Calculate period dates from performance chart
  const startDate = data.performanceChart.startDate;
  const endDate = data.performanceChart.endDate;

  return [
    "Portfolio Analytics Report",
    `Generated: ${timestamp.toISOString()}`,
    `User ID: ${userId}`,
    `Time Period: ${periodLabels[timePeriod.key] || timePeriod.label}`,
    `Period: ${startDate} to ${endDate}`,
    "",
  ];
}

/**
 * Build key metrics section
 */
export function buildMetricsSection(metadata: ExportMetadata): string[] {
  const { data } = metadata;
  const { keyMetrics } = data;

  const lines: string[] = ["=== KEY METRICS ==="];

  // Header row
  lines.push(formatCsvRow(["Metric", "Value", "Sub Value", "Trend"]));

  // Primary metrics
  lines.push(
    formatCsvRow([
      "Time-Weighted Return",
      keyMetrics.timeWeightedReturn.value,
      keyMetrics.timeWeightedReturn.subValue,
      keyMetrics.timeWeightedReturn.trend,
    ])
  );

  lines.push(
    formatCsvRow([
      "Max Drawdown",
      keyMetrics.maxDrawdown.value,
      keyMetrics.maxDrawdown.subValue,
      keyMetrics.maxDrawdown.trend,
    ])
  );

  lines.push(
    formatCsvRow([
      "Sharpe Ratio",
      keyMetrics.sharpe.value,
      keyMetrics.sharpe.subValue,
      keyMetrics.sharpe.trend,
    ])
  );

  lines.push(
    formatCsvRow([
      "Win Rate",
      keyMetrics.winRate.value,
      keyMetrics.winRate.subValue,
      keyMetrics.winRate.trend,
    ])
  );

  // Secondary metrics
  lines.push(
    formatCsvRow([
      "Volatility",
      keyMetrics.volatility.value,
      keyMetrics.volatility.subValue,
      keyMetrics.volatility.trend,
    ])
  );

  // Optional metrics
  if (keyMetrics.sortino) {
    lines.push(
      formatCsvRow([
        "Sortino Ratio",
        keyMetrics.sortino.value,
        keyMetrics.sortino.subValue,
        keyMetrics.sortino.trend,
      ])
    );
  }

  if (keyMetrics.beta) {
    lines.push(
      formatCsvRow([
        "Beta",
        keyMetrics.beta.value,
        keyMetrics.beta.subValue,
        keyMetrics.beta.trend,
      ])
    );
  }

  if (keyMetrics.alpha) {
    lines.push(
      formatCsvRow([
        "Alpha",
        keyMetrics.alpha.value,
        keyMetrics.alpha.subValue,
        keyMetrics.alpha.trend,
      ])
    );
  }

  lines.push("");
  return lines;
}

/**
 * Build performance chart data section
 */
export function buildPerformanceSection(metadata: ExportMetadata): string[] {
  const { data } = metadata;
  const { performanceChart } = data;

  const lines: string[] = ["=== PERFORMANCE CHART DATA ==="];

  // Header row
  lines.push(
    formatCsvRow([
      "Date",
      "Portfolio Value (USD)",
      "Normalized Portfolio",
      "Normalized BTC",
    ])
  );

  // Data rows
  for (const point of performanceChart.points) {
    lines.push(
      formatCsvRow([
        point.date,
        point.portfolioValue.toFixed(2),
        point.portfolio.toFixed(2),
        point.btc.toFixed(2),
      ])
    );
  }

  lines.push("");
  return lines;
}

/**
 * Build drawdown chart data section
 */
export function buildDrawdownSection(metadata: ExportMetadata): string[] {
  const { data } = metadata;
  const { drawdownChart } = data;

  const lines: string[] = ["=== DRAWDOWN CHART DATA ==="];

  // Header row
  lines.push(
    formatCsvRow(["Date", "Drawdown (%)", "Normalized X", "Normalized Y"])
  );

  // Data rows
  for (const point of drawdownChart.points) {
    lines.push(
      formatCsvRow([
        point.date,
        point.value.toFixed(2),
        point.x.toFixed(2),
        point.value.toFixed(2), // Normalized Y is same as drawdown value
      ])
    );
  }

  lines.push("");
  return lines;
}

/**
 * Build monthly PnL section
 */
export function buildMonthlyPnLSection(metadata: ExportMetadata): string[] {
  const { data } = metadata;
  const { monthlyPnL } = data;

  const lines: string[] = ["=== MONTHLY PNL ==="];

  // Header row
  lines.push(formatCsvRow(["Month", "Year", "Return (%)"]));

  // Data rows
  for (const item of monthlyPnL) {
    const returnStr =
      item.value >= 0 ? `+${item.value.toFixed(1)}` : item.value.toFixed(1);

    lines.push(
      formatCsvRow([item.month, item.year?.toString() ?? "", returnStr])
    );
  }

  lines.push("");
  return lines;
}

/**
 * Build footer section with attribution
 */
export function buildFooterSection(): string[] {
  return ["Report Generated: Zap Pilot Analytics Engine v0.1.0"];
}

// =============================================================================
// MAIN CSV GENERATION
// =============================================================================

/**
 * Generate complete CSV content from analytics data
 *
 * @param metadata - Export metadata containing all data
 * @param options - CSV generation options
 * @returns Complete CSV content as string
 */
export function generateAnalyticsCSV(
  metadata: ExportMetadata,
  options: CsvGenerationOptions = {}
): string {
  const { lineEnding = "\r\n", includeBOM = true } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // Build all sections
  const sections = [
    ...buildHeaderSection(metadata),
    ...buildMetricsSection(metadata),
    ...buildPerformanceSection(metadata),
    ...buildDrawdownSection(metadata),
    ...buildMonthlyPnLSection(metadata),
    ...buildFooterSection(),
  ];

  // Join sections with line endings
  const csvContent = sections.join(lineEnding);

  // Add UTF-8 BOM for Excel compatibility
  return includeBOM ? "\uFEFF" + csvContent : csvContent;
}

// =============================================================================
// FILENAME GENERATION
// =============================================================================

/**
 * Generate export filename
 *
 * Format: portfolio-analytics-{shortened-address}-{YYYY-MM-DD}.csv
 *
 * @param userId - User wallet address
 * @param date - Export date
 * @returns Filename string
 *
 * @example
 * generateExportFilename('0x1234...5678', new Date('2025-01-17'))
 * // 'portfolio-analytics-0x1234...5678-2025-01-17.csv'
 */
export function generateExportFilename(userId: string, date: Date): string {
  const shortAddress = formatAddress(userId);
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  return `portfolio-analytics-${shortAddress}-${dateStr}.csv`;
}

// =============================================================================
// BROWSER DOWNLOAD
// =============================================================================

/**
 * Trigger browser download of CSV content
 *
 * Uses Blob API and temporary object URL for client-side download
 *
 * @param content - CSV content string
 * @param filename - Download filename
 */
export function downloadCSV(content: string, filename: string): void {
  // Create blob with UTF-8 charset
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;",
  });

  // Create temporary object URL
  const url = URL.createObjectURL(blob);

  // Create temporary download link
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
