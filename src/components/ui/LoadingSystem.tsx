import React from "react";
import { motion } from "framer-motion";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type LoadingSize = "xs" | "sm" | "md" | "lg" | "xl";
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

export type SpinnerVariant = "default" | "dots" | "pulse";
export type SkeletonVariant = "text" | "circular" | "rectangular" | "rounded";

export interface BaseLoadingProps {
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  "data-testid"?: string;
}

export interface SpinnerProps extends BaseLoadingProps {
  size?: LoadingSize;
  color?: LoadingColor;
  variant?: SpinnerVariant;
  label?: string;
}

export interface SkeletonProps extends BaseLoadingProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  spacing?: string;
}

export interface LoadingWrapperProps {
  isLoading: boolean;
  loadingComponent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// =============================================================================
// CONSTANTS & STYLES
// =============================================================================

const sizeClasses: Record<LoadingSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const colorClasses: Record<LoadingColor, string> = {
  primary: "text-blue-600",
  secondary: "text-gray-600",
  blue: "text-blue-600",
  white: "text-white",
  gray: "text-gray-400",
  green: "text-green-600",
  success: "text-green-600",
  red: "text-red-600",
  warning: "text-yellow-600",
};

// =============================================================================
// SPINNER COMPONENT
// =============================================================================

export function Spinner({
  size = "md",
  color = "primary",
  variant = "default",
  className = "",
  label = "Loading",
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  "data-testid": testId = "loading-spinner",
}: SpinnerProps) {
  const finalAriaLabel = ariaLabel || label;
  const isHidden = ariaHidden === true || ariaHidden === "true";

  const containerProps = {
    className: `inline-flex items-center ${sizeClasses[size]} ${className}`,
    "data-testid": testId,
    "data-size": size,
    ...(!isHidden && { role: "status", "aria-label": finalAriaLabel }),
    ...(isHidden && { "aria-hidden": ariaHidden }),
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
        <span className="sr-only">{label}</span>
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
        <span className="sr-only">{label}</span>
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
      <span className="sr-only">{label}</span>
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
  "aria-label": ariaLabel = "Loading content",
  "data-testid": testId = "loading-skeleton",
}: SkeletonProps) {
  const baseClasses = "bg-gray-200 animate-pulse";

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
                  : style["width"] || "100%",
            }}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.1,
            }}
          />
        ))}
        <span className="sr-only">{ariaLabel}</span>
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
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <span className="sr-only">{ariaLabel}</span>
    </motion.div>
  );
}

// =============================================================================
// SPECIALIZED LOADING COMPONENTS
// =============================================================================

export function CardSkeleton({
  className = "",
  "data-testid": testId = "card-skeleton",
}: {
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div className={`p-6 ${className}`} data-testid={testId}>
      <Skeleton variant="text" height={24} className="mb-4" width="60%" />
      <Skeleton variant="text" lines={3} spacing="mb-3" />
      <div className="flex space-x-4 mt-6">
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </div>
  );
}

export function MetricsSkeleton({
  className = "",
  "data-testid": testId = "metrics-skeleton",
}: {
  className?: string;
  "data-testid"?: string;
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

export function ChartSkeleton({
  size = 200,
  className = "",
  "data-testid": testId = "chart-skeleton",
}: {
  size?: number;
  className?: string;
  "data-testid"?: string;
}) {
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
      <div className="w-full space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
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
    </motion.div>
  );
}

export function ButtonSkeleton({
  width = "120px",
  height = 40,
  className = "",
}: {
  width?: string | number;
  height?: number;
  className?: string;
}) {
  return (
    <Skeleton
      variant="rounded"
      width={width}
      height={height}
      className={className}
      data-testid="button-skeleton"
    />
  );
}

export function BalanceSkeleton({
  size = "default",
  className = "",
}: {
  size?: "small" | "default" | "large";
  className?: string;
}) {
  const heights = {
    small: 24,
    default: 32,
    large: 48,
  };

  return (
    <Skeleton
      variant="text"
      width={128}
      height={heights[size]}
      className={className}
      data-testid="balance-skeleton"
      aria-label="Loading balance"
    />
  );
}

// =============================================================================
// LOADING WRAPPER
// =============================================================================

export function LoadingWrapper({
  isLoading,
  loadingComponent,
  children,
  className = "",
}: LoadingWrapperProps) {
  if (isLoading) {
    return (
      <div className={className}>
        {loadingComponent || <Skeleton variant="text" />}
      </div>
    );
  }

  return <>{children}</>;
}

// =============================================================================
// SPECIALIZED LEGACY COMPONENTS
// =============================================================================

export function WalletMetricsSkeleton({
  className = "",
  showValue = true,
  showPercentage = false,
}: {
  className?: string;
  showValue?: boolean;
  showPercentage?: boolean;
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showValue && (
        <>
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton variant="rectangular" width={64} height={24} />
        </>
      )}
      {showPercentage && (
        <Skeleton variant="rectangular" width={96} height={24} />
      )}
    </div>
  );
}

export function AssetCategorySkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton variant="circular" width={16} height={16} />
          <div className="space-y-2">
            <Skeleton variant="rectangular" width={96} height={16} />
            <Skeleton variant="rectangular" width={64} height={12} />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right space-y-2">
            <Skeleton variant="rectangular" width={80} height={16} />
            <Skeleton variant="rectangular" width={48} height={12} />
          </div>
          <Skeleton variant="rectangular" width={20} height={20} />
        </div>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  variant?: "spinner" | "card" | "skeleton" | "inline";
  size?: LoadingSize;
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
      return <CardSkeleton className={className} />;

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

export function withLoadingState<P extends object>(
  Component: React.ComponentType<P>,
  loadingProps?: Omit<LoadingStateProps, "className">
) {
  return function LoadingWrappedComponent(
    props: P & { isLoading?: boolean; className?: string }
  ) {
    const { isLoading, className, ...componentProps } = props;

    if (isLoading) {
      return <LoadingState {...loadingProps} className={className || ""} />;
    }

    return <Component {...(componentProps as P)} />;
  };
}

export function useLoadingComponent(
  context: "page" | "card" | "inline" | "chart"
) {
  switch (context) {
    case "page":
      const PageLoadingComponent = (props: Partial<LoadingStateProps>) => (
        <LoadingState variant="card" size="lg" {...props} />
      );
      PageLoadingComponent.displayName = "PageLoadingComponent";
      return PageLoadingComponent;
    case "card":
      const CardLoadingComponent = (props: Partial<LoadingStateProps>) => (
        <LoadingState variant="skeleton" skeletonType="card" {...props} />
      );
      CardLoadingComponent.displayName = "CardLoadingComponent";
      return CardLoadingComponent;
    case "inline":
      const InlineLoadingComponent = (props: Partial<LoadingStateProps>) => (
        <LoadingState variant="inline" size="sm" {...props} />
      );
      InlineLoadingComponent.displayName = "InlineLoadingComponent";
      return InlineLoadingComponent;
    case "chart":
      const ChartLoadingComponent = (props: Partial<LoadingStateProps>) => (
        <LoadingState variant="skeleton" skeletonType="chart" {...props} />
      );
      ChartLoadingComponent.displayName = "ChartLoadingComponent";
      return ChartLoadingComponent;
    default:
      const DefaultLoadingComponent = (props: Partial<LoadingStateProps>) => (
        <LoadingState variant="spinner" {...props} />
      );
      DefaultLoadingComponent.displayName = "DefaultLoadingComponent";
      return DefaultLoadingComponent;
  }
}

// =============================================================================
// LEGACY COMPATIBILITY EXPORTS
// =============================================================================

// Maintain backwards compatibility
export const LoadingSpinner = Spinner;
export const LoadingSkeleton = Skeleton;
export const UnifiedLoading = Skeleton; // UnifiedLoading maps to Skeleton
export const LoadingButton = ButtonSkeleton;
export const LoadingCard = CardSkeleton;
