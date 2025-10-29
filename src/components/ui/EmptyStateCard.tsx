"use client";

import React from "react";
import { BaseComponentProps } from "../../types/ui.types";
import { BaseCard } from "./BaseCard";

interface EmptyStateCardProps extends BaseComponentProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * EmptyStateCard - Centered content card for empty states
 *
 * Displays an optional icon, title, description, and action button
 * in a centered layout with responsive padding.
 */
export const EmptyStateCard = React.memo<EmptyStateCardProps>(
  ({ icon, title, description, className = "", children }) => {
    return (
      <BaseCard
        variant="empty"
        padding="lg"
        borderRadius="xl"
        border={true}
        animate={true}
        className={className}
      >
        {/* Icon */}
        {icon && (
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-900/30 backdrop-blur-sm border border-gray-800">
              {icon}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-lg sm:text-xl font-bold gradient-text">
            {title}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm sm:max-w-md mx-auto px-2 sm:px-0">
            {description}
          </p>
        </div>

        {/* Additional content */}
        {children && <div className="mt-4 sm:mt-6">{children}</div>}
      </BaseCard>
    );
  }
);

EmptyStateCard.displayName = "EmptyStateCard";
