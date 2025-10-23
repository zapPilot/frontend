"use client";

import { motion } from "framer-motion";
import { GlassCard } from "../ui";
import { ButtonSkeleton, Skeleton } from "../ui/LoadingSystem";

/**
 * Loading skeleton for PortfolioChart
 * Matches the layout of the actual chart component
 */
export function PortfolioChartSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      role="status"
      aria-live="polite"
    >
      <GlassCard className="p-6">
        <div className="text-sm font-medium text-gray-300 mb-4">
          Loading portfolio analytics...
        </div>
        {/* Header skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="mb-4 lg:mb-0">
            <Skeleton
              variant="text"
              width={250}
              height={28}
              className="mb-2"
              aria-label="Fetching heading"
            />
            <Skeleton
              variant="text"
              width={200}
              height={20}
              aria-label="Fetching subheading"
            />
          </div>

          {/* Chart type selector skeleton */}
          <div className="flex flex-wrap gap-2 mb-4 lg:mb-0">
            {[...Array(6)].map((_, i) => (
              <ButtonSkeleton
                key={i}
                width={120}
                height={40}
                ariaLabel="Fetching chart option"
              />
            ))}
          </div>
        </div>

        {/* Period selector skeleton */}
        <div className="flex space-x-2 mb-6">
          {[...Array(6)].map((_, i) => (
            <ButtonSkeleton
              key={i}
              width={60}
              height={32}
              ariaLabel="Fetching period option"
            />
          ))}
        </div>

        {/* Chart area skeleton */}
        <Skeleton
          variant="rectangular"
          width="100%"
          height={320}
          className="mb-6"
          aria-label="Fetching chart visualization"
        />

        {/* Summary metrics skeleton */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton
                variant="text"
                width="60%"
                height={16}
                className="mx-auto mb-1"
                aria-label="Fetching summary label"
              />
              <Skeleton
                variant="text"
                width="80%"
                height={24}
                className="mx-auto"
                aria-label="Fetching summary value"
              />
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
