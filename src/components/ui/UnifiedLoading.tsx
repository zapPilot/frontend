import React from "react";
import { motion } from "framer-motion";
import { LoadingSkeleton } from "./LoadingSkeleton";

export interface UnifiedLoadingProps {
  /** Loading pattern type */
  variant?:
    | "skeleton-text"
    | "skeleton-metric"
    | "skeleton-chart"
    | "skeleton-button"
    | "skeleton-card"
    | "skeleton-inline";
  /** Content dimensions */
  width?: string | number;
  height?: string | number;
  /** Number of skeleton lines for text variant */
  lines?: number;
  /** Custom className */
  className?: string;
  /** Accessibility label */
  "aria-label"?: string;
  /** Test ID for testing */
  "data-testid"?: string;
}

/**
 * Unified loading component that provides consistent skeleton loading patterns
 * to replace traditional spinners across the application.
 */
export function UnifiedLoading({
  variant = "skeleton-text",
  width,
  height,
  lines = 1,
  className = "",
  "aria-label": ariaLabel = "Loading content",
  "data-testid": testId = "unified-loading",
}: UnifiedLoadingProps) {
  switch (variant) {
    case "skeleton-text":
      return (
        <div role="status" aria-label={ariaLabel} className={className}>
          <LoadingSkeleton
            variant="text"
            lines={lines}
            {...(width !== undefined && { width })}
            {...(height !== undefined ? { height } : { height: "1rem" })}
            data-testid={testId}
          />
          <span className="sr-only">{ariaLabel}</span>
        </div>
      );

    case "skeleton-metric":
      return (
        <motion.div
          role="status"
          aria-label={ariaLabel}
          className={`space-y-2 ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-testid={testId}
        >
          {/* Value skeleton */}
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          {/* Label skeleton */}
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          <span className="sr-only">{ariaLabel}</span>
        </motion.div>
      );

    case "skeleton-chart":
      return (
        <motion.div
          role="status"
          aria-label={ariaLabel}
          className={`flex items-center justify-center ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-testid={testId}
        >
          <div className="space-y-4 w-full">
            {/* Chart circle skeleton */}
            <div className="h-48 w-48 bg-gray-200 rounded-full animate-pulse mx-auto" />
            {/* Legend items skeleton */}
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <span className="sr-only">{ariaLabel}</span>
        </motion.div>
      );

    case "skeleton-button":
      return (
        <motion.div
          role="status"
          aria-label={ariaLabel}
          className={`h-10 bg-gray-200 rounded-lg animate-pulse ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          {...(width !== undefined && { style: { width } })}
          data-testid={testId}
        >
          <span className="sr-only">{ariaLabel}</span>
        </motion.div>
      );

    case "skeleton-card":
      return (
        <motion.div
          role="status"
          aria-label={ariaLabel}
          className={`p-4 border border-gray-200 rounded-lg ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-testid={testId}
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
            {/* Content lines */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
            {/* Footer */}
            <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse" />
          </div>
          <span className="sr-only">{ariaLabel}</span>
        </motion.div>
      );

    case "skeleton-inline":
      return (
        <motion.div
          role="status"
          aria-label={ariaLabel}
          className={`inline-block h-4 bg-gray-200 rounded animate-pulse ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          {...(width !== undefined && { style: { width } })}
          data-testid={testId}
        >
          <span className="sr-only">{ariaLabel}</span>
        </motion.div>
      );

    default:
      return (
        <div role="status" aria-label={ariaLabel} className={className}>
          <LoadingSkeleton
            variant="rectangular"
            {...(width !== undefined && { width })}
            {...(height !== undefined && { height })}
            data-testid={testId}
          />
          <span className="sr-only">{ariaLabel}</span>
        </div>
      );
  }
}

// Specialized loading components for common use cases

export interface BalanceLoadingProps {
  size?: "small" | "default" | "large";
  className?: string;
}

/**
 * Loading skeleton specifically for wallet balance displays
 */
export function BalanceLoading({
  size = "default",
  className = "",
}: BalanceLoadingProps) {
  const sizeClasses = {
    small: "h-6",
    default: "h-8",
    large: "h-12",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} w-32 bg-gray-200 rounded animate-pulse ${className}`}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      data-testid="balance-loading"
      role="status"
      aria-label="Loading balance"
    >
      <span className="sr-only">Loading balance</span>
    </motion.div>
  );
}

export interface PieChartLoadingProps {
  size?: number;
  className?: string;
}

/**
 * Loading skeleton for pie charts with legend
 */
export function PieChartLoading({
  size = 200,
  className = "",
}: PieChartLoadingProps) {
  return (
    <motion.div
      className={`flex flex-col items-center space-y-4 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      data-testid="pie-chart-loading"
      role="status"
      aria-label="Loading chart"
    >
      {/* Chart circle */}
      <motion.div
        className="bg-gray-200 rounded-full animate-pulse"
        style={{ width: size, height: size }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Legend items */}
      <div className="space-y-2 w-full max-w-xs">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="flex items-center space-x-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </motion.div>
        ))}
      </div>
      <span className="sr-only">Loading chart</span>
    </motion.div>
  );
}

/**
 * Loading wrapper that conditionally shows loading or content
 */
export interface LoadingWrapperProps {
  isLoading: boolean;
  loadingComponent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function LoadingWrapper({
  isLoading,
  loadingComponent,
  children,
  className = "",
}: LoadingWrapperProps) {
  if (isLoading) {
    return (
      <div className={className}>
        {loadingComponent || <UnifiedLoading variant="skeleton-text" />}
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Loading skeleton for metrics grid
 */
export function MetricsLoading({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <UnifiedLoading variant="skeleton-metric" />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for buttons
 */
export function ButtonLoading({
  width = "120px",
  className = "",
}: {
  width?: string | number;
  className?: string;
}) {
  return (
    <UnifiedLoading
      variant="skeleton-button"
      width={width}
      className={className}
    />
  );
}
