/**
 * ZapExecutionProgress Component
 * Real-time progress display for UnifiedZap intent execution
 * Shows progress bar, current step, and execution details
 */

"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useUnifiedZapStream, type UnifiedZapStreamEvent } from "../../hooks/useUnifiedZapStream";
import { formatCurrency } from "../../lib/formatters";

export interface ZapExecutionProgressProps {
  intentId: string;
  totalValue: number;
  strategyCount: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

// Step display configuration with enhanced details
const STEP_CONFIG = {
  connected: {
    title: "Initializing",
    description: "Connecting to execution service",
    icon: "🔌",
    order: 0,
    color: "blue",
  },
  strategy_parsing: {
    title: "Parsing Strategies",
    description: "Analyzing strategy allocations",
    icon: "📊",
    order: 1,
    color: "purple",
  },
  token_analysis: {
    title: "Token Analysis",
    description: "Analyzing token requirements",
    icon: "🔍",
    order: 2,
    color: "indigo",
  },
  swap_preparation: {
    title: "Swap Preparation",
    description: "Preparing token swaps",
    icon: "🔄",
    order: 3,
    color: "cyan",
  },
  transaction_building: {
    title: "Building Transactions",
    description: "Constructing protocol transactions",
    icon: "⚙️",
    order: 4,
    color: "orange",
  },
  gas_estimation: {
    title: "Gas Estimation",
    description: "Calculating gas costs",
    icon: "⛽",
    order: 5,
    color: "yellow",
  },
  final_assembly: {
    title: "Final Assembly",
    description: "Finalizing transaction bundle",
    icon: "📦",
    order: 6,
    color: "green",
  },
  complete: {
    title: "Complete",
    description: "All operations completed successfully",
    icon: "✅",
    order: 7,
    color: "emerald",
  },
  error: {
    title: "Error",
    description: "Execution encountered an error",
    icon: "❌",
    order: -1,
    color: "red",
  },
};

// Step timeline component
function StepTimeline({ 
  events, 
  currentStep, 
  isComplete, 
  hasError 
}: {
  events: UnifiedZapStreamEvent[];
  currentStep: string | null;
  isComplete: boolean;
  hasError: boolean;
}) {
  const allSteps = Object.entries(STEP_CONFIG)
    .filter(([key]) => key !== 'error')
    .sort(([, a], [, b]) => a.order - b.order);

  const getStepStatus = (stepKey: string) => {
    if (hasError) return 'error';
    if (isComplete) return 'completed';
    if (stepKey === currentStep) return 'active';
    
    // Check if this step was completed in previous events
    const stepCompleted = events.some(event => 
      event.type === stepKey && event.progress > 0.8
    );
    
    return stepCompleted ? 'completed' : 'pending';
  };

  return (
    <div className="flex items-center justify-between py-4">
      {allSteps.map(([stepKey, config], index) => {
        const status = getStepStatus(stepKey);
        const isLast = index === allSteps.length - 1;
        
        return (
          <div key={stepKey} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  status === 'completed'
                    ? 'bg-green-500 text-white'
                    : status === 'active'
                    ? 'bg-purple-500 text-white animate-pulse'
                    : status === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {status === 'completed' ? '✓' : config.icon}
              </div>
              <span className={`text-xs mt-1 text-center max-w-16 ${
                status === 'active' ? 'text-purple-600 font-medium' : 'text-gray-500'
              }`}>
                {config.title.split(' ')[0]}
              </span>
            </div>
            
            {/* Connector Line */}
            {!isLast && (
              <div className="flex-1 h-0.5 mx-2 bg-gray-200 relative">
                <div
                  className={`h-full transition-all duration-500 ${
                    status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ width: status === 'completed' ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
    events,
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
  const [showStepTimeline, setShowStepTimeline] = useState(true);
  const [showLiveStats, setShowLiveStats] = useState(true);
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
      <div className="space-y-6">
        {/* Current Step */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <span className="text-2xl">{currentStepConfig.icon}</span>
            {currentStep === latestEvent?.type && !isComplete && !hasError && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
            )}
          </div>
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

        {/* Enhanced Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <motion.div
              className={`h-3 rounded-full bg-gradient-to-r ${
                hasError 
                  ? 'from-red-500 to-red-600'
                  : isComplete
                  ? 'from-green-500 to-green-600'
                  : 'from-purple-500 to-blue-600'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            {/* Progress glow effect */}
            <motion.div
              className="absolute top-0 h-3 rounded-full bg-white opacity-30"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="font-medium">{progressPercentage}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Step Timeline */}
        {showStepTimeline && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-medium text-gray-700">Execution Steps</h5>
              <button
                onClick={() => setShowStepTimeline(!showStepTimeline)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {showStepTimeline ? 'Hide' : 'Show'} Timeline
              </button>
            </div>
            <StepTimeline 
              events={events}
              currentStep={currentStep}
              isComplete={isComplete}
              hasError={hasError}
            />
          </div>
        )}

        {/* Basic Execution Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
          <span>Elapsed: {formatElapsedTime(elapsedTime)}</span>
          <span>Intent ID: {intentId.slice(-8)}</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Error Display */}
        {hasError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                <span className="text-red-500">❌</span>
              </div>
              <div>
                <h4 className="font-medium text-red-800">Execution Error</h4>
                <p className="text-xs text-red-600">
                  {latestEvent?.error?.code && `Error Code: ${latestEvent.error.code}`}
                </p>
              </div>
            </div>
            <p className="text-sm text-red-700 mt-3">
              {error || latestEvent?.error?.message || "Unknown error occurred"}
            </p>
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={reconnect}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Retry Connection
              </button>
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 underline"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Success Display */}
        {isComplete && !hasError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                <motion.span 
                  className="text-green-500 text-xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  ✅
                </motion.span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
