import React from "react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "./LoadingSpinner";

export interface LoadingPageProps {
  title?: string;
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  variant?: "fullscreen" | "centered" | "inline";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Full page loading component with optional progress indicator
 */
export function LoadingPage({
  title = "Loading",
  message = "Please wait while we load your data...",
  progress,
  showProgress = false,
  variant = "fullscreen",
  size = "lg",
  className = "",
  children,
}: LoadingPageProps) {
  const containerClasses = {
    fullscreen: "fixed inset-0 bg-gray-950/90 backdrop-blur-sm z-50",
    centered: "flex items-center justify-center min-h-[400px]",
    inline: "py-8",
  };

  const contentClasses = {
    sm: "space-y-3",
    md: "space-y-4",
    lg: "space-y-6",
  };

  const titleSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <div className="flex items-center justify-center w-full h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center ${contentClasses[size]} max-w-md mx-auto px-6`}
        >
          {/* Loading Spinner */}
          <div className="flex justify-center">
            <LoadingSpinner
              size={size === "lg" ? "xl" : "lg"}
              color="primary"
            />
          </div>

          {/* Title */}
          <h2 className={`${titleSizes[size]} font-semibold text-white`}>
            {title}
          </h2>

          {/* Message */}
          <p className="text-gray-400 text-sm">{message}</p>

          {/* Progress Bar */}
          {showProgress && typeof progress === "number" && (
            <div className="w-full">
              <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Additional Content */}
          {children && <div className="text-gray-400 text-sm">{children}</div>}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Simple loading overlay for existing content
 */
export function LoadingOverlay({
  isVisible,
  message = "Loading...",
  className = "",
}: {
  isVisible: boolean;
  message?: string;
  className?: string;
}) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`absolute inset-0 bg-gray-950/50 backdrop-blur-sm z-10 flex items-center justify-center ${className}`}
    >
      <div className="text-center space-y-3">
        <LoadingSpinner size="lg" color="primary" />
        <p className="text-sm text-gray-300">{message}</p>
      </div>
    </motion.div>
  );
}

/**
 * Loading placeholder for cards and content areas
 */
export function LoadingPlaceholder({
  lines = 3,
  showAvatar = false,
  showButton = false,
  className = "",
}: {
  lines?: number;
  showAvatar?: boolean;
  showButton?: boolean;
  className?: string;
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-4">
        {/* Avatar */}
        {showAvatar && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-1/3" />
              <div className="h-3 bg-gray-700 rounded w-1/4" />
            </div>
          </div>
        )}

        {/* Text Lines */}
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`h-4 bg-gray-700 rounded ${
                i === lines - 1 ? "w-3/4" : "w-full"
              }`}
            />
          ))}
        </div>

        {/* Button */}
        {showButton && (
          <div className="flex space-x-3 pt-2">
            <div className="h-9 bg-gray-700 rounded w-20" />
            <div className="h-9 bg-gray-700 rounded w-16" />
          </div>
        )}
      </div>
    </div>
  );
}
