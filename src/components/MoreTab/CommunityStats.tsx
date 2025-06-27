"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Stat {
  value: string;
  label: string;
}

interface CommunityStatsProps {
  stats?: Stat[];
  version?: string;
  className?: string;
}

const defaultStats: Stat[] = [
  { value: "2.5K+", label: "Active Users" },
  { value: "$50M+", label: "TVL Managed" },
  { value: "20+", label: "Networks" },
];

export function CommunityStats({
  stats = defaultStats,
  version = "v1.0.0",
  className = "",
}: CommunityStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-morphism rounded-2xl p-6 border border-gray-800 ${className}`}
    >
      <div className="flex items-center justify-center mb-4">
        <Image
          src="/logo.svg"
          alt="Zap Pilot Logo"
          width={64}
          height={64}
          className="w-16 h-16"
        />
      </div>

      <h3 className="text-lg font-semibold text-white mb-2 text-center">
        Zap Pilot Community
      </h3>
      <p className="text-sm text-gray-400 mb-6 text-center">
        Join our growing ecosystem of DeFi innovators
      </p>

      {/* Community Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Version Footer */}
      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 border-t border-gray-800 pt-4">
        <span>{version}</span>
        <span>•</span>
        <span>Intent-Based DeFi Engine</span>
      </div>
    </motion.div>
  );
}
