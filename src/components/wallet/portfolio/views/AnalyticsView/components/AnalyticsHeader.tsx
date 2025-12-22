/**
 * Analytics Header Component
 *
 * Header section for analytics view
 */

import { AlertCircle, Download, Loader2, TrendingUp } from "lucide-react";

export interface AnalyticsHeaderProps {
  /** Export handler function */
  onExport: () => void;
  /** Whether export is in progress */
  isExporting?: boolean;
  /** Export error message */
  exportError?: string | null;
}

/**
 * Analytics Header
 *
 * Displays the analytics section title with export functionality.
 */
export const AnalyticsHeader = ({
  onExport,
  isExporting = false,
  exportError = null,
}: AnalyticsHeaderProps) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-purple-400" />
        Flight Recorder
      </h2>
      <p className="text-sm text-gray-400">
        Performance analysis and historical regime data
      </p>
    </div>

    <div className="flex flex-col items-end gap-2">
      <button
        onClick={onExport}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {isExporting ? "Exporting..." : "Export Report"}
      </button>

      {exportError && (
        <div className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="w-3 h-3" />
          <span>{exportError}</span>
        </div>
      )}
    </div>
  </div>
);
