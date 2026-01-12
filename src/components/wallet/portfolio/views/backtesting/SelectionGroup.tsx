interface SelectionOption<T> {
  value: T;
  label: string;
  icon?: React.ElementType;
  activeColor?: string;
}

interface SelectionGroupProps<T extends string> {
  label: string;
  options: SelectionOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  layout?: "grid" | "row";
}

export function SelectionGroup<T extends string>({
  label,
  options,
  selectedValue,
  onChange,
  layout = "row",
}: SelectionGroupProps<T>) {
  return (
    <div className="space-y-3">
      <label className="text-xs text-gray-400 font-medium ml-1">{label}</label>
      <div
        className={
          layout === "grid"
            ? "grid grid-cols-2 gap-2 p-1 bg-gray-900/40 rounded-xl border border-gray-800"
            : "flex bg-gray-900/50 rounded-lg p-1 border border-gray-800"
        }
      >
        {options.map(option => {
          const isActive = selectedValue === option.value;
          if (layout === "grid") {
            return (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gray-800 border border-gray-700 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-800/50 hover:text-gray-300"
                }`}
              >
                {option.icon && (
                  <option.icon
                    className={`w-4 h-4 ${isActive && option.activeColor ? option.activeColor : ""}`}
                  />
                )}
                {option.label}
              </button>
            );
          }
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                isActive
                  ? "bg-gray-700 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
