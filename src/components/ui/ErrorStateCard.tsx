"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { BaseCard } from "./BaseCard";

interface ErrorStateCardProps {
  message: string;
  details?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorStateCard({
  message,
  details,
  onRetry,
  isRetrying = false,
}: ErrorStateCardProps) {
  return (
    <BaseCard variant="glass" className="p-6">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-red-400 mb-4">{message}</p>
        {details && <p className="text-gray-500 text-sm mb-4">{details}</p>}
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`}
            />
            Retry
          </button>
        )}
      </div>
    </BaseCard>
  );
}
