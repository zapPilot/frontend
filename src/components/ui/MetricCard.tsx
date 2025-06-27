"use client";

import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  valueColor?: string;
  testId?: string;
}

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  valueColor = "text-white",
  testId,
}: MetricCardProps) {
  return (
    <div className="p-3 rounded-xl bg-gray-900/30" data-testid={testId}>
      <div className="flex items-center space-x-3 mb-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className={`text-lg font-bold ${valueColor}`}>{value}</div>
      {description && (
        <div className="text-xs text-gray-500">{description}</div>
      )}
    </div>
  );
}
