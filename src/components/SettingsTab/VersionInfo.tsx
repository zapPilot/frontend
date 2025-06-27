"use client";

import { motion } from "framer-motion";

interface VersionInfoProps {
  version?: string;
  tagline?: string;
  className?: string;
}

export function VersionInfo({
  version = "Zap Pilot v1.0.0",
  tagline = "Built with ❤️ for DeFi",
  className = "",
}: VersionInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center glass-morphism rounded-2xl p-6 border border-gray-800 ${className}`}
    >
      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
        <span>{version}</span>
        <span>•</span>
        <span>{tagline}</span>
      </div>
    </motion.div>
  );
}
