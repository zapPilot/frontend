"use client";

import { useEffect, useMemo, useRef } from "react";

import { Modal } from "@/components/ui/modal";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  accent?: "primary" | "success" | "danger";
  children: React.ReactNode;
  footer?: React.ReactNode;
  testId?: string;
}

const ACCENT_CLASS = {
  primary: "from-purple-600/30 to-blue-600/30 text-purple-200",
  success: "from-emerald-600/30 to-teal-600/30 text-emerald-200",
  danger: "from-red-600/30 to-pink-600/30 text-red-200",
} as const;

export function TransactionModal({
  isOpen,
  onClose,
  title,
  subtitle,
  accent = "primary",
  children,
  footer,
  testId,
}: TransactionModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const focusableSelectors = useMemo(
    () => [
      "button",
      "[href]",
      "input",
      "select",
      "textarea",
      '[tabindex]:not([tabindex="-1"])',
    ],
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const root = containerRef.current;
    if (!root) return;

    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(focusableSelectors.join(","))
    ).filter(el => !el.hasAttribute("disabled"));

    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        return;
      }

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusableSelectors, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      className="bg-gray-900/90 border border-gray-800 shadow-2xl"
    >
      <div
        ref={containerRef}
        className="flex flex-col gap-6"
        data-testid={testId}
      >
        <div
          className={`rounded-2xl border border-white/5 bg-gradient-to-br ${ACCENT_CLASS[accent]} p-4`}
        >
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-gray-200/80 mt-1">{subtitle}</p>
          ) : null}
        </div>

        <div className="space-y-4">{children}</div>

        {footer ? (
          <div className="border-t border-gray-800 pt-4">{footer}</div>
        ) : null}
      </div>
    </Modal>
  );
}
