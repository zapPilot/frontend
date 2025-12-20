interface SelectorHeaderProps {
  title: string;
  description: string;
}

export function SelectorHeader({ title, description }: SelectorHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          {title}
        </p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}
