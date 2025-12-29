import {
    FloatingTooltip,
} from "./FloatingTooltip";

export interface ProgressBarSegment {
  key: string;
  percentage: number;
  content: React.ReactNode;
  tooltip?: {
    label: string;
    percentage: number;
    color: string;
  };
  /** Optional class for the segment wrapper div */
  className?: string;
  /** Test ID for the segment wrapper */
  testId?: string;
}

interface SegmentedProgressBarProps {
  segments: ProgressBarSegment[];
  /** Container class */
  className?: string;
  /** Test ID for the container */
  testId?: string;
}

/**
 * SegmentedProgressBar - Reusable component for rendering a multi-segment progress bar.
 * Handles width calculations and optional tooltips.
 */
export function SegmentedProgressBar({
  segments,
  className = "flex w-full overflow-hidden",
  testId,
}: SegmentedProgressBarProps) {
  if (segments.length === 0) return null;

  return (
    <div className={className} data-testid={testId}>
      {segments.map(segment => (
        <div
          key={segment.key}
          className={`h-full ${segment.className || ""}`}
          style={{ width: `${segment.percentage}%` }}
          data-testid={segment.testId}
        >
          {segment.tooltip ? (
            <FloatingTooltip
              label={segment.tooltip.label}
              percentage={segment.tooltip.percentage}
              color={segment.tooltip.color}
            >
              {segment.content}
            </FloatingTooltip>
          ) : (
            segment.content
          )}
        </div>
      ))}
    </div>
  );
}
