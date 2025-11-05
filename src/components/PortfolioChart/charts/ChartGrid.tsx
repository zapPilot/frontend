import { memo } from "react";

interface ChartGridProps {
  lines?: number;
  className?: string;
}

const BASE_GRID_CLASSES =
  "absolute inset-0 flex flex-col justify-between pointer-events-none";

export const ChartGrid = memo<ChartGridProps>(({ lines = 5, className }) => {
  const containerClass = className
    ? `${BASE_GRID_CLASSES} ${className}`
    : BASE_GRID_CLASSES;

  return (
    <div className={containerClass}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="border-t border-gray-700/60" />
      ))}
    </div>
  );
});

ChartGrid.displayName = "ChartGrid";

