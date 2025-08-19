import { motion, MotionStyle } from "framer-motion";
import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  spinnerSize?: "xs" | "sm" | "md" | "lg" | "xl";
  spinnerColor?: "primary" | "white" | "gray";
}

const variantClasses = {
  primary:
    "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700",
  secondary: "bg-gray-600 text-white hover:bg-gray-700",
  outline:
    "border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white",
  ghost: "text-purple-500 hover:bg-purple-500/10",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

const spinnerSizeMap = {
  sm: "xs" as const,
  md: "sm" as const,
  lg: "md" as const,
};

/**
 * Button component with consistent loading states
 */
export function LoadingButton({
  children,
  isLoading = false,
  loadingText,
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  spinnerSize,
  spinnerColor,
  className = "",
  disabled,
  style,
  onDrag, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDragEnd, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDragStart, // eslint-disable-line @typescript-eslint/no-unused-vars
  onAnimationStart, // eslint-disable-line @typescript-eslint/no-unused-vars
  onAnimationEnd, // eslint-disable-line @typescript-eslint/no-unused-vars
  onAnimationIteration, // eslint-disable-line @typescript-eslint/no-unused-vars
  onTransitionEnd, // eslint-disable-line @typescript-eslint/no-unused-vars
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || isLoading;
  const finalSpinnerSize = spinnerSize || spinnerSizeMap[size];
  const finalSpinnerColor =
    spinnerColor || (variant === "primary" ? "white" : "primary");

  const buttonContent = isLoading ? (
    <div className="flex items-center justify-center space-x-2">
      <LoadingSpinner
        size={finalSpinnerSize}
        color={finalSpinnerColor}
        label={loadingText || "Loading"}
        aria-hidden="true"
      />
      {loadingText && <span>{loadingText}</span>}
    </div>
  ) : (
    <div className="flex items-center justify-center space-x-2">
      {leftIcon && (
        <span className="flex items-center" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <span>{children}</span>
      {rightIcon && (
        <span className="flex items-center" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </div>
  );

  const motionProps = !isDisabled
    ? {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
      }
    : {};

  return (
    <motion.button
      {...motionProps}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${
          isDisabled
            ? "opacity-50 cursor-not-allowed"
            : "transition-all duration-200"
        }
        rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        ${className}
      `}
      disabled={isDisabled}
      aria-busy={isLoading}
      {...props}
      style={style as MotionStyle}
    >
      {buttonContent}
    </motion.button>
  );
}

/**
 * Icon button variant with loading state
 */
export function LoadingIconButton({
  icon,
  isLoading = false,
  size = "md",
  variant = "ghost",
  className = "",
  "aria-label": ariaLabel,
  style,
  onDrag, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDragEnd, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDragStart, // eslint-disable-line @typescript-eslint/no-unused-vars
  onAnimationStart, // eslint-disable-line @typescript-eslint/no-unused-vars
  onAnimationEnd, // eslint-disable-line @typescript-eslint/no-unused-vars
  onAnimationIteration, // eslint-disable-line @typescript-eslint/no-unused-vars
  onTransitionEnd, // eslint-disable-line @typescript-eslint/no-unused-vars
  ...props
}: {
  icon: React.ReactNode;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
  "aria-label": string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  const sizeMap = {
    sm: { button: "p-1.5", spinner: "xs" as const },
    md: { button: "p-2", spinner: "sm" as const },
    lg: { button: "p-3", spinner: "md" as const },
  };

  const iconMotionProps =
    !props.disabled && !isLoading
      ? {
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.95 },
        }
      : {};

  return (
    <motion.button
      {...iconMotionProps}
      className={`
        ${variantClasses[variant]}
        ${sizeMap[size].button}
        rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        ${props.disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      disabled={props.disabled || isLoading}
      {...props}
      style={style as MotionStyle}
    >
      {isLoading ? (
        <LoadingSpinner
          size={sizeMap[size].spinner}
          color={variant === "primary" ? "white" : "primary"}
          aria-hidden="true"
        />
      ) : (
        icon
      )}
    </motion.button>
  );
}
