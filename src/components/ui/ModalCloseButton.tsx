"use client";

import { X } from "lucide-react";

interface ModalCloseButtonProps {
  onClose: () => void;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
}

/**
 * Standardized modal close button with X icon
 * Appears in top-right corner of modals for dismissing
 * Provides consistent styling and accessibility across modal components
 */
export function ModalCloseButton({
  onClose,
  className = "",
  "aria-label": ariaLabel = "Close modal",
  "data-testid": testId = "modal-close-button",
}: ModalCloseButtonProps) {
  return (
    <button
      onClick={onClose}
      className={`p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-200 ${className}`}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      <X className="w-5 h-5 text-gray-300" />
    </button>
  );
}
