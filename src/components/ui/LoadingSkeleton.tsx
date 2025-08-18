import React from "react";
import { motion } from "framer-motion";

export interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  lines?: number;
  spacing?: string;
  "data-testid"?: string;
}

/**
 * Skeleton loading placeholder component
 */
export function LoadingSkeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  lines = 1,
  spacing = "mb-2",
  "data-testid": dataTestId = "loading-skeleton",
}: LoadingSkeletonProps) {
  const baseClasses = "bg-gray-200 animate-pulse";

  const variantClasses = {
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
      <div className={className} data-testid={dataTestId}>
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
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      data-testid={dataTestId}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/**
 * Skeleton for card content
 */
export function CardSkeleton({
  className = "",
  "data-testid": dataTestId = "card-skeleton",
}: {
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div className={`p-6 ${className}`} data-testid={dataTestId}>
      <LoadingSkeleton
        variant="text"
        height={24}
        className="mb-4"
        width="60%"
      />
      <LoadingSkeleton variant="text" lines={3} spacing="mb-3" />
      <div className="flex space-x-4 mt-6">
        <LoadingSkeleton variant="rounded" width={80} height={32} />
        <LoadingSkeleton variant="rounded" width={80} height={32} />
      </div>
    </div>
  );
}

/**
 * Skeleton for portfolio metrics
 */
export function MetricsSkeleton({
  className = "",
  "data-testid": dataTestId = "metrics-skeleton",
}: {
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}
      data-testid={dataTestId}
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="text-center">
          <LoadingSkeleton
            variant="text"
            height={32}
            className="mb-2"
            width="70%"
          />
          <LoadingSkeleton variant="text" height={16} width="50%" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for portfolio pie chart
 */
export function ChartSkeleton({
  className = "",
  "data-testid": dataTestId = "chart-skeleton",
}: {
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center ${className}`}
      data-testid={dataTestId}
    >
      <LoadingSkeleton
        variant="circular"
        width={200}
        height={200}
        className="mb-6"
      />
      <div className="w-full space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3">
            <LoadingSkeleton variant="circular" width={12} height={12} />
            <LoadingSkeleton variant="text" height={16} width="30%" />
            <LoadingSkeleton
              variant="text"
              height={16}
              width="20%"
              className="ml-auto"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
