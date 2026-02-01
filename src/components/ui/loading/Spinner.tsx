import { motion } from "framer-motion";

import type { ComponentSize, SpinnerVariant } from "@/types/ui/ui.types";
import {
  ARIA_HIDDEN_PROP,
  ARIA_LABEL_PROP,
  colorClasses,
  DATA_TEST_ID_PROP,
  DEFAULT_SPINNER_LABEL,
  sizeClasses,
  SR_ONLY_CLASS,
  type BaseLoadingProps,
  type LoadingColor,
} from "./constants";

export interface SpinnerProps extends BaseLoadingProps {
  size?: ComponentSize;
  color?: LoadingColor;
  variant?: SpinnerVariant;
  label?: string;
}

export function Spinner({
  size = "md",
  color = "primary",
  variant = "default",
  className = "",
  label = DEFAULT_SPINNER_LABEL,
  [ARIA_LABEL_PROP]: ariaLabel,
  [ARIA_HIDDEN_PROP]: ariaHidden,
  [DATA_TEST_ID_PROP]: testId = "loading-spinner",
}: SpinnerProps) {
  const finalAriaLabel = ariaLabel ?? label;
  const isHidden = ariaHidden === true || ariaHidden === "true";

  const containerProps = {
    className: `inline-flex items-center ${sizeClasses[size]} ${className}`,
    [DATA_TEST_ID_PROP]: testId,
    "data-size": size,
    ...(!isHidden && { role: "status", [ARIA_LABEL_PROP]: finalAriaLabel }),
    ...(isHidden && { [ARIA_HIDDEN_PROP]: ariaHidden }),
  } as const;

  if (variant === "dots") {
    return (
      <div {...containerProps}>
        <div className="flex items-center space-x-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className={`w-2 h-2 ${colorClasses[color]} bg-current rounded-full`}
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <span className={SR_ONLY_CLASS}>{label}</span>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div {...containerProps}>
        <motion.div
          className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full`}
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <span className={SR_ONLY_CLASS}>{label}</span>
      </div>
    );
  }

  // Default spinner
  return (
    <div {...containerProps}>
      <motion.svg
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
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
      <span className={SR_ONLY_CLASS}>{label}</span>
    </div>
  );
}
