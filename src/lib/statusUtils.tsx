"use client";

import { ReactNode } from "react";
import { CheckCircle, Loader2, AlertCircle, Clock } from "lucide-react";

/**
 * Step status type for progress tracking components
 * Used across modals and progress displays for consistent state representation
 */
export type StepStatus = "completed" | "in_progress" | "error" | "pending";

/**
 * Maps step status to corresponding icon component
 * Used in progress modals and status displays
 *
 * @param status - The current status of the step
 * @returns React icon component with appropriate styling
 *
 * @example
 * ```tsx
 * const icon = getStatusIcon(step.status);
 * return <div>{icon}</div>;
 * ```
 */
export function getStatusIcon(status: StepStatus): ReactNode {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case "in_progress":
      return <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />;
    case "error":
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    case "pending":
      return <Clock className="w-5 h-5 text-gray-400" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
}
