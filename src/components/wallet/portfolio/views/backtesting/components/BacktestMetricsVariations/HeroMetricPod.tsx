"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface HeroMetricPodProps {
  icon: LucideIcon;
  label: string;
  value: string;
  colorClass: string;
  iconShadowClass: string;
  delay?: number;
}

export function HeroMetricPod({
  icon: Icon,
  label,
  value,
  colorClass,
  iconShadowClass,
  delay = 0,
}: HeroMetricPodProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="flex items-center gap-3 rounded-2xl backdrop-blur-xl bg-gray-900/60 border border-white/10 shadow-2xl px-5 py-3"
    >
      <Icon className={`w-5 h-5 ${colorClass} ${iconShadowClass} flex-shrink-0`} />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
          {label}
        </div>
        <div className={`text-xl font-bold tracking-tight ${colorClass}`}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}
