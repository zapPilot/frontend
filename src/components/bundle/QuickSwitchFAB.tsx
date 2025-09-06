"use client";

import { Home } from "lucide-react";
import React from "react";
import { GRADIENTS } from "../../styles/design-tokens";

interface QuickSwitchFABProps {
  onSwitchToMyBundle: () => void;
  className?: string;
}

export const QuickSwitchFAB = React.memo<QuickSwitchFABProps>(
  ({ onSwitchToMyBundle, className = "" }) => {
    return (
      <button
        onClick={onSwitchToMyBundle}
        className={`fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r ${GRADIENTS.PRIMARY} shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${className}`}
        title="Go to my bundle"
        data-testid="quick-switch-fab"
      >
        <Home className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        
        {/* Tooltip */}
        <div className="absolute bottom-16 right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Go to my bundle
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      </button>
    );
  }
);

QuickSwitchFAB.displayName = "QuickSwitchFAB";