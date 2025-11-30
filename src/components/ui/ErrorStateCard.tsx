"use client";

import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import React from "react";

import { BaseComponentProps } from '@/types/ui/ui.types';

import { EmptyStateCard } from "./EmptyStateCard";
import { GradientButton } from "./GradientButton";

interface ErrorStateCardProps extends BaseComponentProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  showIcon?: boolean;
}

export const ErrorStateCard = React.memo<ErrorStateCardProps>(
  ({
    title = "Something went wrong",
    message,
    onRetry,
    isRetrying = false,
    className = "",
    showIcon = true,
  }) => {
    return (
      <EmptyStateCard
        icon={showIcon && <AlertCircle className="w-8 h-8 text-red-400" />}
        title={title}
        description={message}
        action={
          onRetry && (
            <GradientButton
              onClick={onRetry}
              disabled={isRetrying}
              gradient="from-red-500 to-red-600"
              className="px-6 py-2 min-w-[120px]"
            >
              {isRetrying ? (
                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Retrying...</span>
                </motion.div>
              ) : (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </div>
              )}
            </GradientButton>
          )
        }
        className={className}
      />
    );
  }
);

ErrorStateCard.displayName = "ErrorStateCard";
