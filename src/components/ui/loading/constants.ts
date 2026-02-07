import { type Transition } from "framer-motion";

import type { ComponentSize } from "@/types/ui/ui.types";

export type LoadingColor =
  | "primary"
  | "secondary"
  | "white"
  | "success"
  | "warning"
  | "blue"
  | "gray"
  | "green"
  | "red";

export const ARIA_LABEL_PROP = "aria-label" as const;
export const ARIA_HIDDEN_PROP = "aria-hidden" as const;
export const DATA_TEST_ID_PROP = "data-testid" as const;

export const TEXT_BLUE = "text-blue-600";
export const TEXT_GRAY = "text-gray-400";
export const TEXT_GRAY_DARK = "text-gray-600";
export const TEXT_GREEN = "text-green-600";
export const TEXT_RED = "text-red-600";
export const TEXT_YELLOW = "text-yellow-600";
export const TEXT_WHITE = "text-white";

export const BASE_SKELETON_CLASS = "bg-gray-200 animate-pulse";
export const SR_ONLY_CLASS = "sr-only";

export const DEFAULT_SPINNER_LABEL = "Loading";
export const DEFAULT_SKELETON_LABEL = "Loading content";

export const PULSE_ANIMATION = {
  initial: { opacity: 0.6 },
  animate: { opacity: [0.6, 1, 0.6] },
};

export const PULSE_EASE = [0.42, 0, 0.58, 1] as const;

export const PULSE_TRANSITION = {
  duration: 1.5,
  repeat: Infinity,
  ease: PULSE_EASE,
} satisfies Transition;

export const sizeClasses: Record<ComponentSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export const colorClasses: Record<LoadingColor, string> = {
  primary: TEXT_BLUE,
  secondary: TEXT_GRAY_DARK,
  blue: TEXT_BLUE,
  white: TEXT_WHITE,
  gray: TEXT_GRAY,
  green: TEXT_GREEN,
  success: TEXT_GREEN,
  red: TEXT_RED,
  warning: TEXT_YELLOW,
};

export interface BaseLoadingProps {
  className?: string;
  [ARIA_LABEL_PROP]?: string;
  [ARIA_HIDDEN_PROP]?: boolean | "true" | "false";
  [DATA_TEST_ID_PROP]?: string;
}
