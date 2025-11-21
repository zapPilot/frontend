import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon?: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  error?: boolean;
}

export function MetricCard({
  icon: Icon,
  iconClassName = "text-gray-500",
  children,
  className = "",
  isLoading,
  error,
}: MetricCardProps) {
  const baseClasses = "bg-gray-900/50 border border-gray-800 rounded-xl p-6 h-full flex flex-col items-center justify-center relative overflow-hidden group hover:border-gray-700 transition-colors";
  
  // If loading or error, we might want different styles or just render children which handle it
  // But typically the container style is consistent.
  
  // Error border style from MarketSentimentMetric
  const containerClasses = error 
    ? "bg-gray-900/50 border border-red-900/30 rounded-xl p-6 h-full flex flex-col items-center justify-center relative overflow-hidden hover:border-red-800/50 transition-colors"
    : baseClasses;

  const finalClasses = `${containerClasses} ${className} ${isLoading ? "animate-pulse" : ""}`;

  return (
    <div className={finalClasses}>
      {Icon && !isLoading && !error && (
        <div
          className="absolute -right-6 -top-6 p-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none select-none"
          aria-hidden="true"
        >
          <Icon className={`w-24 h-24 md:w-32 md:h-32 ${iconClassName}`} />
        </div>
      )}
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        {children}
      </div>
    </div>
  );
}


