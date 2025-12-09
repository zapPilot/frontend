import { forwardRef } from "react";

import type { ModalInputProps } from "./types";

export const ModalInput = forwardRef<HTMLInputElement, ModalInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    const focusBorderColor = error
      ? "focus:border-red-500"
      : "focus:border-purple-500";

    return (
      <div className="mb-6">
        {label && (
          <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-2xl font-bold text-white ${focusBorderColor} outline-none transition-colors ${className}`}
          {...props}
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);

ModalInput.displayName = "ModalInput";
