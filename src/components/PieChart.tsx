"use client";

import { motion } from "framer-motion";

interface PieChartData {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  strokeWidth?: number;
}

export function PieChart({ data, size = 200, strokeWidth = 8 }: PieChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercentage = 0;

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          {data.map((item, index) => {
            const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePercentage * circumference / 100;
            
            cumulativePercentage += item.percentage;
            
            return (
              <motion.circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray, strokeDashoffset }}
                transition={{ duration: 1, delay: index * 0.2, ease: "easeOut" }}
                className="hover:brightness-110 transition-all duration-200 cursor-pointer"
                style={{
                  filter: `drop-shadow(0 0 8px ${item.color}40)`,
                }}
              />
            );
          })}
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {data.reduce((sum, item) => sum + item.value, 0).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
              })}
            </div>
            <div className="text-sm text-gray-400">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PieChartLegendProps {
  data: PieChartData[];
  onItemClick?: (item: PieChartData) => void;
}

export function PieChartLegend({ data, onItemClick }: PieChartLegendProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {data.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          onClick={() => onItemClick?.(item)}
          className="flex items-center space-x-3 p-3 rounded-xl bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-200 cursor-pointer"
        >
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {item.label}
            </div>
            <div className="text-xs text-gray-400">
              {item.percentage.toFixed(1)}% • {item.value.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
              })}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}