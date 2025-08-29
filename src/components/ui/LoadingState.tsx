import React from "react";
import { LoadingCard } from "./LoadingCard";
import {
  CardSkeleton,
  ChartSkeleton,
  LoadingSkeleton,
  MetricsSkeleton,
} from "./LoadingSkeleton";
import { LoadingSpinner } from "./LoadingSpinner";

export interface LoadingStateProps {
  variant?: "spinner" | "card" | "skeleton" | "inline";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  message?: string;
  className?: string;
  skeletonType?: "card" | "metrics" | "chart" | "text";
  lines?: number;
}

/**
 * Unified loading state component that can render different loading UI patterns
 */
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
            <LoadingSpinner size={size} color="primary" />
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
          {skeletonType === "text" && (
            <LoadingSkeleton variant="text" lines={lines} />
          )}
        </div>
      );

    case "inline":
      return (
        <div className={`inline-flex items-center space-x-2 ${className}`}>
          <LoadingSpinner size={size} color="primary" />
          {message && <span className="text-sm text-gray-400">{message}</span>}
        </div>
      );

    default:
      return (
        <div className={`flex items-center justify-center p-8 ${className}`}>
          <LoadingSpinner size={size} color="primary" />
        </div>
      );
  }
}

/**
 * Higher-order component to show loading state while data is loading
 */
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

/**
 * Loading skeleton specifically for wallet metrics
 */
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
          <LoadingSkeleton variant="circular" width={16} height={16} />
          <LoadingSkeleton variant="rectangular" width={64} height={24} />
        </>
      )}
      {showPercentage && (
        <LoadingSkeleton variant="rectangular" width={96} height={24} />
      )}
    </div>
  );
}

/**
 * Loading skeleton for asset category rows
 */
export function AssetCategorySkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <LoadingSkeleton variant="circular" width={16} height={16} />
          <div className="space-y-2">
            <LoadingSkeleton variant="rectangular" width={96} height={16} />
            <LoadingSkeleton variant="rectangular" width={64} height={12} />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right space-y-2">
            <LoadingSkeleton variant="rectangular" width={80} height={16} />
            <LoadingSkeleton variant="rectangular" width={48} height={12} />
          </div>
          <LoadingSkeleton variant="rectangular" width={20} height={20} />
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to get appropriate loading component based on context
 */
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
