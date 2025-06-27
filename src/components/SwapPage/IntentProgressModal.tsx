"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Zap,
  RefreshCw,
  FileText,
  DollarSign,
} from "lucide-react";
import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { GlassCard } from "../ui";

interface IntentStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "pending" | "in_progress" | "completed" | "error";
  estimatedTime: number; // in seconds
  details?: string;
}

interface IntentProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: {
    name: string;
    color: string;
  };
  amount: string;
  fromToken: string;
  showDetailed?: boolean;
}

const IntentProgressModalComponent = ({
  isOpen,
  onClose,
  strategy,
  amount,
  fromToken,
  showDetailed = true,
}: IntentProgressModalProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  const steps: IntentStep[] = useMemo(
    () => [
      {
        id: "analyze",
        title: "Analyzing Intent",
        description: "Understanding your investment strategy requirements",
        icon: RefreshCw,
        status: "pending",
        estimatedTime: 2,
        details: "Parsing swap parameters and strategy allocation",
      },
      {
        id: "simulate",
        title: "Simulating Transactions",
        description: "Testing transaction paths and gas optimization",
        icon: Shield,
        status: "pending",
        estimatedTime: 4,
        details: "Estimating gas costs and validating liquidity",
      },
      {
        id: "approve",
        title: "Preparing Approvals",
        description: "Setting up token approvals and permissions",
        icon: CheckCircle,
        status: "pending",
        estimatedTime: 3,
        details: "Generating approval transactions for DEX contracts",
      },
      {
        id: "route",
        title: "Finding Best Routes",
        description: "Optimizing swap routes across multiple DEXs",
        icon: ArrowRight,
        status: "pending",
        estimatedTime: 5,
        details: "Comparing Uniswap, Curve, Balancer routes",
      },
      {
        id: "liquidity",
        title: "Providing Liquidity",
        description: "Adding assets to selected liquidity pools",
        icon: DollarSign,
        status: "pending",
        estimatedTime: 4,
        details: "Depositing to Aave, Compound, and Yearn vaults",
      },
      {
        id: "batch",
        title: "Batching Transactions",
        description: "Combining all operations into efficient batch",
        icon: FileText,
        status: "pending",
        estimatedTime: 2,
        details: "Creating multicall transaction for gas savings",
      },
    ],
    []
  );

  const [stepStates, setStepStates] = useState<IntentStep[]>(steps);

  const totalEstimatedTime = steps.reduce(
    (sum, step) => sum + step.estimatedTime,
    0
  );

  const updateStepStatus = useCallback(
    (index: number, status: IntentStep["status"]) => {
      setStepStates(prev =>
        prev.map((step, i) => (i === index ? { ...step, status } : step))
      );
    },
    []
  );

  const simulateProgress = useCallback(async () => {
    setCurrentStepIndex(0);
    setProgress(0);
    setIsComplete(false);
    setHasError(false);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      updateStepStatus(i, "in_progress");

      // Simulate step duration
      const stepDuration = steps[i]!.estimatedTime * 1000;
      const progressIncrement = 100 / steps.length / (stepDuration / 100);

      for (let j = 0; j < stepDuration / 100; j++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setProgress(prev =>
          Math.min(prev + progressIncrement, (i + 1) * (100 / steps.length))
        );
      }

      // Small chance of error for demonstration
      if (Math.random() < 0.1 && i === 3) {
        updateStepStatus(i, "error");
        setHasError(true);

        // Auto-retry after 2 seconds
        setTimeout(() => {
          setHasError(false);
          updateStepStatus(i, "in_progress");
          // Continue simulation...
        }, 2000);

        return;
      }

      updateStepStatus(i, "completed");
    }

    setProgress(100);
    setIsComplete(true);
  }, [steps, updateStepStatus]);

  useEffect(() => {
    if (isOpen) {
      simulateProgress();
    } else {
      // Reset state when modal closes
      setStepStates(steps);
      setCurrentStepIndex(0);
      setProgress(0);
      setIsComplete(false);
      setHasError(false);
    }
  }, [isOpen, simulateProgress, steps]);

  const handleClose = useCallback(() => {
    if (isComplete || hasError) {
      onClose();
    }
  }, [isComplete, hasError, onClose]);

  const getStatusIcon = (status: IntentStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "in_progress":
        return <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStyle = (status: IntentStep["status"], isActive: boolean) => {
    if (status === "completed") {
      return "border-green-500/50 bg-green-900/20";
    }
    if (status === "in_progress" || isActive) {
      return "border-purple-500/50 bg-purple-900/20";
    }
    if (status === "error") {
      return "border-red-500/50 bg-red-900/20";
    }
    return "border-gray-700 bg-gray-900/20";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-lg flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <GlassCard className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-r ${strategy.color} flex items-center justify-center`}
                >
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Processing Intent
                  </h2>
                  <p className="text-sm text-gray-400">
                    {amount} {fromToken} → {strategy.name}
                  </p>
                </div>
              </div>
              {(isComplete || hasError) && (
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              )}
            </div>

            {/* Overall Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">
                  {isComplete
                    ? "Complete!"
                    : hasError
                      ? "Retrying..."
                      : "Processing..."}
                </span>
                <span className="text-sm text-gray-400">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full rounded-full ${
                    hasError
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : isComplete
                        ? "bg-gradient-to-r from-green-500 to-green-600"
                        : "bg-gradient-to-r from-purple-500 to-blue-500"
                  }`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Started</span>
                <span>Est. {totalEstimatedTime}s</span>
              </div>
            </div>

            {showDetailed ? (
              /* Detailed Progress Steps */
              <div className="space-y-3">
                {stepStates.map((step, index) => {
                  const isActive = index === currentStepIndex;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border transition-all duration-200 ${getStepStyle(step.status, isActive)}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(step.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4
                              className={`font-medium ${
                                step.status === "completed"
                                  ? "text-green-300"
                                  : step.status === "in_progress" || isActive
                                    ? "text-purple-300"
                                    : step.status === "error"
                                      ? "text-red-300"
                                      : "text-gray-300"
                              }`}
                            >
                              {step.title}
                            </h4>
                            {isActive && (
                              <span className="px-2 py-1 text-xs bg-purple-600/30 text-purple-300 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {step.description}
                          </p>
                          {step.details &&
                            (step.status === "in_progress" || isActive) && (
                              <p className="text-xs text-gray-500 mt-1">
                                {step.details}
                              </p>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {step.estimatedTime}s
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Simple Progress Display */
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-4"
                >
                  <Loader2 className="w-full h-full text-purple-400" />
                </motion.div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {stepStates[currentStepIndex]?.title || "Processing..."}
                </h3>
                <p className="text-gray-400">
                  {stepStates[currentStepIndex]?.description ||
                    "Please wait while we process your intent"}
                </p>
              </div>
            )}

            {/* Status Messages */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-green-900/30 border border-green-500/30"
              >
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Intent Executed Successfully!
                  </span>
                </div>
                <p className="text-sm text-green-300 mt-1">
                  Your transactions are ready to sign. You&apos;ll be prompted
                  to confirm each transaction in your wallet.
                </p>
              </motion.div>
            )}

            {hasError && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-red-900/30 border border-red-500/30"
              >
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Processing Delayed</span>
                </div>
                <p className="text-sm text-red-300 mt-1">
                  Network congestion detected. Retrying with higher gas
                  prices...
                </p>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const IntentProgressModal = memo(IntentProgressModalComponent);
