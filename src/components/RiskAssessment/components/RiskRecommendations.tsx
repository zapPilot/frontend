/**
 * Risk Recommendations Component
 *
 * Displays risk management recommendations based on portfolio metrics
 */

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { GlassCard } from "../../ui";
import { getRiskRecommendations } from "../../../utils/risk";

interface RiskRecommendationsProps {
  volatilityPct: number;
  drawdownPct: number;
  delay?: number;
  className?: string;
}

export function RiskRecommendations({
  volatilityPct,
  drawdownPct,
  delay = 0,
  className = "",
}: RiskRecommendationsProps) {
  const recommendations = getRiskRecommendations(volatilityPct, drawdownPct);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      <GlassCard className="p-6 bg-yellow-900/20 border border-yellow-800/30">
        <div className="flex items-start space-x-3">
          <AlertCircle
            className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0"
            aria-hidden="true"
          />
          <div>
            <h4 className="text-lg font-medium text-yellow-300 mb-3">
              Risk Management Considerations
            </h4>
            <div className="space-y-3 text-sm text-yellow-200" role="list">
              {recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-2"
                  role="listitem"
                >
                  <span
                    className="w-1 h-1 rounded-full bg-yellow-400 mt-2 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <p>
                    <strong>{recommendation.title}:</strong>{" "}
                    {recommendation.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
