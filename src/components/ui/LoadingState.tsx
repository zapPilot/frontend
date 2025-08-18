import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { LoadingCard } from "./LoadingCard";
import {
  LoadingSkeleton,
  CardSkeleton,
  MetricsSkeleton,
  ChartSkeleton,
} from "./LoadingSkeleton";

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
            <LoadingSpinner size={size} />
            {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
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
          <LoadingSpinner size={size} />
          {message && <span className="text-sm text-gray-600">{message}</span>}
        </div>
      );

    default:
      return (
        <div className={`flex items-center justify-center p-8 ${className}`}>
          <LoadingSpinner size={size} />
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
