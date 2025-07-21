import { ReactNode } from "react";
import {
  useFeatureFlag,
  useFeatureFlagValue,
} from "@/providers/FeatureFlagProvider";
import type { FeatureFlagKey, FeatureFlagValue } from "@/types/features";

interface FeatureFlagProps {
  /** The feature flag key to check */
  flag: FeatureFlagKey;
  /** Content to render when flag is enabled */
  children: ReactNode;
  /** Optional content to render when flag is disabled */
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on feature flag
 *
 * @example
 * <FeatureFlag flag="NEW_DASHBOARD_LAYOUT">
 *   <NewDashboard />
 * </FeatureFlag>
 *
 * @example
 * <FeatureFlag flag="ADVANCED_STRATEGIES" fallback={<ComingSoon />}>
 *   <AdvancedStrategies />
 * </FeatureFlag>
 */
export function FeatureFlag({
  flag,
  children,
  fallback = null,
}: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag);

  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

interface FeatureFlagValueProps<T extends FeatureFlagValue> {
  /** The feature flag key to get value from */
  flag: FeatureFlagKey;
  /** Render function that receives the flag value */
  children: (value: T) => ReactNode;
}

/**
 * Component that renders children with the feature flag value
 *
 * @example
 * <FeatureFlagValue flag="MAX_PORTFOLIO_SIZE">
 *   {(maxSize) => <div>Max portfolio size: {maxSize}</div>}
 * </FeatureFlagValue>
 *
 * @example
 * <FeatureFlagValue flag="API_ENDPOINTS">
 *   {(endpoints) => <ApiClient endpoints={endpoints} />}
 * </FeatureFlagValue>
 */
export function FeatureFlagValue<
  T extends FeatureFlagValue = FeatureFlagValue,
>({ flag, children }: FeatureFlagValueProps<T>) {
  const value = useFeatureFlagValue<T>(flag);
  return <>{children(value)}</>;
}

/**
 * HOC to wrap a component with feature flag logic
 *
 * @example
 * const ProtectedFeature = withFeatureFlag('ADVANCED_STRATEGIES')(AdvancedStrategies);
 *
 * @example
 * const ProtectedFeature = withFeatureFlag('ADVANCED_STRATEGIES', ComingSoon)(AdvancedStrategies);
 */
export function withFeatureFlag(flag: FeatureFlagKey, fallback?: ReactNode) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function FeatureFlaggedComponent(props: P) {
      return (
        <FeatureFlag flag={flag} fallback={fallback}>
          <Component {...props} />
        </FeatureFlag>
      );
    };
  };
}

/**
 * Utility component for A/B testing
 */
interface ABTestProps {
  /** The feature flag key controlling the test */
  flag: FeatureFlagKey;
  /** Component for variant A (control) */
  variantA: ReactNode;
  /** Component for variant B (test) */
  variantB: ReactNode;
  /** Optional tracking function for analytics */
  onVariantShown?: (variant: "A" | "B") => void;
}

/**
 * A/B test component that shows different variants based on feature flag
 *
 * @example
 * <ABTest
 *   flag="NEW_DASHBOARD_LAYOUT"
 *   variantA={<OldDashboard />}
 *   variantB={<NewDashboard />}
 *   onVariantShown={(variant) => analytics.track('ab_test_shown', { variant })}
 * />
 */
export function ABTest({
  flag,
  variantA,
  variantB,
  onVariantShown,
}: ABTestProps) {
  const isVariantB = useFeatureFlag(flag);

  // Track which variant is shown (optional)
  if (onVariantShown) {
    onVariantShown(isVariantB ? "B" : "A");
  }

  return isVariantB ? <>{variantB}</> : <>{variantA}</>;
}

/**
 * Progressive rollout component that shows loading state during rollout
 */
interface ProgressiveRolloutProps {
  /** The feature flag key */
  flag: FeatureFlagKey;
  /** Content for users in the rollout */
  children: ReactNode;
  /** Content for users not in rollout */
  fallback?: ReactNode;
}

/**
 * Component for progressive feature rollouts with loading states
 */
export function ProgressiveRollout({
  flag,
  children,
  fallback = null,
}: ProgressiveRolloutProps) {
  // This could be enhanced to show loading states during rollout determination
  // For now, it works the same as FeatureFlag
  return (
    <FeatureFlag flag={flag} fallback={fallback}>
      {children}
    </FeatureFlag>
  );
}

export default FeatureFlag;
