/**
 * Design System Constants
 *
 * Consolidated design tokens for consistent styling, animations,
 * and visual elements across the application.
 */

// Color Gradients
export const GRADIENTS = {
  PRIMARY: "from-purple-600 to-blue-600",
  SUCCESS: "from-green-600 to-emerald-600",
  DANGER: "from-red-600 to-pink-600",
  WARNING: "from-yellow-600 to-orange-600",
  INFO: "from-blue-600 to-cyan-600",
  DARK: "from-gray-800 to-gray-900",
  LIGHT: "from-gray-200 to-gray-300",
} as const;

// Custom Scrollable Container Classes
export const SCROLLABLE_CONTAINER = {
  BASE: "overflow-y-auto",
  WITH_FADE:
    "overflow-y-auto relative before:absolute before:top-0 before:left-0 before:right-0 before:h-4 before:bg-gradient-to-b before:from-gray-900/20 before:to-transparent before:pointer-events-none before:z-10 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-4 after:bg-gradient-to-t after:from-gray-900/20 after:to-transparent after:pointer-events-none after:z-10",
  PORTFOLIO_DETAILS:
    "overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent hover:scrollbar-thumb-purple-400/70",
} as const;

// Layering (z-index) tokens for consistent stacking order
export const Z_INDEX = {
  CONTENT: "z-10",
  BANNER: "z-30", // beneath headers, above content
  HEADER: "z-40",
  HEADER_MOBILE: "z-50",
  FAB: "z-40",
  TOAST: "z-50",
  MODAL: "z-60",
  TOOLTIP: "z-[9999]",
} as const;

// Header sizing/offset tokens
export const HEADER = {
  HEIGHT: "h-16",
  TOP_OFFSET: "top-16",
} as const;

// Type exports for convenience
export type GradientType = keyof typeof GRADIENTS;
export type ScrollableContainerVariant = keyof typeof SCROLLABLE_CONTAINER;
