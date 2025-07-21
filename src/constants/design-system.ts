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

// Type exports for convenience
export type GradientType = keyof typeof GRADIENTS;
export type GlassMorphismVariant = keyof typeof GLASS_MORPHISM;
export type AnimationDelay = keyof typeof ANIMATION_DELAYS;
