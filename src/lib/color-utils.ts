/**
 * Color Utility Functions
 *
 * Essential color utilities for consistent styling across the application.
 * Only contains actively used functions to minimize dead code.
 *
 * @module lib/color-utils
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

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
 * Unified function for consistent color application
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