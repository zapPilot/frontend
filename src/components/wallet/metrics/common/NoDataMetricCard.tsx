import { AlertCircle, type LucideIcon } from "lucide-react";

import { MetricCard } from "../MetricCard";

interface NoDataMetricCardProps {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  labelClassName: string;
  message?: string;
}

export function NoDataMetricCard({
  icon,
  iconClassName,
  label,
  labelClassName,
  message = "No data available",
}: NoDataMetricCardProps) {
  return (
    <MetricCard icon={icon} iconClassName={iconClassName}>
      <div className="text-3xl font-bold text-white h-10 flex items-center mb-2">
        <div className="text-gray-400 text-lg">{message}</div>
      </div>
      <p className={labelClassName}>{label}</p>
    </MetricCard>
  );
}

interface MetricErrorCardProps {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  labelClassName: string;
  message: string;
}

export function MetricErrorCard({
  icon,
  iconClassName,
  label,
  labelClassName,
  message,
}: MetricErrorCardProps) {
  return (
    <MetricCard icon={icon} iconClassName={iconClassName}>
      <div className="text-3xl font-bold text-white h-10 flex items-center mb-2">
        <div className="flex flex-col space-y-2">
          <div className="text-sm text-red-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        </div>
      </div>
      <p className={labelClassName}>{label}</p>
    </MetricCard>
  );
}
