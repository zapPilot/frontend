"use client";

import React, { ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { logger } from "@/utils/logger";

const asyncErrorLogger = logger.createContextLogger("AsyncErrorBoundary");

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  resetKeys?: Array<string | number>;
}

/**
 * Enhanced Error Boundary that works with React Query and async operations
 * Automatically resets when queries are reset
 */
export function AsyncErrorBoundary({
  children,
  fallback,
  onError,
  resetKeys,
}: AsyncErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            onError?.(error);
            asyncErrorLogger.error("AsyncErrorBoundary caught error", {
              error,
              errorInfo,
            });
          }}
          resetKeys={resetKeys || []}
          resetOnPropsChange={true}
          fallback={
            fallback || (
              <AsyncErrorFallback
                onReset={reset}
                onReload={() => window.location.reload()}
              />
            )
          }
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

/**
 * Default fallback component for async errors
 */
function AsyncErrorFallback({
  onReset,
  onReload,
}: {
  onReset: () => void;
  onReload: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Something went wrong
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          An error occurred while loading data. Please try again.
        </p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={onReset}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try again
        </button>
        <button
          onClick={onReload}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
