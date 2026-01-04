/**
 * Portfolio Utility Functions
 *
 * Shared utilities for portfolio data processing.
 * Extracted to eliminate duplication across adapters and hooks.
 */

import type { LandingPageResponse } from "@/services/analyticsService";

/**
 * ROI change data structure
 */
export interface ROIChanges {
  change7d: number;
  change30d: number;
}

/**
 * Extracts ROI changes from landing page data
 *
 * Handles both the modern `windows` format and legacy `roi_7d`/`roi_30d` fields.
 *
 * @param landingData - Landing page response from analytics API
 * @returns ROI changes for 7-day and 30-day periods
 */
export function extractROIChanges(
  landingData: LandingPageResponse
): ROIChanges {
  const roiData = landingData.portfolio_roi;

  if (!roiData) {
    return { change7d: 0, change30d: 0 };
  }

  let change7d = 0;
  let change30d = 0;

  if (roiData.windows) {
    change7d = roiData.windows["7d"]?.value ?? 0;
    change30d = roiData.windows["30d"]?.value ?? 0;
  } else {
    // Fallback to legacy fields
    change7d = roiData.roi_7d?.value ?? 0;
    change30d = roiData.roi_30d?.value ?? 0;
  }

  return { change7d, change30d };
}

/**
 * Counts unique protocols in pool details
 *
 * @param poolDetails - Array of pool items with protocol_id field
 * @returns Number of unique protocols
 */
export function countUniqueProtocols(
  poolDetails: { protocol_id: string }[]
): number {
  const uniqueProtocols = new Set(poolDetails.map(pool => pool.protocol_id));
  return uniqueProtocols.size;
}

/**
 * Counts unique chains in pool details
 *
 * @param poolDetails - Array of pool items with chain field
 * @returns Number of unique chains
 */
export function countUniqueChains(poolDetails: { chain: string }[]): number {
  const uniqueChains = new Set(poolDetails.map(pool => pool.chain));
  return uniqueChains.size;
}
