/**
 * Chart Helper Utilities
 *
 * Reusable functions and components for chart rendering
 */

/**
 * Build SVG path string from data points
 *
 * Converts normalized 0-100 coordinates to pixel coordinates
 *
 * @param points - Array of data points with x property (0-100 scale)
 * @param width - SVG viewBox width in pixels
 * @param getY - Function to extract Y pixel coordinate from point
 * @returns SVG path string (space-separated "x,y" pairs)
 */
export function buildPath<T extends { x: number }>(
  points: T[],
  width: number,
  getY: (point: T) => number
): string {
  return points
    .map(point => {
      const x = (point.x / 100) * width;
      const y = getY(point);
      return `${x},${y}`;
    })
    .join(" L ");
}

/**
 * Grid line positions (percentages from top)
 */
export const CHART_GRID_POSITIONS = {
  FIVE_LINES: [0, 25, 50, 75, 100] as number[],
  FOUR_LINES: [0, 33, 66, 100] as number[],
  THREE_LINES: [0, 50, 100] as number[],
};
