/**
 * Key Takeaway Component
 *
 * Displays the main insight summary for the risk assessment
 */

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { GlassCard } from "../../ui";

interface KeyTakeawayProps {
  message: string;
  delay?: number;
  className?: string;
}

export function KeyTakeaway({
  message,
  delay = 0,
  className = "",
}: KeyTakeawayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      <GlassCard className="p-6 bg-blue-900/20 border border-blue-800/30">
        <div className="flex items-start space-x-3">
          <Info
            className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0"
            aria-hidden="true"
          />
          <div>
            <h4 className="text-lg font-medium text-blue-300 mb-2">
              Key Takeaway
            </h4>
            <p className="text-blue-200 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
