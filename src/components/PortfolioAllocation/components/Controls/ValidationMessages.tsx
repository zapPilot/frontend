"use client";

import { memo } from "react";
import { SwapValidation } from "../../types";

interface ValidationMessagesProps {
  validation: SwapValidation;
}

export const ValidationMessages = memo<ValidationMessagesProps>(
  ({ validation }) => {
    if (validation.isValid && validation.warnings.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        {validation.errors.map((error, index) => (
          <div
            key={index}
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
          >
            {error}
          </div>
        ))}
        {validation.warnings.map((warning, index) => (
          <div
            key={index}
            className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3"
          >
            {warning}
          </div>
        ))}
      </div>
    );
  }
);

ValidationMessages.displayName = "ValidationMessages";
