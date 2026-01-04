import { motion, type Transition } from "framer-motion";
import React from "react";

import type {
  ComponentSize,
  LoadingVariant,
  SkeletonVariant,
  SpinnerVariant,
} from "@/types/ui/ui.types";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

type LoadingColor =
  | "primary"
  | "secondary"
  | "white"
  | "success"
  | "warning"
  | "blue"
  | "gray"
  | "green"
  | "red";

const ARIA_LABEL_PROP = "aria-label" as const;
const ARIA_HIDDEN_PROP = "aria-hidden" as const;
const DATA_TEST_ID_PROP = "data-testid" as const;
const TEXT_BLUE = "text-blue-600";
const TEXT_GRAY = "text-gray-400";
const TEXT_GRAY_DARK = "text-gray-600";
const TEXT_GREEN = "text-green-600";
const TEXT_RED = "text-red-600";
const TEXT_YELLOW = "text-yellow-600";
const TEXT_WHITE = "text-white";
const BASE_SKELETON_CLASS = "bg-gray-200 animate-pulse";
const SR_ONLY_CLASS = "sr-only";
const DEFAULT_SPINNER_LABEL = "Loading";
const DEFAULT_SKELETON_LABEL = "Loading content";
const PULSE_ANIMATION = {
  initial: { opacity: 0.6 },
  animate: { opacity: [0.6, 1, 0.6] },
};
const PULSE_EASE = [0.42, 0, 0.58, 1] as const;
const PULSE_TRANSITION = {
  duration: 1.5,
  repeat: Infinity,
  ease: PULSE_EASE,
} satisfies Transition;

interface BaseLoadingProps {
  className?: string;
  [ARIA_LABEL_PROP]?: string;
  [ARIA_HIDDEN_PROP]?: boolean | "true" | "false";
  [DATA_TEST_ID_PROP]?: string;
}

interface SpinnerProps extends BaseLoadingProps {
  size?: ComponentSize;
  color?: LoadingColor;
  variant?: SpinnerVariant;
  label?: string;
}

interface SkeletonProps extends BaseLoadingProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  spacing?: string;
}

// =============================================================================
// CONSTANTS & STYLES
// =============================================================================

const sizeClasses: Record<ComponentSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const colorClasses: Record<LoadingColor, string> = {
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

// =============================================================================
// SPINNER COMPONENT
// =============================================================================

export function Spinner({
  size = "md",
  color = "primary",
  variant = "default",
  className = "",
  label = DEFAULT_SPINNER_LABEL,
  [ARIA_LABEL_PROP]: ariaLabel,
  [ARIA_HIDDEN_PROP]: ariaHidden,
  [DATA_TEST_ID_PROP]: testId = "loading-spinner",
}: SpinnerProps) {
  const finalAriaLabel = ariaLabel ?? label;
  const isHidden = ariaHidden === true || ariaHidden === "true";

  const containerProps = {
    className: `inline-flex items-center ${sizeClasses[size]} ${className}`,
    [DATA_TEST_ID_PROP]: testId,
    "data-size": size,
    ...(!isHidden && { role: "status", [ARIA_LABEL_PROP]: finalAriaLabel }),
    ...(isHidden && { [ARIA_HIDDEN_PROP]: ariaHidden }),
  } as const;

  if (variant === "dots") {
    return (
      <div {...containerProps}>
        <div className="flex items-center space-x-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className={`w-2 h-2 ${colorClasses[color]} bg-current rounded-full`}
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <span className={SR_ONLY_CLASS}>{label}</span>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div {...containerProps}>
        <motion.div
          className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full`}
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <span className={SR_ONLY_CLASS}>{label}</span>
      </div>
    );
  }

  // Default spinner
  return (
    <div {...containerProps}>
      <motion.svg
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <circle
          className="opacity-75"
          cx="12"
          cy="12"
          r="6"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="15.708"
          strokeDashoffset="11.781"
          strokeLinecap="round"
        />
      </motion.svg>
      <span className={SR_ONLY_CLASS}>{label}</span>
    </div>
  );
}

// =============================================================================
// SKELETON COMPONENT
// =============================================================================

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

// =============================================================================
// SPECIALIZED LOADING COMPONENTS
// =============================================================================

export function CardSkeleton({
  className = "",
  [DATA_TEST_ID_PROP]: testId = "card-skeleton",
}: {
  className?: string;
  [DATA_TEST_ID_PROP]?: string;
}) {
  return (
    <div className={`p-6 ${className}`} data-testid={testId}>
      <CardSkeletonContent />
    </div>
  );
}

// Internal function used by LoadingState
function LoadingCard({
  message,
  className = "",
  [DATA_TEST_ID_PROP]: testId = "loading-card",
  [ARIA_LABEL_PROP]: ariaLabel,
}: {
  message?: string;
  className?: string;
  [DATA_TEST_ID_PROP]?: string;
  [ARIA_LABEL_PROP]?: string;
}) {
  const finalAriaLabel = ariaLabel ?? message ?? DEFAULT_SKELETON_LABEL;

  return (
    <div
      className={`p-6 ${className}`}
      data-testid={testId}
      role="status"
      aria-label={finalAriaLabel}
    >
      {message && <p className="text-sm text-gray-400 mb-4">{message}</p>}
      <CardSkeletonContent />
    </div>
  );
}

export function MetricsSkeleton({
  className = "",
  [DATA_TEST_ID_PROP]: testId = "metrics-skeleton",
}: {
  className?: string;
  [DATA_TEST_ID_PROP]?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}
      data-testid={testId}
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <motion.div
          key={index}
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Skeleton variant="text" height={32} className="mb-2" width="70%" />
          <Skeleton variant="text" height={16} width="50%" />
        </motion.div>
      ))}
    </div>
  );
}

function SkeletonLegend({ rows = 4 }: { rows?: number }) {
  return (
    <div className="w-full space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          <Skeleton variant="circular" width={12} height={12} />
          <Skeleton variant="text" height={16} width="30%" />
          <Skeleton
            variant="text"
            height={16}
            width="20%"
            className="ml-auto"
          />
        </div>
      ))}
    </div>
  );
}

function CardSkeletonContent() {
  return (
    <>
      <Skeleton variant="text" height={24} className="mb-4" width="60%" />
      <Skeleton variant="text" lines={3} spacing="mb-3" />
      <div className="flex space-x-4 mt-6">
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </>
  );
}

interface CircularSkeletonSectionProps extends BaseLoadingProps {
  size: number;
}

function CircularSkeletonSection({
  size,
  className = "",
  [DATA_TEST_ID_PROP]: testId,
}: CircularSkeletonSectionProps) {
  return (
    <motion.div
      className={`flex flex-col items-center space-y-4 ${className}`}
      data-testid={testId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Skeleton
        variant="circular"
        width={size}
        height={size}
        className="mb-6"
      />
      <SkeletonLegend />
    </motion.div>
  );
}

interface CircularSkeletonComponentProps
  extends Pick<BaseLoadingProps, "className"> {
  size?: number;
  [DATA_TEST_ID_PROP]?: string;
}

const createCircularSkeletonComponent = (
  defaultTestId: string
): React.FC<CircularSkeletonComponentProps> => {
  const Component: React.FC<CircularSkeletonComponentProps> = ({
    size = 200,
    className = "",
    [DATA_TEST_ID_PROP]: testId = defaultTestId,
  }) => (
    <CircularSkeletonSection
      size={size}
      className={className}
      data-testid={testId}
    />
  );

  return Component;
};

export const ChartSkeleton = createCircularSkeletonComponent("chart-skeleton");
ChartSkeleton.displayName = "ChartSkeleton";

interface LoadingStateProps {
  variant?: LoadingVariant;
  size?: ComponentSize;
  message?: string;
  className?: string;
  skeletonType?: "card" | "metrics" | "chart" | "text";
  lines?: number;
}

export function LoadingState({
  variant = "spinner",
  size = "md",
  message = "Loading...",
  className = "",
  skeletonType = "card",
  lines = 3,
}: LoadingStateProps) {
  switch (variant) {
    case "spinner":
      return (
        <div className={`flex items-center justify-center p-8 ${className}`}>
          <div className="text-center">
            <Spinner size={size} color="primary" />
            {message && <p className="mt-2 text-sm text-gray-400">{message}</p>}
          </div>
        </div>
      );

    case "card":
      return <LoadingCard message={message} className={className} />;

    case "skeleton":
      return (
        <div className={className}>
          {skeletonType === "card" && <CardSkeleton />}
          {skeletonType === "metrics" && <MetricsSkeleton />}
          {skeletonType === "chart" && <ChartSkeleton />}
          {skeletonType === "text" && <Skeleton variant="text" lines={lines} />}
        </div>
      );

    case "inline":
      return (
        <div className={`inline-flex items-center space-x-2 ${className}`}>
          <Spinner size={size} color="primary" />
          {message && <span className="text-sm text-gray-400">{message}</span>}
        </div>
      );

    default:
      return (
        <div className={`flex items-center justify-center p-8 ${className}`}>
          <Spinner size={size} color="primary" />
        </div>
      );
  }
}

// =============================================================================
// TOKEN LIST SKELETON
// =============================================================================

// TokenListSkeleton, AssetCategorySkeleton, LoadingWrapper, BalanceSkeleton,
// ButtonSkeleton, and PieChartSkeleton were removed as unused exports.
// They can be recovered from git history if needed.
