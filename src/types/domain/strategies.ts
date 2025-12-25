/**
 * Strategy-related TypeScript interfaces for API integration
 */

/**
 * Complete API Response from /api/v1/strategies
 * Opaque type - internal structure not directly accessed in codebase
 */
export interface StrategiesApiResponse {
  success: boolean;
  strategies: unknown[];
  total: number;
  supportedChains: string[];
  lastUpdated: string;
}
