import type { SVGProps } from "react";

interface ChartCloseIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function ChartCloseIcon({
  size = 24,
  className,
  ...props
}: ChartCloseIconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
