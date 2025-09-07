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

// Glass Morphism Styles
export const GLASS_MORPHISM = {
  BASE: "glass-morphism",
  WITH_BORDER: "glass-morphism border border-gray-800",
  ROUNDED_LG: "glass-morphism rounded-2xl border border-gray-800",
  ROUNDED_XL: "glass-morphism rounded-3xl border border-gray-800",
  HOVER: "glass-morphism hover:bg-white/10 transition-all duration-300",
} as const;

// Animation Timing
export const ANIMATION_DELAYS = {
  NONE: 0,
  FAST: 0.05,
  NORMAL: 0.1,
  SLOW: 0.2,
  EXTRA_SLOW: 0.3,
} as const;

export const ANIMATION_DURATIONS = {
  FAST: 0.2,
  NORMAL: 0.5,
  SLOW: 0.8,
} as const;

export const ANIMATION_CONFIG = {
  STAGGER_DELAY: 0.05,
  DEFAULT_DURATION: ANIMATION_DURATIONS.NORMAL,
} as const;

// Spacing and Layout
export const LAYOUT = {
  CONTAINER_PADDING: "p-6",
  SECTION_SPACING: "space-y-6",
  GRID_GAP: "gap-6",
  CARD_PADDING: "p-4",
} as const;

// Utility functions for consistent styling
export const getGradientClass = (gradient: keyof typeof GRADIENTS) =>
  `bg-gradient-to-r ${GRADIENTS[gradient]}`;

export const getGlassMorphismClass = (
  variant: keyof typeof GLASS_MORPHISM = "BASE"
) => GLASS_MORPHISM[variant];

export const getAnimationDelay = (step: number) =>
  ANIMATION_DELAYS.NORMAL * step;

// Scrollbar Styling for Glass Morphism Design
export const SCROLLBAR = {
  DEFAULT: {
    className:
      "scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent",
    styles:
      "scrollbar-width: thin; scrollbar-color: rgb(75 85 99) transparent;",
  },
  GLASS: {
    className:
      "scrollbar-thin scrollbar-thumb-gray-500/50 scrollbar-track-gray-900/10",
    styles:
      "scrollbar-width: thin; scrollbar-color: rgba(107 114 128 / 0.5) rgba(17 24 39 / 0.1);",
  },
  PORTFOLIO: {
    className:
      "scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent hover:scrollbar-thumb-purple-400/70",
    styles:
      "scrollbar-width: thin; scrollbar-color: rgba(168 85 247 / 0.5) transparent;",
  },
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
export type GlassMorphismVariant = keyof typeof GLASS_MORPHISM;
export type AnimationDelay = keyof typeof ANIMATION_DELAYS;
export type ScrollbarVariant = keyof typeof SCROLLBAR;
export type ScrollableContainerVariant = keyof typeof SCROLLABLE_CONTAINER;
