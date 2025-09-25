/**
 * ZapExecutionProgress Component
 * Real-time progress display for UnifiedZap intent execution
 * Shows progress bar, current step, and execution details
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { formatCurrency } from "../../lib/formatters";
import { useUnifiedZapStream } from "../../hooks/useUnifiedZapStream";

export interface ZapExecutionProgressProps {
  intentId: string;
  totalValue: number;
  strategyCount: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

// Step display configuration
const STEP_CONFIG = {
  connected: {
    title: "Initializing",
    description: "Connecting to execution service",
    icon: "🔌",
  },
  strategy_parsing: {
    title: "Parsing Strategies",
    description: "Analyzing strategy allocations",
    icon: "📊",
  },
  token_analysis: {
    title: "Token Analysis",
    description: "Analyzing token requirements",
    icon: "🔍",
  },
  swap_preparation: {
    title: "Swap Preparation",
    description: "Preparing token swaps",
    icon: "🔄",
  },
  transaction_building: {
    title: "Building Transactions",
    description: "Constructing protocol transactions",
    icon: "⚙️",
  },
  gas_estimation: {
    title: "Gas Estimation",
    description: "Calculating gas costs",
    icon: "⛽",
  },
  final_assembly: {
    title: "Final Assembly",
    description: "Finalizing transaction bundle",
    icon: "📦",
  },
  complete: {
    title: "Complete",
    description: "All operations completed successfully",
    icon: "✅",
  },
  error: {
    title: "Error",
    description: "Execution encountered an error",
    icon: "❌",
  },
};

export function ZapExecutionProgress({
  intentId,
  totalValue,
  strategyCount,
  onComplete,
  onError,
  onCancel,
  className = "",
}: ZapExecutionProgressProps) {
  const {
    latestEvent,
    isConnected,
    isComplete,
    hasError,
    progress,
    currentStep,
    error,
    closeStream,
    reconnect,
  } = useUnifiedZapStream(intentId);

  const [showDetails, setShowDetails] = useState(false);
  const [executionStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - executionStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [executionStartTime]);

  // Handle completion
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  // Handle errors
  useEffect(() => {
    if (hasError && onError) {
      const errorMessage =
        error || latestEvent?.error?.message || "Unknown error occurred";
      onError(errorMessage);
    }
  }, [hasError, error, latestEvent?.error?.message, onError]);

  const handleCancel = () => {
    closeStream();
    if (onCancel) {
      onCancel();
    }
  };

  const currentStepConfig = currentStep
    ? STEP_CONFIG[currentStep as keyof typeof STEP_CONFIG] ||
      STEP_CONFIG.connected
    : STEP_CONFIG.connected;

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const progressPercentage = Math.round(progress * 100);

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}
      data-testid="zap-execution-progress"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full text-white text-lg">
            🚀
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              UnifiedZap Execution
            </h3>
            <p className="text-sm text-gray-600">
              {formatCurrency(totalValue)} • {strategyCount} strategies
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Connection status */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-500">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Cancel button */}
          {!isComplete && !hasError && (
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 text-sm"
              data-testid="cancel-button"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-4">
        {/* Current Step */}
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{currentStepConfig.icon}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                {currentStepConfig.title}
              </h4>
              <span className="text-sm font-medium text-purple-600">
                {progressPercentage}%
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {currentStepConfig.description}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Execution Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Elapsed: {formatElapsedTime(elapsedTime)}</span>
          <span>Intent ID: {intentId.slice(-8)}</span>
        </div>

        {/* Metadata Display */}
        {latestEvent?.metadata && (
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <span>{showDetails ? "Hide" : "Show"} Details</span>
              <span
                className={`transform transition-transform ${showDetails ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2 text-sm">
                    {latestEvent.metadata.totalStrategies && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Strategies:</span>
                        <span className="text-gray-900">
                          {latestEvent.metadata.processedStrategies || 0} /{" "}
                          {latestEvent.metadata.totalStrategies}
                        </span>
                      </div>
                    )}
                    {latestEvent.metadata.totalProtocols && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Protocols:</span>
                        <span className="text-gray-900">
                          {latestEvent.metadata.processedProtocols || 0} /{" "}
                          {latestEvent.metadata.totalProtocols}
                        </span>
                      </div>
                    )}
                    {latestEvent.metadata.estimatedDuration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Duration:</span>
                        <span className="text-gray-900">
                          {latestEvent.metadata.estimatedDuration}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Error Display */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">❌</span>
              <h4 className="font-medium text-red-800">Execution Error</h4>
            </div>
            <p className="text-sm text-red-700 mt-2">
              {error || latestEvent?.error?.message || "Unknown error occurred"}
            </p>
            {latestEvent?.error?.code && (
              <p className="text-xs text-red-600 mt-1">
                Error Code: {latestEvent.error.code}
              </p>
            )}
            <button
              onClick={reconnect}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Success Display */}
        {isComplete && !hasError && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <h4 className="font-medium text-green-800">Execution Complete</h4>
            </div>
            <p className="text-sm text-green-700 mt-2">
              All strategies have been successfully allocated. Check your wallet
              for the transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
