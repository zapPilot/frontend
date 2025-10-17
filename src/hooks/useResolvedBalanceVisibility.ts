import { useBalanceVisibility } from "../contexts/BalanceVisibilityContext";

/**
 * Resolves balance visibility from props or context.
 * Prioritizes prop value over context value for component flexibility.
 *
 * This hook consolidates the common pattern of resolving visibility state
 * that was previously duplicated across multiple components.
 *
 * @param propValue - Optional boolean from component props (true = hidden, false = visible)
 * @returns Resolved visibility state (true = hidden, false = visible)
 *
 * @example
 * ```tsx
 * // In component with optional balanceHidden prop
 * function MyComponent({ balanceHidden }: { balanceHidden?: boolean }) {
 *   const resolvedHidden = useResolvedBalanceVisibility(balanceHidden);
 *   return <div>{resolvedHidden ? '****' : '$1,234.56'}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In component without prop (uses context only)
 * function MyComponent() {
 *   const resolvedHidden = useResolvedBalanceVisibility();
 *   return <div>{resolvedHidden ? '****' : '$1,234.56'}</div>;
 * }
 * ```
 */
export function useResolvedBalanceVisibility(propValue?: boolean): boolean {
  const { balanceHidden: contextValue } = useBalanceVisibility();
  return propValue ?? contextValue;
}
