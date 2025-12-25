/**
 * Analytics Export Service
 *
 * Service layer for exporting analytics data to various formats
 */

import {
  downloadCSV,
  generateAnalyticsCSV,
  generateExportFilename,
} from "@/lib/csvGenerator";
import type { AnalyticsData, AnalyticsTimePeriod } from "@/types/analytics";
import type { ExportMetadata, ExportResult } from "@/types/export";

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate analytics data for export
 *
 * Ensures data has minimum required fields for export
 *
 * @param data - Analytics data to validate
 * @returns True if data is valid and complete
 */
export function validateExportData(data: AnalyticsData | null): boolean {
  if (!data) return false;

  // Check for required chart data
  if (
    !data.performanceChart?.points ||
    data.performanceChart.points.length === 0
  ) {
    return false;
  }

  if (!data.drawdownChart?.points || data.drawdownChart.points.length === 0) {
    return false;
  }

  // Check for required key metrics
  if (!data.keyMetrics) {
    return false;
  }

  const requiredMetrics = [
    "timeWeightedReturn",
    "maxDrawdown",
    "sharpe",
    "winRate",
    "volatility",
  ];

  for (const metric of requiredMetrics) {
    if (!data.keyMetrics[metric as keyof typeof data.keyMetrics]) {
      return false;
    }
  }

  // Monthly PnL is optional but check if exists
  if (!data.monthlyPnL) {
    return false;
  }

  return true;
}

// =============================================================================
// EXPORT FUNCTIONS
// =============================================================================

/**
 * Export analytics data to CSV format
 *
 * Validates data, generates CSV content, and triggers browser download
 *
 * @param userId - User wallet address
 * @param data - Analytics data to export
 * @param timePeriod - Selected time period
 * @returns Export result with success status and optional error
 *
 * @example
 * const result = await exportAnalyticsToCSV(
 *   '0x1234...5678',
 *   analyticsData,
 *   '1Y'
 * );
 *
 * if (result.success) {
 *   console.log('Exported:', result.filename);
 * } else {
 *   console.error('Export failed:', result.error);
 * }
 */
export async function exportAnalyticsToCSV(
  userId: string,
  data: AnalyticsData,
  timePeriod: AnalyticsTimePeriod
): Promise<ExportResult> {
  try {
    // Validate user ID
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      return {
        success: false,
        error: "User ID is required for export",
      };
    }

    // Validate analytics data
    if (!validateExportData(data)) {
      return {
        success: false,
        error: "Invalid analytics data - missing required fields",
      };
    }

    // Build export metadata
    const metadata: ExportMetadata = {
      userId,
      timePeriod,
      data,
      timestamp: new Date(),
    };

    // Generate CSV content
    const csvContent = generateAnalyticsCSV(metadata);

    // Generate filename
    const filename = generateExportFilename(userId, metadata.timestamp);

    // Trigger browser download
    downloadCSV(csvContent, filename);

    return {
      success: true,
      filename,
    };
  } catch (error) {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error("[analyticsExportService] Export failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to generate CSV file: ${error.message}`
          : "Failed to generate CSV file",
    };
  }
}
