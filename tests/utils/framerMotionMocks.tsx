/**
 * Type-safe mocks for Framer Motion to simplify component testing
 * Strips animation logic while preserving component structure
 */

import type { ComponentProps, ReactNode } from "react";

/**
 * Type-safe motion component props
 */
type MotionDivProps = ComponentProps<"div"> & {
  children?: ReactNode;
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  transition?: Record<string, unknown>;
  whileHover?: Record<string, unknown>;
  whileTap?: Record<string, unknown>;
};

type MotionLineProps = ComponentProps<"line"> & {
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  transition?: Record<string, unknown>;
};

type MotionCircleProps = ComponentProps<"circle"> & {
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  transition?: Record<string, unknown>;
};

type MotionGProps = ComponentProps<"g"> & {
  children?: ReactNode;
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  transition?: Record<string, unknown>;
};

/**
 * Mock Framer Motion components that render as plain DOM elements
 * Strips animation props while preserving all other attributes
 */
export const mockFramerMotion = {
  /**
   * Mock motion.div component
   */
  div: ({
    children,
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileTap,
    ...rest
  }: MotionDivProps) => {
    return <div {...rest}>{children}</div>;
  },

  /**
   * Mock motion.line component
   */
  line: ({ initial, animate, exit, transition, ...rest }: MotionLineProps) => {
    return <line {...rest} />;
  },

  /**
   * Mock motion.circle component
   */
  circle: ({
    initial,
    animate,
    exit,
    transition,
    ...rest
  }: MotionCircleProps) => {
    return <circle {...rest} />;
  },

  /**
   * Mock motion.g component
   */
  g: ({
    children,
    initial,
    animate,
    exit,
    transition,
    ...rest
  }: MotionGProps) => {
    return <g {...rest}>{children}</g>;
  },
};

/**
 * Mock AnimatePresence component (pass-through)
 */
export function MockAnimatePresence({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * Setup function to apply all Framer Motion mocks
 * Call this in vi.mock() blocks or test setup
 */
export function setupFramerMotionMocks() {
  return {
    motion: mockFramerMotion,
    AnimatePresence: MockAnimatePresence,
  };
}
