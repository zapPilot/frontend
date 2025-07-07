"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, ArrowRight, Loader2 } from "lucide-react";
import { OptimizationOptions } from "./OptimizeTab";

interface OptimizationProgressProps {
  options: OptimizationOptions;
  mockData: {
    dustValue: number;
    dustTokenCount: number;
    rebalanceActions: number;
    chainCount: number;
    totalSavings: number;
  };
}

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  txHash?: string;
}

export function OptimizationProgress({
  options,
  mockData,
}: OptimizationProgressProps) {
  const [, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<ProgressStep[]>([]);

  // Initialize steps based on selected options
  useEffect(() => {
    const initialSteps: ProgressStep[] = [];

    if (options.convertDust) {
      initialSteps.push(
        {
          id: "analyze-dust",
          title: "Analyzing Dust Tokens",
          description: `Scanning ${mockData.dustTokenCount} tokens worth $${mockData.dustValue}`,
          status: "pending",
        },
        {
          id: "approve-dust",
          title: "Approve Token Conversions",
          description: "Signing approval transactions for token swaps",
          status: "pending",
        },
        {
          id: "convert-dust",
          title: "Converting Dust to ETH",
          description: "Executing optimized swap transactions",
          status: "pending",
        }
      );
    }

    if (options.rebalancePortfolio) {
      initialSteps.push(
        {
          id: "analyze-portfolio",
          title: "Analyzing Portfolio",
          description: `Calculating optimal rebalancing across ${mockData.chainCount} chains`,
          status: "pending",
        },
        {
          id: "prepare-rebalance",
          title: "Preparing Rebalance Transactions",
          description: `Preparing ${mockData.rebalanceActions} rebalancing actions`,
          status: "pending",
        },
        {
          id: "execute-rebalance",
          title: "Executing Rebalance",
          description: "Cross-chain portfolio optimization in progress",
          status: "pending",
        }
      );
    }

    initialSteps.push({
      id: "complete",
      title: "Optimization Complete",
      description: `Portfolio optimized successfully! Estimated savings: $${mockData.totalSavings}`,
      status: "pending",
    });

    setSteps(initialSteps);
  }, [options, mockData]);

  // Simulate progress
  useEffect(() => {
    if (steps.length === 0) return;

    const interval = setInterval(() => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];

        // Find first non-completed step
        const currentIndex = newSteps.findIndex(
          step => step.status === "pending" || step.status === "in_progress"
        );

        if (currentIndex === -1) return newSteps; // All completed

        const currentStep = newSteps[currentIndex];
        if (!currentStep) return newSteps; // Safety check

        if (currentStep.status === "pending") {
          currentStep.status = "in_progress";
          setCurrentStepIndex(currentIndex);
        } else if (currentStep.status === "in_progress") {
          currentStep.status = "completed";
          currentStep.txHash = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
        }

        return newSteps;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [steps.length]);

  const getStatusIcon = (status: ProgressStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "in_progress":
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case "failed":
        return (
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
            !
          </div>
        );
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const completedSteps = steps.filter(
    step => step.status === "completed"
  ).length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="text-center">
        <h4 className="text-lg font-bold text-white mb-2">
          Optimizing Your Portfolio
        </h4>
        <p className="text-sm text-gray-400">
          Please do not close this window while optimization is in progress
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="text-white">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Progress */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-300 ${
              step.status === "in_progress"
                ? "bg-blue-500/20 border border-blue-500/50"
                : step.status === "completed"
                  ? "bg-green-500/20 border border-green-500/30"
                  : "bg-gray-900/50 border border-gray-700"
            }`}
          >
            <div className="mt-0.5">{getStatusIcon(step.status)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-white">{step.title}</h5>
                {step.status === "in_progress" && (
                  <span className="text-xs text-blue-400 font-medium">
                    In Progress
                  </span>
                )}
                {step.status === "completed" && (
                  <span className="text-xs text-green-400 font-medium">
                    Completed
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-400 mt-1">{step.description}</p>

              {step.txHash && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Transaction:</span>
                  <button className="text-xs text-blue-400 hover:text-blue-300 font-mono">
                    {step.txHash}
                  </button>
                </div>
              )}
            </div>

            {index < steps.length - 1 && step.status === "completed" && (
              <ArrowRight className="w-4 h-4 text-gray-500 mt-1" />
            )}
          </div>
        ))}
      </div>

      {/* Completion State */}
      {progress === 100 && (
        <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-6 rounded-xl border border-green-500/30 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-white mb-2">
            Optimization Complete!
          </h4>
          <p className="text-green-400 mb-4">
            Your portfolio has been successfully optimized
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-green-900/30 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-400">
                ${mockData.totalSavings}
              </div>
              <div className="text-green-300">Total Savings</div>
            </div>
            <div className="bg-green-900/30 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-400">+2.3%</div>
              <div className="text-green-300">APR Improvement</div>
            </div>
          </div>
        </div>
      )}

      {/* Current Network Status */}
      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Network Status:</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400">Optimal</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-400">Est. Gas Price:</span>
          <span className="text-white">23 gwei</span>
        </div>
      </div>
    </div>
  );
}
