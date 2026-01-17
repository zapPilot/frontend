import { BaseCard } from "@/components/ui/BaseCard";

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
}

export function MetricCard({
  label,
  value,
  subtext,
  highlight,
}: MetricCardProps) {
  return (
    <BaseCard
      variant="glass"
      className={`p-5 ${highlight ? "bg-green-500/5 border-green-500/20" : ""}`}
    >
      <div
        className={`text-xs font-medium mb-1.5 flex items-center gap-1 ${highlight ? "text-green-400" : "text-gray-400"}`}
      >
        {label}
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">
        {value}
      </div>
      {subtext && (
        <div className="text-[11px] text-gray-400 mt-1">{subtext}</div>
      )}
    </BaseCard>
  );
}
