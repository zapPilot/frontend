/**
 * Design System Constants
 *
 * Consolidated design tokens for consistent styling, animations,
 * and visual elements across the application.
 */

// Color Gradients
export const GRADIENTS = {
  PRIMARY: "from-purple-600 to-blue-600",
  /** Primary gradient with 20% opacity */
  PRIMARY_20: "from-purple-600/20 to-blue-600/20",
  /** Lighter primary gradient for hover states */
  PRIMARY_HOVER: "from-purple-500 to-blue-500",
  /** Primary 400 variant for UI accents */
  PRIMARY_400: "from-purple-400 to-blue-400",
  /** Subtle gradient with 20% opacity */
  PRIMARY_SUBTLE: "from-purple-500/20 to-blue-500/20",
  /** Subtle gradient hover with 30% opacity */
  PRIMARY_SUBTLE_HOVER: "from-purple-500/30 to-blue-500/30",
  /** Faint gradient with 10% opacity */
  PRIMARY_FAINT: "from-purple-500/10 to-blue-500/10",
  /** Faint gradient hover with 20% opacity */
  PRIMARY_FAINT_HOVER: "from-purple-500/20 to-blue-500/20",
  /** Background gradient with purple-gray-blue transition */
  BACKGROUND: "from-purple-900/20 via-gray-950 to-blue-900/20",
  SUCCESS: "from-green-600 to-emerald-600",
  DANGER: "from-red-600 to-pink-600",
  WARNING: "from-yellow-600 to-orange-600",
  INFO: "from-blue-600 to-cyan-600",
  DARK: "from-gray-800 to-gray-900",
  LIGHT: "from-gray-200 to-gray-300",
} as const;

/**
 * Common flexbox layout patterns
 * Used for consistent spacing and alignment across components
 */
export const FLEX_PATTERNS = {
  /** Flex row with centered items, 0.25rem gap */
  CENTER_GAP_1: "flex items-center gap-1",
  /** Flex row with centered items, 0.5rem gap */
  CENTER_GAP_2: "flex items-center gap-2",
  /** Flex row with centered items, 0.75rem gap */
  CENTER_GAP_3: "flex items-center gap-3",
  /** Flex row with centered items, 1rem gap */
  CENTER_GAP_4: "flex items-center gap-4",
  /** Flex row with items centered, space-between distribution */
  BETWEEN: "flex items-center justify-between",
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

// Framer Motion Animation Variants
export const ANIMATIONS = {
  /** Expand/collapse animation for progressive disclosure UI patterns */
  EXPAND_COLLAPSE: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
  },
} as const;
