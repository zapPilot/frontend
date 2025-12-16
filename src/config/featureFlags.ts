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
   * @deprecated V22 is now the default layout. This flag is no longer used.
   * V22 was deployed via hard cutover on 2025-12-16.
   *
   * Keep this definition for backward compatibility until confirmed no other
   * references exist in the codebase.
   *
   * Migration Complete:
   * - /bundle route now uses V22 layout by default
   * - Feature flag logic removed from BundlePageEntry.tsx
   * - Percentage rollout system deprecated (isUserInV22Rollout removed)
   *
   * @default true (always enabled, env var ignored)
   */
  USE_V22_LAYOUT: true,

  /**
   * Regime History Tracking
   *
   * @deprecated ALWAYS ENABLED - This flag is deprecated and will be removed.
   * The regime history feature is now permanently enabled for all V22 layouts.
   *
   * Migration: The feature flag check has been removed from service layer
   * (regimeHistoryService.ts) and hook layer (usePortfolioDataV22.ts).
   *
   * Keep this definition for backward compatibility until confirmed no other
   * references exist in the codebase.
   *
   * Features:
   * - Directional strategy indicators (fromLeft/fromRight)
   * - Regime duration display
   * - Transition animation cues
   *
   * Graceful Degradation:
   * - If API fails: Logs error but continues with default neutral regime
   * - Error handling in useRegimeHistory() ensures UI never breaks
   *
   * @default true (always enabled, env var ignored)
   */
  REGIME_HISTORY_ENABLED: true,
};

/**
 * Type-safe feature flag keys
 */
type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

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

    // eslint-disable-next-line no-console
    console.group("🚩 Feature Flags");
    // eslint-disable-next-line no-console
    console.log(
      `Enabled: ${enabledCount}/${Object.keys(FEATURE_FLAGS).length}`
    );

    if (enabledCount > 0) {
      // eslint-disable-next-line no-console
      console.table(enabled);
    } else {
      // eslint-disable-next-line no-console
      console.log("No features enabled");
    }

    // eslint-disable-next-line no-console
    console.groupEnd();
  }
}
