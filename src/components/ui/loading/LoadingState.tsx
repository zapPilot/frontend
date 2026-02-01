import type { ComponentSize, LoadingVariant } from "@/types/ui/ui.types";
import { Skeleton } from "./Skeleton";
import { Spinner } from "./Spinner";
import { CardSkeleton, LoadingCard } from "./skeletons/CardSkeleton";
import { ChartSkeleton } from "./skeletons/ChartSkeleton";
import { MetricsSkeleton } from "./skeletons/MetricsSkeleton";

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
