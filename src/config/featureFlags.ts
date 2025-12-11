/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for gradual rollouts and A/B testing.
 * Feature flags are controlled via environment variables.
 *
 * Usage:
 * ```typescript
 * import { FEATURE_FLAGS } from '@/config/featureFlags';
 *
 * if (FEATURE_FLAGS.USE_V22_LAYOUT) {
 *   // Use V22 layout
 * }
 * ```
 *
 * Environment Variables:
 * - NEXT_PUBLIC_USE_V22_LAYOUT: Enable V22 portfolio layout (default: false)
 */

export const FEATURE_FLAGS = {
  /**
   * V22 Layout Migration
   *
   * Enables the new V22 portfolio layout with:
   * - Dashboard with real-time regime detection
   * - Portfolio composition visualization
   * - Analytics tab (mock data)
   * - Backtesting tab (mock data)
   *
   * Rollout Plan:
   * - Week 1: Internal testing (manually enable via .env.local)
   * - Week 2: Canary (10% of users)
   * - Week 2-3: Gradual rollout (10% → 25% → 50% → 100%)
   *
   * @default false
   */
  USE_V22_LAYOUT:
    process.env["NEXT_PUBLIC_USE_V22_LAYOUT"] === "true",
};

/**
 * Type-safe feature flag keys
 */
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature flag is enabled
 *
 * @param flagKey - The feature flag key to check
 * @returns True if the feature is enabled
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled('USE_V22_LAYOUT')) {
 *   // Feature is enabled
 * }
 * ```
 */
export function isFeatureEnabled(flagKey: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flagKey];
}

/**
 * Get all enabled feature flags
 *
 * Useful for debugging and logging active features.
 *
 * @returns Object with only enabled feature flags
 */
export function getEnabledFeatures(): Record<string, boolean> {
  return Object.entries(FEATURE_FLAGS)
    .filter(([, value]) => value === true)
    .reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, boolean>
    );
}

/**
 * Development helper: Log feature flag status
 *
 * Only logs in development mode to avoid cluttering production logs.
 */
export function logFeatureFlags(): void {
  if (process.env.NODE_ENV === "development") {
    const enabled = getEnabledFeatures();
    const enabledCount = Object.keys(enabled).length;

    console.group("🚩 Feature Flags");
    console.log(`Enabled: ${enabledCount}/${Object.keys(FEATURE_FLAGS).length}`);

    if (enabledCount > 0) {
      console.table(enabled);
    } else {
      console.log("No features enabled");
    }

    console.groupEnd();
  }
}
