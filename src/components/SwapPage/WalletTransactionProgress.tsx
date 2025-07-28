"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useMemo } from "react";

interface BatchProgress {
  batchIndex: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
}

interface WalletTransactionProgressProps {
  isVisible: boolean;
  overallStatus: "idle" | "processing" | "completed" | "failed" | "cancelled";
  batches: BatchProgress[];
  currentBatch?: number;
  walletType?: string;
}

export function WalletTransactionProgress({
  isVisible,
  overallStatus,
  batches,
  currentBatch = 0,
  walletType = "wallet",
}: WalletTransactionProgressProps) {
  // Calculate batch progress
  const { completedBatches, progressPercentage } = useMemo(() => {
    const completed = batches.filter(b => b.status === "completed").length;
    const total = batches.length;
    const percentage =
      total === 0 ? 0 : Math.min(100, (completed / total) * 100);

    return { completedBatches: completed, progressPercentage: percentage };
  }, [batches]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "processing":
        return Loader2;
      case "failed":
        return XCircle;
      default:
        return Loader2;
    }
  };

  const StatusIcon = getStatusIcon(overallStatus);

  if (!isVisible) return null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <StatusIcon
            size={20}
            className={`${
              overallStatus === "completed"
                ? "text-green-400"
                : overallStatus === "failed"
                  ? "text-red-400"
                  : "text-blue-400"
            } ${overallStatus === "processing" ? "animate-spin" : ""}`}
          />
          <div>
            <h3 className="font-semibold text-white">Batch Progress</h3>
            <p className="text-sm text-gray-400">
              Sending batches to {walletType}
            </p>
          </div>
        </div>

        {/* Batch Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">
              Batch Progress ({completedBatches}/{batches.length} batches)
            </span>
            <span className="text-gray-400">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded h-2">
            <div
              className={`h-2 rounded ${
                overallStatus === "completed"
                  ? "bg-green-600"
                  : overallStatus === "failed"
                    ? "bg-red-600"
                    : "bg-blue-600"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Current Status */}
        {overallStatus === "processing" && (
          <div className="text-sm text-blue-400">
            Processing batch {currentBatch + 1} of {batches.length}
          </div>
        )}

        {overallStatus === "completed" && (
          <div className="text-sm text-green-400">
            All {batches.length} batches completed successfully!
          </div>
        )}

        {overallStatus === "failed" && (
          <div className="text-sm text-red-400">
            Some batches failed to process
          </div>
        )}
      </div>
    </div>
  );
}
