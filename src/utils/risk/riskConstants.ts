/**
 * Risk Assessment Constants
 *
 * Centralized constants for risk classification and thresholds
 */

// Volatility thresholds (percentages)
export const VOLATILITY_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 100,
} as const;

// Drawdown thresholds (percentages)
export const DRAWDOWN_THRESHOLDS = {
  LOW: 10,
  MODERATE: 15,
  HIGH: 20,
} as const;

// Risk level types
export type RiskLevel = "low" | "medium" | "high" | "very-high";
export type DrawdownLevel = "low" | "moderate" | "high" | "severe";

// Color schemes for risk levels
export const RISK_COLORS = {
  "very-high": {
    value: "text-red-400",
    border: "border-red-800/30",
    bg: "bg-red-900/20",
    subtitle: "text-red-300",
    icon: "text-red-400",
    badge: "bg-red-900/30 text-red-400",
  },
  high: {
    value: "text-orange-400",
    border: "border-orange-800/30",
    bg: "bg-orange-900/20",
    subtitle: "text-orange-300",
    icon: "text-orange-400",
    badge: "bg-orange-900/30 text-orange-400",
  },
  medium: {
    value: "text-yellow-400",
    border: "border-yellow-800/30",
    bg: "bg-yellow-900/20",
    subtitle: "text-yellow-300",
    icon: "text-yellow-400",
    badge: "bg-yellow-900/30 text-yellow-400",
  },
  low: {
    value: "text-green-400",
    border: "border-green-800/30",
    bg: "bg-green-900/20",
    subtitle: "text-green-300",
    icon: "text-green-400",
    badge: "bg-green-900/30 text-green-400",
  },
} as const;

export const DRAWDOWN_COLORS = {
  severe: RISK_COLORS["very-high"],
  high: RISK_COLORS.high,
  moderate: RISK_COLORS.medium,
  low: RISK_COLORS.low,
} as const;

// Risk level labels
export const RISK_LABELS: Record<RiskLevel, string> = {
  "very-high": "Very High",
  high: "High",
  medium: "Medium",
  low: "Low",
} as const;

export const DRAWDOWN_LABELS: Record<DrawdownLevel, string> = {
  severe: "Severe",
  high: "High",
  moderate: "Moderate",
  low: "Low",
} as const;

// Animation delays for staggered reveals
export const ANIMATION_DELAYS = {
  KEY_TAKEAWAY: 0,
  VOLATILITY: 0.1,
  DRAWDOWN: 0.2,
  RECOMMENDATIONS: 0.3,
} as const;
