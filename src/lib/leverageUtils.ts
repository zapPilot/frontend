/**
 * Leverage Ratio Calculation Utilities
 *
 * Provides functions for calculating and analyzing portfolio leverage metrics
 * following DeFi industry standards.
 */

export type LeverageHealthStatus = 'safe' | 'moderate' | 'high' | 'critical';

export interface LeverageMetrics {
  /** Leverage ratio (e.g., 1.5 means 1.5x leveraged) */
  ratio: number;
  /** Debt as percentage of total assets (e.g., 33.33 for 1.5x leverage) */
  debtPercentage: number;
  /** Health status based on industry thresholds */
  healthStatus: LeverageHealthStatus;
  /** Textual description of the health status */
  healthLabel: string;
  /** Health factor (inverse of utilization - higher is safer) */
  healthFactor: number;
  /** Whether user has any debt positions */
  hasDebt: boolean;
}

/**
 * Risk thresholds based on DeFi industry standards
 * - Safe: < 2.0x leverage (< 50% LTV)
 * - Moderate: 2.0-3.0x leverage (50-66% LTV)
 * - High: 3.0-4.0x leverage (66-75% LTV)
 * - Critical: > 4.0x leverage (> 75% LTV)
 */
export const LEVERAGE_THRESHOLDS = {
  safe: 2.0,
  moderate: 3.0,
  high: 4.0,
} as const;

/**
 * Color schemes for each leverage health status
 * Aligned with existing design system tokens
 */
export const LEVERAGE_COLORS = {
  safe: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-700/50',
    glow: 'shadow-emerald-500/20',
    icon: 'text-emerald-500',
  },
  moderate: {
    text: 'text-amber-400',
    bg: 'bg-amber-900/20',
    border: 'border-amber-700/50',
    glow: 'shadow-amber-500/20',
    icon: 'text-amber-500',
  },
  high: {
    text: 'text-orange-400',
    bg: 'bg-orange-900/20',
    border: 'border-orange-700/50',
    glow: 'shadow-orange-500/20',
    icon: 'text-orange-500',
  },
  critical: {
    text: 'text-rose-400',
    bg: 'bg-rose-900/20',
    border: 'border-rose-700/50',
    glow: 'shadow-rose-500/20',
    icon: 'text-rose-500',
  },
} as const;

/**
 * Calculates the leverage ratio for a portfolio
 *
 * Formula: leverage_ratio = total_assets / (total_assets - total_debt)
 *
 * @param totalAssets - Total portfolio assets in USD
 * @param totalDebt - Total borrowed amount in USD
 * @returns Leverage ratio (1.0 = no leverage, > 1.0 = leveraged)
 *
 * @example
 * calculateLeverageRatio(10000, 2000) // Returns 1.25 (1.25x leverage)
 * calculateLeverageRatio(10000, 0)    // Returns 1.0 (no leverage)
 */
export function calculateLeverageRatio(
  totalAssets: number,
  totalDebt: number
): number {
  // Validate inputs
  if (totalAssets < 0 || totalDebt < 0) {
    // Invalid input: negative values
    return 1.0;
  }

  // No debt case
  if (totalDebt === 0) {
    return 1.0;
  }

  // Calculate net equity
  const netEquity = totalAssets - totalDebt;

  // Edge case: debt exceeds assets (underwater position)
  if (netEquity <= 0) {
    // Critical: debt exceeds assets
    return Infinity;
  }

  // Calculate leverage ratio
  const ratio = totalAssets / netEquity;

  return ratio;
}

/**
 * Determines the health status based on leverage ratio
 *
 * @param leverageRatio - The calculated leverage ratio
 * @returns Health status classification
 */
export function getLeverageHealthStatus(
  leverageRatio: number
): LeverageHealthStatus {
  if (!isFinite(leverageRatio) || leverageRatio >= LEVERAGE_THRESHOLDS.high) {
    return 'critical';
  }
  if (leverageRatio >= LEVERAGE_THRESHOLDS.moderate) {
    return 'high';
  }
  if (leverageRatio >= LEVERAGE_THRESHOLDS.safe) {
    return 'moderate';
  }
  return 'safe';
}

/**
 * Gets a human-readable label for the health status
 *
 * @param status - The health status
 * @returns User-friendly label
 */
export function getLeverageHealthLabel(status: LeverageHealthStatus): string {
  const labels: Record<LeverageHealthStatus, string> = {
    safe: 'Safe',
    moderate: 'Caution',
    high: 'High Risk',
    critical: 'Critical',
  };
  return labels[status];
}

/**
 * Calculates the health factor (inverse of utilization)
 * Higher values indicate healthier positions
 *
 * @param totalAssets - Total portfolio assets in USD
 * @param totalDebt - Total borrowed amount in USD
 * @returns Health factor (higher is better)
 *
 * @example
 * calculateHealthFactor(10000, 2000) // Returns 5.0 (very healthy)
 * calculateHealthFactor(10000, 8000) // Returns 1.25 (risky)
 */
export function calculateHealthFactor(
  totalAssets: number,
  totalDebt: number
): number {
  if (totalDebt === 0) {
    return Infinity; // No risk when no debt
  }

  if (totalAssets <= 0) {
    return 0; // Critical situation
  }

  return totalAssets / totalDebt;
}

/**
 * Calculates comprehensive leverage metrics for a portfolio
 *
 * @param totalAssets - Total portfolio assets in USD
 * @param totalDebt - Total borrowed amount in USD
 * @returns Complete leverage metrics object
 */
export function getLeverageMetrics(
  totalAssets: number,
  totalDebt: number
): LeverageMetrics {
  const hasDebt = totalDebt > 0;
  const ratio = calculateLeverageRatio(totalAssets, totalDebt);
  const healthStatus = getLeverageHealthStatus(ratio);
  const healthLabel = getLeverageHealthLabel(healthStatus);
  const healthFactor = calculateHealthFactor(totalAssets, totalDebt);

  // Calculate debt as percentage of assets
  const debtPercentage = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;

  return {
    ratio,
    debtPercentage,
    healthStatus,
    healthLabel,
    healthFactor,
    hasDebt,
  };
}

/**
 * Formats leverage ratio for display
 *
 * @param ratio - The leverage ratio
 * @returns Formatted string (e.g., "1.5x" or "No Leverage")
 */
export function formatLeverageRatio(ratio: number): string {
  if (!isFinite(ratio)) {
    return 'Critical';
  }
  if (ratio === 1.0) {
    return 'No Leverage';
  }
  return `${ratio.toFixed(2)}x`;
}

/**
 * Formats health factor for display
 *
 * @param healthFactor - The health factor value
 * @returns Formatted string (e.g., "2.5" or "∞")
 */
export function formatHealthFactor(healthFactor: number): string {
  if (!isFinite(healthFactor)) {
    return '∞';
  }
  if (healthFactor === 0) {
    return '0';
  }
  return healthFactor.toFixed(2);
}
