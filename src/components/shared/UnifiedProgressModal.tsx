"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { GlassCard } from "../ui";
import { Z_INDEX } from "@/constants/design-system";

// Base step interface
interface BaseStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "pending" | "in_progress" | "completed" | "error";
  estimatedTime: number; // in seconds
  details?: string;
  txHash?: string;
}

// Config interfaces
export interface IntentConfig {
  strategy: {
    name: string;
    color: string;
  };
  amount: string;
  fromToken: string;
}

export interface OptimizationConfig {
  options: {
    convertDust: boolean;
    rebalancePortfolio: boolean;
    slippage: number;
  };
  mockData: {
    dustValue: number;
    dustTokenCount: number;
    rebalanceActions: number;
    chainCount: number;
    totalSavings: number;
  };
}

export interface UnifiedProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "intent" | "optimization";
  config: IntentConfig | OptimizationConfig;
  showDetailed?: boolean;
}

const UnifiedProgressModalComponent = ({
  isOpen,
  onClose,
  mode,
  config,
  showDetailed = true,
}: UnifiedProgressModalProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate steps based on mode
  const steps: BaseStep[] = useMemo(() => {
    if (mode === "intent") {
      return [
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
      ];
    } else {
      // Optimization mode
      const optimizationConfig = config as OptimizationConfig;
      const { options, mockData } = optimizationConfig;
      const steps: BaseStep[] = [];

      if (options.convertDust) {
        steps.push(
          {
            id: "analyze-dust",
            title: "Analyzing Dust Tokens",
            description: `Scanning ${mockData.dustTokenCount} tokens worth $${mockData.dustValue}`,
            icon: Settings,
            status: "pending",
            estimatedTime: 3,
            details: "Identifying and categorizing dust tokens across chains",
          },
          {
            id: "approve-dust",
            title: "Approve Token Conversions",
            description: "Signing approval transactions for token swaps",
            icon: CheckCircle,
            status: "pending",
            estimatedTime: 4,
            details: "Setting up approvals for DEX contracts",
          },
          {
            id: "convert-dust",
            title: "Converting Dust to ETH",
            description: "Executing optimized swap transactions",
            icon: ArrowRightLeft,
            status: "pending",
            estimatedTime: 5,
            details: "Batching dust conversion transactions for efficiency",
          }
        );
      }

      if (options.rebalancePortfolio) {
        steps.push(
          {
            id: "analyze-portfolio",
            title: "Analyzing Portfolio",
            description: `Calculating optimal rebalancing across ${mockData.chainCount} chains`,
            icon: TrendingUp,
            status: "pending",
            estimatedTime: 4,
            details: "Analyzing current allocations and target weights",
          },
          {
            id: "prepare-rebalance",
            title: "Preparing Rebalance Transactions",
            description: `Preparing ${mockData.rebalanceActions} rebalancing actions`,
            icon: Settings,
            status: "pending",
            estimatedTime: 3,
            details: "Optimizing cross-chain transaction sequence",
          },
          {
            id: "execute-rebalance",
            title: "Executing Rebalance",
            description: "Cross-chain portfolio optimization in progress",
            icon: RefreshCw,
            status: "pending",
            estimatedTime: 6,
            details: "Executing rebalancing transactions across protocols",
          }
        );
      }

      steps.push({
        id: "complete",
        title: "Optimization Complete",
        description: `Portfolio optimized successfully! Estimated savings: $${mockData.totalSavings}`,
        icon: CheckCircle,
        status: "pending",
        estimatedTime: 1,
        details: "Finalizing optimization and updating portfolio state",
      });

      return steps;
    }
  }, [mode, config]);

  const [stepStates, setStepStates] = useState<BaseStep[]>(steps);

  const totalEstimatedTime = steps.reduce(
    (sum, step) => sum + step.estimatedTime,
    0
  );

  const updateStepStatus = useCallback(
    (index: number, status: BaseStep["status"], txHash?: string) => {
      setStepStates(prev =>
        prev.map((step, i) =>
          i === index ? { ...step, status, ...(txHash && { txHash }) } : step
        )
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

      // Small chance of error for demonstration (mainly for intent mode)
      if (mode === "intent" && Math.random() < 0.1 && i === 3) {
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

      // Generate mock transaction hash for optimization mode
      const txHash =
        mode === "optimization"
          ? `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
          : undefined;

      updateStepStatus(i, "completed", txHash);
    }

    setProgress(100);
    setIsComplete(true);
  }, [steps, updateStepStatus, mode]);

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

  const getStatusIcon = (status: BaseStep["status"]) => {
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

  const getStepStyle = (status: BaseStep["status"], isActive: boolean) => {
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

  // Get mode-specific header information
  const getHeaderInfo = () => {
    if (mode === "intent") {
      const intentConfig = config as IntentConfig;
      return {
        title: "Processing Intent",
        subtitle: `${intentConfig.amount} ${intentConfig.fromToken} → ${intentConfig.strategy.name}`,
        color: intentConfig.strategy.color,
        icon: Zap,
      };
    } else {
      const optimizationConfig = config as OptimizationConfig;
      return {
        title: "Optimizing Portfolio",
        subtitle: `Processing ${optimizationConfig.mockData.dustTokenCount} tokens across ${optimizationConfig.mockData.chainCount} chains`,
        color: "from-purple-500 to-blue-500",
        icon: TrendingUp,
      };
    }
  };

  const headerInfo = getHeaderInfo();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 ${Z_INDEX.MODAL} bg-gray-950/90 backdrop-blur-lg flex items-center justify-center p-4`}
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
                  className={`w-10 h-10 rounded-xl bg-gradient-to-r ${headerInfo.color} flex items-center justify-center`}
                >
                  <headerInfo.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {headerInfo.title}
                  </h2>
                  <p className="text-sm text-gray-400">{headerInfo.subtitle}</p>
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
                <span>Est.{totalEstimatedTime}s</span>
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
                            {step.status === "completed" &&
                              mode === "optimization" && (
                                <span className="px-2 py-1 text-xs bg-green-600/30 text-green-300 rounded-full">
                                  Completed
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
                          {step.txHash && step.status === "completed" && (
                            <div className="mt-2 flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                Transaction:
                              </span>
                              <button className="text-xs text-blue-400 hover:text-blue-300 font-mono">
                                {step.txHash}
                              </button>
                            </div>
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
                    `Please wait while we process your ${mode === "intent" ? "intent" : "optimization"}`}
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
                    {mode === "intent"
                      ? "Intent Executed Successfully!"
                      : "Optimization Complete!"}
                  </span>
                </div>
                <p className="text-sm text-green-300 mt-1">
                  {mode === "intent"
                    ? "Your transactions are ready to sign. You'll be prompted to confirm each transaction in your wallet."
                    : "Your portfolio has been successfully optimized with improved efficiency and reduced gas costs."}
                </p>

                {/* Optimization-specific completion stats */}
                {mode === "optimization" && (
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="bg-green-900/30 p-3 rounded-lg">
                      <div className="text-lg font-bold text-green-400">
                        ${(config as OptimizationConfig).mockData.totalSavings}
                      </div>
                      <div className="text-green-300">Total Savings</div>
                    </div>
                    <div className="bg-green-900/30 p-3 rounded-lg">
                      <div className="text-lg font-bold text-green-400">
                        +2.3%
                      </div>
                      <div className="text-green-300">APR Improvement</div>
                    </div>
                  </div>
                )}
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

            {/* Network Status for Optimization Mode */}
            {mode === "optimization" && !isComplete && !hasError && (
              <div className="mt-6 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Network Status:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400">Optimal</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Est.Gas Price:</span>
                  <span className="text-white">23 gwei</span>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const UnifiedProgressModal = memo(UnifiedProgressModalComponent);
