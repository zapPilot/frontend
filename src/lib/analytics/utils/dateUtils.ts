/**
 * Date and parsing utilities for analytics transformers
 */

/**
 * Normalizes various date string formats into YYYY-MM-DD
 */
export const toDateKey = (value?: string | null): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match?.[1]) return match[1];

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
};

/**
 * Builds a date range object from an array of dated items
 */
export const buildDateRange = (values: { date?: string }[]) => ({
  startDate: toDateKey(values[0]?.date) ?? new Date().toISOString(),
  endDate:
    toDateKey(values[values.length - 1]?.date) ?? new Date().toISOString(),
});

/**
 * Normalizes a value to a 0-100 scale (inverted for SVG coordinates)
 */
export const normalizeToScale = (
  value: number,
  min: number,
  range: number
): number => {
  if (range <= 0) return 50;
  return 100 - ((value - min) / range) * 100;
};
