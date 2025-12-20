/**
 * Resolves balance visibility from props with a safe default.
 * Prioritizes prop value over the default for component flexibility.
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
 * // In component without prop (defaults to visible)
 * function MyComponent() {
 *   const resolvedHidden = useResolvedBalanceVisibility();
 *   return <div>{resolvedHidden ? '****' : '$1,234.56'}</div>;
 * }
 * ```
 */
export function useResolvedBalanceVisibility(propValue?: boolean): boolean {
  return propValue ?? false;
}
