"use client";

import type { LucideIcon } from "lucide-react";
import React from "react";

import { InteractiveComponentProps } from "../../types/ui.types";

interface TabButtonProps extends InteractiveComponentProps {
  id: string;
  label: string;
  active: boolean;
  onSelect: () => void;
  icon?: LucideIcon;
  badgeCount?: number;
  variant?: "assets" | "borrowing";
  compact?: boolean;
  controls?: string;
}

export function TabButton({
  id,
  label,
  active,
  onSelect,
  icon: Icon,
  badgeCount,
  variant = "assets",
  compact = false,
  controls,
}: TabButtonProps) {
  const spacing = compact
    ? "space-x-1.5 px-2.5 py-1.5"
    : "space-x-2 px-3 py-1.5";
  const baseBtn =
    "relative flex items-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-2";
  const activeClasses =
    variant === "assets"
      ? "bg-blue-600 text-white shadow-lg transform scale-105 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
      : "bg-orange-600 text-white shadow-lg transform scale-105 focus-visible:outline-orange-500 focus-visible:outline-offset-2";
  const inactiveClasses =
    variant === "assets"
      ? "text-gray-400 hover:text-white hover:bg-gray-800/80 hover:scale-102 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
      : "text-gray-400 hover:text-white hover:bg-gray-800/80 hover:scale-102 focus-visible:outline-orange-500 focus-visible:outline-offset-2";

  const badgeActive =
    variant === "assets"
      ? "bg-blue-800 text-blue-100"
      : "bg-orange-800 text-orange-100";
  const badgeInactive = "bg-gray-700 text-gray-300";

  return (
    <button
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      className={`${baseBtn} ${spacing} ${active ? activeClasses : inactiveClasses}`}
      onClick={onSelect}
      type="button"
    >
      {Icon && (
        <Icon
          className={`w-4 h-4 transition-transform duration-300 ${active ? "scale-110" : ""}`}
        />
      )}
      <span>{label}</span>
      {typeof badgeCount === "number" && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded transition-colors duration-300 ${active ? badgeActive : badgeInactive}`}
        >
          {badgeCount}
        </span>
      )}
    </button>
  );
}
