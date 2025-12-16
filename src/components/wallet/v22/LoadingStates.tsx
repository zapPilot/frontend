/**
 * Loading and Error State Components for V22 Layout
 *
 * Provides skeleton loading states, error displays, and demo mode banners
 * that match the V22 design system (glass morphism, purple gradients).
 */

import type { ReactNode } from "react";

import { InfoCircleIcon } from "@/components/icons/InfoCircleIcon";

/**
 * Loading Skeleton Component
 *
 * Displays animated skeleton matching V22 layout structure while data loads.
 * Uses glass morphism and purple gradients consistent with V22 design.
 */
export function LoadingStateV22() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-24 bg-purple-900/20 rounded-2xl backdrop-blur-sm border border-purple-500/10" />

      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-32 bg-purple-900/20 rounded-xl backdrop-blur-sm border border-purple-500/10" />
        <div className="h-32 bg-purple-900/20 rounded-xl backdrop-blur-sm border border-purple-500/10" />
        <div className="h-32 bg-purple-900/20 rounded-xl backdrop-blur-sm border border-purple-500/10" />
      </div>

      {/* Chart skeleton */}
      <div className="h-96 bg-purple-900/20 rounded-2xl backdrop-blur-sm border border-purple-500/10" />
    </div>
  );
}

/**
 * Error State Component
 *
 * Displays user-friendly error message with retry button.
 * Follows V22 design patterns for error states.
 */
export function ErrorStateV22({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 px-4">
      {/* Error icon */}
      <StatusIconCircle
        className="bg-red-500/10 border border-red-500/30"
        svgClassName="w-8 h-8 text-red-400"
        pathD="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />

      {/* Error message */}
      <div className="text-red-400 text-lg font-medium">
        Failed to load portfolio data
      </div>

      {error && (
        <div className="text-gray-400 text-sm max-w-md text-center">
          {error.message}
        </div>
      )}

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors duration-200 text-white font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Demo Mode Banner
 *
 * Displays when viewing demo wallet data (user not connected).
 * Provides context and encourages wallet connection.
 */
export function DemoModeBanner({ children }: { children: ReactNode }) {
  return (
    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <InfoIcon />

        {/* Banner content */}
        <p className="text-yellow-200 text-sm flex-1">{children}</p>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <div className="flex-shrink-0">
      <InfoCircleIcon className="w-5 h-5 text-yellow-400" />
    </div>
  );
}

function IconCircle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-16 h-16 rounded-full flex items-center justify-center ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}

function StatusIconCircle({
  className,
  svgClassName,
  pathD,
}: {
  className: string;
  svgClassName: string;
  pathD: string;
}) {
  return (
    <IconCircle className={className}>
      <svg
        className={svgClassName}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={pathD}
        />
      </svg>
    </IconCircle>
  );
}

/**
 * Empty State Component
 *
 * Displays when user has no portfolio positions.
 */
export function EmptyStateV22() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 px-4">
      {/* Empty icon */}
      <StatusIconCircle
        className="bg-gray-700/50 border border-gray-600"
        svgClassName="w-8 h-8 text-gray-400"
        pathD="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />

      {/* Empty message */}
      <div className="text-gray-300 text-lg font-medium">
        No portfolio data found
      </div>

      <div className="text-gray-400 text-sm max-w-md text-center">
        Connect a wallet with DeFi positions to see analytics
      </div>
    </div>
  );
}
