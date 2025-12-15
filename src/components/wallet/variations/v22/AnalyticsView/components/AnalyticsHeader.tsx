/**
 * Analytics Header Component
 *
 * Header section for analytics view
 */

import { Download, TrendingUp } from "lucide-react";

/**
 * Analytics Header
 *
 * Displays the analytics section title with export functionality.
 */
export const AnalyticsHeader = () => (
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
    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700">
      <Download className="w-3.5 h-3.5" />
      Export Report
    </button>
  </div>
);
