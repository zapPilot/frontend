interface AllocationChipProps {
  label: string;
  color: string;
}

export function AllocationChip({ label, color }: AllocationChipProps) {
  return (
    <div
      className="px-2 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}
