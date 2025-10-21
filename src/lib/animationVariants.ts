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

/**
 * Spring transition preset with bouncy physics
 *
 * Use for:
 * - Interactive elements (buttons, cards)
 * - Elements that need playful motion
 * - Micro-interactions
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={fadeInUp}
 *   transition={SPRING_TRANSITION}
 * />
 * ```
 */
export const SPRING_TRANSITION: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 20,
};

/**
 * Smooth easeInOut transition
 *
 * Use for:
 * - Content reveals
 * - Modal animations
 * - Default animation style
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={fadeIn}
 *   transition={SMOOTH_TRANSITION}
 * />
 * ```
 */
export const SMOOTH_TRANSITION: Transition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1], // easeInOut cubic-bezier
};

/**
 * Quick transition for subtle animations
 *
 * Use for:
 * - Hover effects
 * - Small UI changes
 * - Loading states
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={scaleIn}
 *   transition={QUICK_TRANSITION}
 * />
 * ```
 */
export const QUICK_TRANSITION: Transition = {
  duration: 0.2,
  ease: "easeOut",
};

/**
 * Stagger transition for child elements
 *
 * Use with `staggerChildren` variant for sequential animations
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={staggerChildren}
 *   transition={STAGGER_TRANSITION}
 * >
 *   {items.map(item => (
 *     <motion.div key={item.id} variants={fadeInUp} />
 *   ))}
 * </motion.div>
 * ```
 */
export const STAGGER_TRANSITION: Transition = {
  staggerChildren: 0.1,
  delayChildren: 0.05,
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

/**
 * Fade in from top
 *
 * Use for:
 * - Dropdowns
 * - Notifications
 * - Elements appearing from navigation
 *
 * Default offset: 20px downward movement
 *
 * @example
 * ```tsx
 * <motion.div
 *   initial="initial"
 *   animate="animate"
 *   variants={fadeInDown}
 * >
 *   Notification content
 * </motion.div>
 * ```
 */
export const fadeInDown: Variants = {
  initial: {
    opacity: 0,
    y: -20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

/**
 * Simple opacity fade (no movement)
 *
 * Use for:
 * - Subtle transitions
 * - Overlays and modals
 * - When movement would be distracting
 *
 * @example
 * ```tsx
 * <AnimatePresence>
 *   {isVisible && (
 *     <motion.div
 *       variants={fadeIn}
 *       transition={QUICK_TRANSITION}
 *     >
 *       Content
 *     </motion.div>
 *   )}
 * </AnimatePresence>
 * ```
 */
export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

/**
 * Slide in from left
 *
 * Use for:
 * - Sidebars and panels
 * - Off-canvas menus
 * - Horizontal content reveals
 *
 * Default offset: 30px rightward movement
 *
 * @example
 * ```tsx
 * <motion.aside
 *   initial="initial"
 *   animate="animate"
 *   exit="exit"
 *   variants={slideInLeft}
 *   transition={SMOOTH_TRANSITION}
 * >
 *   Sidebar content
 * </motion.aside>
 * ```
 */
export const slideInLeft: Variants = {
  initial: {
    opacity: 0,
    x: -30,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -30,
  },
};

/**
 * Slide in from right
 *
 * Use for:
 * - Mobile navigation
 * - Cart drawers
 * - Right-aligned panels
 *
 * Default offset: 30px leftward movement
 *
 * @example
 * ```tsx
 * <AnimatePresence>
 *   {isCartOpen && (
 *     <motion.div
 *       variants={slideInRight}
 *       transition={SPRING_TRANSITION}
 *     >
 *       Cart items
 *     </motion.div>
 *   )}
 * </AnimatePresence>
 * ```
 */
export const slideInRight: Variants = {
  initial: {
    opacity: 0,
    x: 30,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 30,
  },
};

/**
 * Scale up fade in
 *
 * Use for:
 * - Modals and dialogs
 * - Tooltips
 * - Emphasized content
 *
 * Default scale: 0.95 (subtle scale effect)
 *
 * @example
 * ```tsx
 * <motion.dialog
 *   initial="initial"
 *   animate="animate"
 *   exit="exit"
 *   variants={scaleIn}
 *   transition={SPRING_TRANSITION}
 * >
 *   Modal content
 * </motion.dialog>
 * ```
 */
export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
  },
};

/**
 * Container variant for staggered child animations
 *
 * Use for:
 * - Lists and grids
 * - Sequential content reveals
 * - Dashboard sections
 *
 * Children should use variants like `fadeInUp` or `fadeIn`
 *
 * @example
 * ```tsx
 * <motion.ul
 *   initial="initial"
 *   animate="animate"
 *   variants={staggerChildren}
 *   transition={STAGGER_TRANSITION}
 * >
 *   {items.map(item => (
 *     <motion.li
 *       key={item.id}
 *       variants={fadeInUp}
 *     >
 *       {item.content}
 *     </motion.li>
 *   ))}
 * </motion.ul>
 * ```
 */
export const staggerChildren: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
  },
};

// ============================================================================
// Variant Factories
// ============================================================================

/**
 * Create custom fadeInUp variant with specified offset
 *
 * @param yOffset - Vertical offset in pixels (default: 20)
 * @returns Custom fadeInUp variant
 *
 * @example
 * ```tsx
 * const heroVariant = createFadeInUp(60);
 * <motion.div variants={heroVariant}>Hero content</motion.div>
 * ```
 */
export function createFadeInUp(yOffset: number = 20): Variants {
  return {
    initial: {
      opacity: 0,
      y: yOffset,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      y: yOffset,
    },
  };
}

/**
 * Create custom fadeInDown variant with specified offset
 *
 * @param yOffset - Vertical offset in pixels (default: 20)
 * @returns Custom fadeInDown variant
 *
 * @example
 * ```tsx
 * const dropdownVariant = createFadeInDown(10);
 * <motion.div variants={dropdownVariant}>Dropdown menu</motion.div>
 * ```
 */
export function createFadeInDown(yOffset: number = 20): Variants {
  return {
    initial: {
      opacity: 0,
      y: -yOffset,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      y: -yOffset,
    },
  };
}

/**
 * Create custom slideInLeft variant with specified offset
 *
 * @param xOffset - Horizontal offset in pixels (default: 30)
 * @returns Custom slideInLeft variant
 *
 * @example
 * ```tsx
 * const sidebarVariant = createSlideInLeft(100);
 * <motion.aside variants={sidebarVariant}>Sidebar</motion.aside>
 * ```
 */
export function createSlideInLeft(xOffset: number = 30): Variants {
  return {
    initial: {
      opacity: 0,
      x: -xOffset,
    },
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: {
      opacity: 0,
      x: -xOffset,
    },
  };
}

/**
 * Create custom slideInRight variant with specified offset
 *
 * @param xOffset - Horizontal offset in pixels (default: 30)
 * @returns Custom slideInRight variant
 *
 * @example
 * ```tsx
 * const panelVariant = createSlideInRight(200);
 * <motion.div variants={panelVariant}>Panel</motion.div>
 * ```
 */
export function createSlideInRight(xOffset: number = 30): Variants {
  return {
    initial: {
      opacity: 0,
      x: xOffset,
    },
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: {
      opacity: 0,
      x: xOffset,
    },
  };
}

/**
 * Create custom scaleIn variant with specified scale
 *
 * @param scale - Initial scale value (default: 0.95)
 * @returns Custom scaleIn variant
 *
 * @example
 * ```tsx
 * const modalVariant = createScaleIn(0.9);
 * <motion.dialog variants={modalVariant}>Modal</motion.dialog>
 * ```
 */
export function createScaleIn(scale: number = 0.95): Variants {
  return {
    initial: {
      opacity: 0,
      scale,
    },
    animate: {
      opacity: 1,
      scale: 1,
    },
    exit: {
      opacity: 0,
      scale,
    },
  };
}

/**
 * Create custom staggerChildren variant with specified timing
 *
 * @param staggerDelay - Delay between each child (default: 0.1)
 * @param delayChildren - Initial delay before first child (default: 0.05)
 * @returns Custom staggerChildren variant
 *
 * @example
 * ```tsx
 * const listVariant = createStaggerChildren(0.05, 0);
 * <motion.ul variants={listVariant}>
 *   {items.map(item => <motion.li variants={fadeInUp} />)}
 * </motion.ul>
 * ```
 */
export function createStaggerChildren(
  staggerDelay: number = 0.1,
  delayChildren: number = 0.05
): Variants {
  return {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
    exit: {
      opacity: 0,
    },
  };
}

// ============================================================================
// Compound Variants
// ============================================================================

/**
 * Combined fade and scale animation (more dramatic)
 *
 * Use for:
 * - Hero sections
 * - Feature highlights
 * - Call-to-action elements
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={fadeScaleIn}
 *   transition={SPRING_TRANSITION}
 * >
 *   Hero content
 * </motion.div>
 * ```
 */
export const fadeScaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
};

/**
 * Rotate and fade in animation
 *
 * Use for:
 * - Icons and badges
 * - Playful interactions
 * - Loading indicators
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={rotateIn}
 *   transition={SPRING_TRANSITION}
 * >
 *   <Icon />
 * </motion.div>
 * ```
 */
export const rotateIn: Variants = {
  initial: {
    opacity: 0,
    rotate: -10,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    rotate: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    rotate: 10,
    scale: 0.9,
  },
};

// ============================================================================
// Type Exports
// ============================================================================

/**
 * All available transition presets
 */
export type TransitionPreset = "spring" | "smooth" | "quick" | "stagger";

/**
 * All available animation variants
 */
export type AnimationVariant =
  | "fadeInUp"
  | "fadeInDown"
  | "fadeIn"
  | "slideInLeft"
  | "slideInRight"
  | "scaleIn"
  | "staggerChildren"
  | "fadeScaleIn"
  | "rotateIn";

/**
 * Get transition by preset name
 *
 * @param preset - Transition preset name
 * @returns Transition configuration
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={fadeInUp}
 *   transition={getTransition("spring")}
 * />
 * ```
 */
export function getTransition(preset: TransitionPreset): Transition {
  const presets: Record<TransitionPreset, Transition> = {
    spring: SPRING_TRANSITION,
    smooth: SMOOTH_TRANSITION,
    quick: QUICK_TRANSITION,
    stagger: STAGGER_TRANSITION,
  };

  return presets[preset];
}

/**
 * Default export containing all variants and utilities
 */
export default {
  // Variants
  fadeInUp,
  fadeInDown,
  fadeIn,
  slideInLeft,
  slideInRight,
  scaleIn,
  staggerChildren,
  fadeScaleIn,
  rotateIn,

  // Transitions
  transitions: {
    spring: SPRING_TRANSITION,
    smooth: SMOOTH_TRANSITION,
    quick: QUICK_TRANSITION,
    stagger: STAGGER_TRANSITION,
  },

  // Factories
  create: {
    fadeInUp: createFadeInUp,
    fadeInDown: createFadeInDown,
    slideInLeft: createSlideInLeft,
    slideInRight: createSlideInRight,
    scaleIn: createScaleIn,
    staggerChildren: createStaggerChildren,
  },

  // Utilities
  getTransition,
} as const;
