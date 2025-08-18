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
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const colorClasses = {
  primary: "text-blue-600",
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
 * Consistent loading spinner component
 */
export function LoadingSpinner({
  size = "md",
  color = "primary",
  className = "",
  label = "Loading",
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
}: LoadingSpinnerProps) {
  const finalAriaLabel = ariaLabel || label;
  const isHidden = ariaHidden === true || ariaHidden === "true";

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
