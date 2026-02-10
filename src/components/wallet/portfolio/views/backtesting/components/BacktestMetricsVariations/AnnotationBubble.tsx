"use client";

import { motion } from "framer-motion";

interface AnnotationBubbleProps {
  label: string;
  value: string;
  borderColor: string;
  position: string;
  connectorDirection: "down" | "up";
  delay?: number;
}

export function AnnotationBubble({
  label,
  value,
  borderColor,
  position,
  connectorDirection,
  delay = 0,
}: AnnotationBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`absolute ${position} z-20`}
    >
      <div
        className="rounded-2xl bg-gray-900/80 backdrop-blur-lg px-4 py-3 shadow-xl"
        style={{ border: `1px solid ${borderColor}40` }}
      >
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
          {label}
        </div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
      {/* Dotted connector line */}
      <div
        className={`mx-auto w-0 h-6 ${
          connectorDirection === "down" ? "" : "order-first -mt-6 mb-0"
        }`}
        style={{
          borderLeft: `2px dotted ${borderColor}60`,
        }}
      />
    </motion.div>
  );
}
