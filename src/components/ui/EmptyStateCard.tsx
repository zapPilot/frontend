"use client";

import { motion } from "framer-motion";
import React from "react";

interface EmptyStateCardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyStateCard = React.memo<EmptyStateCardProps>(
  ({ icon, title, description, action, className = "", children }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-morphism rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-800 text-center ${className}`}
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

        {/* Action */}
        {action && <div className="mt-6 sm:mt-8">{action}</div>}

        {/* Additional content */}
        {children && <div className="mt-4 sm:mt-6">{children}</div>}
      </motion.div>
    );
  }
);

EmptyStateCard.displayName = "EmptyStateCard";
