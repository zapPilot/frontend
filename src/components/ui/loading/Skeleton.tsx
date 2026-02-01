import { motion } from "framer-motion";

import type { SkeletonVariant } from "@/types/ui/ui.types";

import {
  ARIA_LABEL_PROP,
  BASE_SKELETON_CLASS,
  type BaseLoadingProps,
  DATA_TEST_ID_PROP,
  DEFAULT_SKELETON_LABEL,
  PULSE_ANIMATION,
  PULSE_TRANSITION,
  SR_ONLY_CLASS,
} from "./constants";

export interface SkeletonProps extends BaseLoadingProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  spacing?: string;
}

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  lines = 1,
  spacing = "mb-2",
  className = "",
  [ARIA_LABEL_PROP]: ariaLabel = DEFAULT_SKELETON_LABEL,
  [DATA_TEST_ID_PROP]: testId = "loading-skeleton",
}: SkeletonProps) {
  const baseClasses = BASE_SKELETON_CLASS;

  const variantClasses: Record<SkeletonVariant, string> = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded",
    rounded: "rounded-lg",
  };

  const style: Record<string, string | number> = {};
  if (width !== undefined) {
    style["width"] = width;
  } else if (variant === "text") {
    style["width"] = "100%";
  }

  if (height !== undefined) {
    style["height"] = height;
  } else if (variant === "circular" && width !== undefined) {
    style["height"] = width;
  }

  if (lines > 1) {
    return (
      <div
        className={className}
        data-testid={testId}
        role="status"
        aria-label={ariaLabel}
        data-variant={variant}
        data-lines={lines}
      >
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} ${
              index < lines - 1 ? spacing : ""
            }`}
            style={{
              ...style,
              width:
                index === lines - 1 && variant === "text"
                  ? "75%"
                  : (style["width"] ?? "100%"),
            }}
            initial={PULSE_ANIMATION.initial}
            animate={PULSE_ANIMATION.animate}
            transition={{
              ...PULSE_TRANSITION,
              delay: index * 0.1,
            }}
          />
        ))}
        <span className={SR_ONLY_CLASS}>{ariaLabel}</span>
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      data-testid={testId}
      role="status"
      aria-label={ariaLabel}
      initial={PULSE_ANIMATION.initial}
      animate={PULSE_ANIMATION.animate}
      transition={PULSE_TRANSITION}
      data-variant={variant}
      data-lines={lines}
    >
      <span className={SR_ONLY_CLASS}>{ariaLabel}</span>
    </motion.div>
  );
}
