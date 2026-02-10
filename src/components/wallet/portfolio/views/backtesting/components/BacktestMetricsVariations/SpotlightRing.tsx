"use client";

import { AnimatePresence, motion } from "framer-motion";

interface SpotlightRingProps {
  metricKey: string;
  label: string;
  value: string;
  colorClass: string;
}

export function SpotlightRing({
  metricKey,
  label,
  value,
  colorClass,
}: SpotlightRingProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Spinning conic-gradient ring */}
      <div
        className="w-56 h-56 rounded-full p-[3px] animate-[spin_20s_linear_infinite]"
        style={{
          background:
            "conic-gradient(from 0deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)",
        }}
      >
        {/* Inner circle */}
        <div className="w-full h-full rounded-full bg-gray-950 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={metricKey}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <span className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
                {label}
              </span>
              <span className={`text-5xl font-bold tracking-tight ${colorClass}`}>
                {value}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-3xl -z-10" />
    </div>
  );
}
