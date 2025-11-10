"use client";

import { memo } from "react";

interface TimeWindowSelectorProps {
  selectedWindow: 7 | 30 | 60 | 90;
  onChange: (window: 7 | 30 | 60 | 90) => void;
  disabled?: boolean;
}

const WINDOW_OPTIONS = [
  { value: 7 as const, label: "7D", description: "Short-term trends" },
  { value: 30 as const, label: "30D", description: "Standard (default)" },
  { value: 60 as const, label: "60D", description: "Stable estimates" },
  { value: 90 as const, label: "90D", description: "Robust analysis" },
] as const;

export const TimeWindowSelector = memo<TimeWindowSelectorProps>(
  ({ selectedWindow, onChange, disabled = false }) => {
    return (
      <div
        className="inline-flex bg-gray-800/60 border border-gray-700/50 rounded-lg p-1 gap-1"
        role="group"
        aria-label="Time window selector"
      >
        {WINDOW_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            disabled={disabled}
            className={`
              px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150
              ${
                selectedWindow === value
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500 focus-visible:outline-offset-2
            `}
            aria-pressed={selectedWindow === value}
            title={WINDOW_OPTIONS.find(opt => opt.value === value)?.description}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }
);

TimeWindowSelector.displayName = "TimeWindowSelector";
