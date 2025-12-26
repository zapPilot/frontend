/**
 * Portfolio allocation type definitions shared across adapters and UI.
 */

export interface AllocationConstituent {
  asset: string;
  symbol: string;
  name: string;
  value: number;
  color: string;
}
