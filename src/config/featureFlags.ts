/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for gradual rollouts and A/B testing.
 *
 * @note All V22 migration flags have been removed after successful hard cutover.
 * @see docs/V22_OVERVIEW.md for consolidated migration history
 */

/**
 * Feature flags object
 *
 * Currently empty - all previous flags (USE_V22_LAYOUT, REGIME_HISTORY_ENABLED)
 * have been removed after successful migration to V22.
 *
 * Add new feature flags here as needed for future rollouts.
 */
export const FEATURE_FLAGS = {} as const;

/**
 * Type-safe feature flag keys
 */
type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature flag is enabled
 *
 * @param flagKey - The feature flag key to check
 * @returns True if the feature is enabled
 */
export function isFeatureEnabled(flagKey: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flagKey] ?? false;
}

/**
 * Get all enabled feature flags
 *
 * @returns Object with only enabled feature flags
 */
export function getEnabledFeatures(): Record<string, boolean> {
  return Object.entries(FEATURE_FLAGS)
    .filter(([, value]) => value === true)
    .reduce(
      (acc, [key, value]) => {
        acc[key] = value as boolean;
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
