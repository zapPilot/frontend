/**
 * Centralized Framer Motion Animation Variants
 *
 * This module provides reusable animation variants and transition presets
 * to eliminate duplication across components and ensure consistent animations.
 *
 * @module animationVariants
 * @see https://www.framer.com/motion/animation/
 */

import type { Transition, Variants } from "framer-motion";

// ============================================================================
// Transition Presets
// ============================================================================

// Internal-only constants (not exported)
const SPRING_TRANSITION: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 20,
};

const QUICK_TRANSITION: Transition = {
  duration: 0.2,
  ease: "easeOut",
};

const STAGGER_TRANSITION: Transition = {
  staggerChildren: 0.1,
  delayChildren: 0.05,
};

// SMOOTH_TRANSITION is still used in components, so it remains exported
/**
 * Smooth easeInOut transition
 *
 * Use for:
 * - Content reveals
 * - Modal animations
 * - Default animation style
 */
export const SMOOTH_TRANSITION: Transition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1],
};

// ============================================================================
// Core Animation Variants
// ============================================================================

/**
 * Fade in from bottom (most common pattern)
 *
 * Use for:
 * - Content sections
 * - Cards and containers
 * - Default component entry
 *
 * Default offset: 20px upward movement
 *
 * @example
 * ```tsx
 * <motion.div
 *   initial="initial"
 *   animate="animate"
 *   exit="exit"
 *   variants={fadeInUp}
 *   transition={SMOOTH_TRANSITION}
 * >
 *   Content
 * </motion.div>
 * ```
 *
 * @example Custom offset
 * ```tsx
 * const customVariant = createFadeInUp(40); // 40px offset
 * <motion.div variants={customVariant} />
 * ```
 */
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 20,
  },
};

// fadeInDown removed - unused (2025-12-22)

/**
 * Dropdown menu animation with scale
 *
 * Use for:
 * - Dropdown menus
 * - Popover content
 * - Menu panels
 *
 * Combines fade, slide from top, and subtle scale for polished dropdown effect
 */
export const dropdownMenu: Variants = {
  initial: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
};





// ============================================================================
// Compound Variants
// ============================================================================

/**
 * Default export containing all variants and transitions
 */
export default {
  // Variants
  fadeInUp,
  dropdownMenu,

  // Transitions (for backward compatibility)
  transitions: {
    spring: SPRING_TRANSITION,
    smooth: SMOOTH_TRANSITION,
    quick: QUICK_TRANSITION,
    stagger: STAGGER_TRANSITION,
  },
} as const;
