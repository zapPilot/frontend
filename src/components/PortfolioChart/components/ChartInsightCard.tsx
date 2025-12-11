"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { memo, useState } from "react";

import { InfoCircleIcon } from "@/components/icons/InfoCircleIcon";
import { fadeInDown } from "@/lib/animationVariants";

import { ChartCloseIcon } from "./ChartCloseIcon";

type SeverityType = "info" | "warning" | "success" | "critical";

interface InsightAction {
  label: string;
  href: string;
  variant: "primary" | "secondary";
}

interface ChartInsightCardProps {
  severity: SeverityType;
  title: string;
  message: string;
  actions?: InsightAction[];
  dismissible?: boolean;
  onDismiss?: () => void;
}

const SEVERITY_STYLES = {
  info: {
    border: "border-l-blue-500",
    bg: "bg-gradient-to-r from-blue-500/10 to-blue-500/5",
    icon: <InfoCircleIcon className="w-5 h-5 text-blue-400" />,
    titleColor: "text-blue-300",
  },
  warning: {
    border: "border-l-amber-500",
    bg: "bg-gradient-to-r from-amber-500/10 to-amber-500/5",
    icon: (
      <svg
        className="w-5 h-5 text-amber-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    titleColor: "text-amber-300",
  },
  success: {
    border: "border-l-emerald-500",
    bg: "bg-gradient-to-r from-emerald-500/10 to-emerald-500/5",
    icon: (
      <svg
        className="w-5 h-5 text-emerald-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    titleColor: "text-emerald-300",
  },
  critical: {
    border: "border-l-red-500",
    bg: "bg-gradient-to-r from-red-500/10 to-red-500/5",
    icon: (
      <svg
        className="w-5 h-5 text-red-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    titleColor: "text-red-300",
  },
} as const;

export const ChartInsightCard = memo<ChartInsightCardProps>(
  ({
    severity,
    title,
    message,
    actions = [],
    dismissible = true,
    onDismiss,
  }) => {
    const [dismissed, setDismissed] = useState(false);
    const styles = SEVERITY_STYLES[severity];

    const handleDismiss = () => {
      setDismissed(true);
      onDismiss?.();
    };

    return (
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            variants={fadeInDown}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            className={`
              relative
              ${styles.bg}
              ${styles.border}
              border-l-4
              backdrop-blur-sm
              rounded-lg
              p-4
              mb-4
              shadow-lg
            `}
          >
            {/* Main Content */}
            <div className="flex gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-sm font-semibold ${styles.titleColor} mb-1`}
                >
                  {title}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {message}
                </p>

                {/* Actions */}
                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {actions.map(({ label, href, variant }) => (
                      <Link
                        key={label}
                        href={href}
                        className={`
                          inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold
                          transition-all duration-150
                          ${
                            variant === "primary"
                              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5"
                              : "bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600/50"
                          }
                        `}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Dismiss Button */}
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-700/50"
                  aria-label="Dismiss insight"
                >
                  <ChartCloseIcon size={16} className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

ChartInsightCard.displayName = "ChartInsightCard";
