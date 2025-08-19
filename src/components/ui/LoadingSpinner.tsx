import React from "react";
import { motion } from "framer-motion";

export interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?:
    | "primary"
    | "secondary"
    | "white"
    | "success"
    | "warning"
    | "blue"
    | "gray"
    | "green"
    | "red";
  className?: string;
  label?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  variant?: "default" | "dots" | "pulse";
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const colorClasses = {
  primary: "text-purple-500", // Match the existing purple theme
  secondary: "text-gray-600",
  blue: "text-blue-600",
  white: "text-white",
  gray: "text-gray-400",
  green: "text-green-600",
  success: "text-green-600",
  red: "text-red-600",
  warning: "text-yellow-600",
};

/**
 * Consistent loading spinner component with multiple variants
 */
export function LoadingSpinner({
  size = "md",
  color = "primary",
  className = "",
  label = "Loading",
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  variant = "default",
}: LoadingSpinnerProps) {
  const finalAriaLabel = ariaLabel || label;
  const isHidden = ariaHidden === true || ariaHidden === "true";

  // Render different variants
  if (variant === "dots") {
    return (
      <div
        className={`inline-flex items-center space-x-1 ${className}`}
        {...(!isHidden && { role: "status", "aria-label": finalAriaLabel })}
        {...(isHidden && { "aria-hidden": ariaHidden })}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className={`${sizeClasses[size]
              .replace("w-", "w-")
              .replace("h-", "h-")
              .replace(/(\d+)/, match =>
                String(Number(match) / 2)
              )} ${colorClasses[color]} bg-current rounded-full`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div
        className={`inline-flex items-center ${sizeClasses[size]} ${className}`}
        {...(!isHidden && { role: "status", "aria-label": finalAriaLabel })}
        {...(isHidden && { "aria-hidden": ariaHidden })}
      >
        <motion.div
          className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full`}
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // Default spinner variant
  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} ${className}`}
      {...(!isHidden && { role: "status", "aria-label": finalAriaLabel })}
      {...(isHidden && { "aria-hidden": ariaHidden })}
    >
      <motion.svg
        className={`${colorClasses[color]} animate-spin`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <circle
          className="opacity-75"
          cx="12"
          cy="12"
          r="6"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="15.708"
          strokeDashoffset="11.781"
          strokeLinecap="round"
        />
      </motion.svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
