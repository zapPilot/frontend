"use client";

import { TrendingUp, TrendingDown, Percent, Calendar } from "lucide-react";
import { getChangeColorClasses } from "../../lib/utils";
import { APRMetricsSize } from "../../types/portfolio";

interface APRMetricsProps {
  annualAPR: number;
  monthlyReturn: number;
  className?: string;
  size?: APRMetricsSize;
}

export function APRMetrics({
  annualAPR,
  monthlyReturn,
  className = "",
  size = "medium",
}: APRMetricsProps) {
  const sizeClasses = {
    small: {
      text: "text-lg",
      subText: "text-xs",
      icon: "w-3 h-3",
    },
    medium: {
      text: "text-xl",
      subText: "text-sm",
      icon: "w-4 h-4",
    },
    large: {
      text: "text-3xl",
      subText: "text-base",
      icon: "w-5 h-5",
    },
  };

  const styles = sizeClasses[size];

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div>
        <p className={`${styles.subText} text-gray-400 mb-1 flex items-center`}>
          <Percent className={`${styles.icon} mr-1`} />
          Portfolio APR
        </p>
        <div
          className={`flex items-center space-x-2 ${getChangeColorClasses(annualAPR)}`}
        >
          {annualAPR >= 0 ? (
            <TrendingUp className={styles.icon} />
          ) : (
            <TrendingDown className={styles.icon} />
          )}
          <span className={`${styles.text} font-semibold`}>
            {annualAPR >= 0 ? "+" : ""}
            {annualAPR.toFixed(2)}%
          </span>
        </div>
      </div>

      <div>
        <p className={`${styles.subText} text-gray-400 mb-1 flex items-center`}>
          <Calendar className={`${styles.icon} mr-1`} />
          Monthly Return
        </p>
        <div
          className={`flex items-center space-x-2 ${getChangeColorClasses(monthlyReturn)}`}
        >
          {monthlyReturn >= 0 ? (
            <TrendingUp className={styles.icon} />
          ) : (
            <TrendingDown className={styles.icon} />
          )}
          <span className={`${styles.text} font-semibold`}>
            {monthlyReturn >= 0 ? "+" : ""}
            {monthlyReturn.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
