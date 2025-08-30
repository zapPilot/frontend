/**
 * Color Utility Functions
 *
 * Consolidates all color-related utilities from various files into a single,
 * consistent module. Handles positive/negative value styling, risk levels,
 * performance indicators, and trend colors.
 *
 * @module lib/color-utils
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export type RiskLevel = "Low" | "Medium" | "High" | "Unknown";
export type TrendDirection = "up" | "down" | "neutral";
export type ThemeVariant = "dark" | "light";

export interface ColorConfig {
  /** Theme variant to use */
  theme?: ThemeVariant;
  /** Include background colors */
  includeBackground?: boolean;
  /** Color intensity (100-900 for Tailwind) */
  intensity?: number;
}

export interface PerformanceColorOptions {
  /** Show neutral color for zero values */
  neutralZero?: boolean;
  /** Custom neutral color */
  neutralColor?: string;
  /** Custom positive color */
  positiveColor?: string;
  /** Custom negative color */
  negativeColor?: string;
}

// =============================================================================
// CORE COLOR UTILITIES
// =============================================================================

/**
 * Get color classes for positive/negative value changes
 * Unified function that replaces getChangeColorClasses, getPerformanceColor, and getChangeColor
 *
 * @param value - The numerical value to evaluate
 * @param options - Color customization options
 * @returns Tailwind CSS classes for the value's color
 */
export function getValueColorClasses(
  value: number,
  options: PerformanceColorOptions = {}
): string {
  const {
    neutralZero = true,
    neutralColor = "text-gray-400",
    positiveColor = "text-green-400",
    negativeColor = "text-red-400",
  } = options;

  if (neutralZero && value === 0) {
    return neutralColor;
  }

  return value >= 0 ? positiveColor : negativeColor;
}

/**
 * Get color classes based on trend direction
 *
 * @param trend - The trend direction
 * @param options - Color customization options
 * @returns Tailwind CSS classes for the trend's color
 */
export function getTrendColorClasses(
  trend: TrendDirection,
  options: PerformanceColorOptions = {}
): string {
  const {
    neutralColor = "text-gray-400",
    positiveColor = "text-green-400",
    negativeColor = "text-red-400",
  } = options;

  switch (trend) {
    case "up":
      return positiveColor;
    case "down":
      return negativeColor;
    case "neutral":
    default:
      return neutralColor;
  }
}

/**
 * Get color classes for performance metrics
 * Alias for getValueColorClasses for semantic clarity
 *
 * @param performance - Performance value (positive/negative)
 * @param options - Color customization options
 * @returns Tailwind CSS classes for performance color
 */
export function getPerformanceColorClasses(
  performance: number,
  options: PerformanceColorOptions = {}
): string {
  return getValueColorClasses(performance, options);
}

/**
 * Get color classes for change values (with sign consideration)
 * Treats zero as positive (green) for backward compatibility
 *
 * @param change - Change value (positive/negative)
 * @param options - Color customization options
 * @returns Tailwind CSS classes for change color
 */
export function getChangeColorClasses(
  change: number,
  options: PerformanceColorOptions = {}
): string {
  // Override neutralZero to false for backward compatibility - zero is treated as positive
  const changeOptions: PerformanceColorOptions = {
    ...options,
    neutralZero: false,
  };
  return getValueColorClasses(change, changeOptions);
}

// =============================================================================
// RISK LEVEL COLORS
// =============================================================================

/**
 * Get risk level styling classes
 *
 * @param risk - The risk level
 * @param config - Color configuration options
 * @returns Tailwind CSS classes for the risk level
 */
export function getRiskLevelClasses(
  risk: RiskLevel,
  config: ColorConfig = {}
): string {
  const { theme = "dark", includeBackground = true } = config;

  // Base classes for dark theme (default)
  const darkThemeClasses = {
    Low: includeBackground
      ? "bg-green-900/30 text-green-400"
      : "text-green-400",
    Medium: includeBackground
      ? "bg-yellow-900/30 text-yellow-400"
      : "text-yellow-400",
    High: includeBackground ? "bg-red-900/30 text-red-400" : "text-red-400",
    Unknown: includeBackground
      ? "bg-gray-900/30 text-gray-400"
      : "text-gray-400",
  };

  // Light theme classes
  const lightThemeClasses = {
    Low: includeBackground ? "bg-green-100 text-green-700" : "text-green-700",
    Medium: includeBackground
      ? "bg-yellow-100 text-yellow-700"
      : "text-yellow-700",
    High: includeBackground ? "bg-red-100 text-red-700" : "text-red-700",
    Unknown: includeBackground ? "bg-gray-100 text-gray-700" : "text-gray-700",
  };

  const themeClasses = theme === "light" ? lightThemeClasses : darkThemeClasses;
  return themeClasses[risk] || themeClasses.Unknown;
}

// =============================================================================
// SPECIALIZED COLOR FUNCTIONS
// =============================================================================

/**
 * Get color for APR/yield values
 * Higher values get more positive colors
 *
 * @param apr - APR percentage
 * @returns Tailwind CSS classes
 */
export function getAPRColorClasses(apr: number): string {
  if (apr <= 0) return "text-gray-400";
  if (apr < 5) return "text-yellow-400";
  if (apr < 15) return "text-green-400";
  return "text-emerald-400"; // High yield
}

/**
 * Get color for volatility values
 * Higher volatility gets more warning colors
 *
 * @param volatility - Volatility percentage
 * @returns Tailwind CSS classes
 */
export function getVolatilityColorClasses(volatility: number): string {
  if (volatility < 10) return "text-green-400"; // Low volatility
  if (volatility < 25) return "text-yellow-400"; // Medium volatility
  return "text-red-400"; // High volatility
}

/**
 * Get color for Sharpe ratio values
 * Higher Sharpe ratios get more positive colors
 *
 * @param sharpe - Sharpe ratio
 * @returns Tailwind CSS classes
 */
export function getSharpeRatioColorClasses(sharpe: number): string {
  if (sharpe < 0) return "text-red-400";
  if (sharpe < 1) return "text-yellow-400";
  if (sharpe < 2) return "text-green-400";
  return "text-emerald-400"; // Excellent
}

// =============================================================================
// ASSET CATEGORY COLORS
// =============================================================================

/**
 * Predefined colors for asset categories
 */
export const ASSET_CATEGORY_COLORS = {
  BTC: "bg-orange-500",
  ETH: "bg-blue-500",
  "DeFi Tokens": "bg-purple-500",
  Stablecoins: "bg-green-500",
  Altcoins: "bg-red-500",
  NFTs: "bg-pink-500",
  Gaming: "bg-indigo-500",
  Metaverse: "bg-cyan-500",
  Layer2: "bg-violet-500",
  Yield: "bg-emerald-500",
} as const;

/**
 * Get color for asset category
 *
 * @param category - Asset category name
 * @param fallback - Fallback color if category not found
 * @returns Tailwind CSS background color class
 */
export function getAssetCategoryColor(
  category: string,
  fallback = "bg-gray-500"
): string {
  return (
    ASSET_CATEGORY_COLORS[category as keyof typeof ASSET_CATEGORY_COLORS] ||
    fallback
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate color palette for charts
 *
 * @param count - Number of colors needed
 * @param startHue - Starting hue (0-360)
 * @returns Array of HSL color strings
 */
export function generateColorPalette(count: number, startHue = 0): string[] {
  const colors: string[] = [];
  const hueStep = 360 / count;

  for (let i = 0; i < count; i++) {
    const hue = (startHue + i * hueStep) % 360;
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }

  return colors;
}

/**
 * Convert percentage to color (red to green gradient)
 *
 * @param percentage - Percentage value (0-100)
 * @returns RGB color string
 */
export function percentageToColor(percentage: number): string {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Convert to 0-1 range
  const normalized = clampedPercentage / 100;

  // Calculate RGB values (red to green)
  const red = Math.round((1 - normalized) * 255);
  const green = Math.round(normalized * 255);
  const blue = 0;

  return `rgb(${red}, ${green}, ${blue})`;
}

/**
 * Get contrast color (black or white) for a given background color
 *
 * @param backgroundColor - Background color in hex format (#RRGGBB)
 * @returns "text-white" or "text-black" for contrast
 */
export function getContrastColor(backgroundColor: string): string {
  // Remove # if present
  const hex = backgroundColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "text-black" : "text-white";
}

// =============================================================================
// LEGACY COMPATIBILITY EXPORTS
// =============================================================================

// Backward compatibility exports with corrected references
export const getChangeColor = getChangeColorClasses;
export const getPerformanceColor = getPerformanceColorClasses;

// Additional semantic aliases
export {
  getValueColorClasses as getValueChangeColor,
  getTrendColorClasses as getTrendColor,
};
