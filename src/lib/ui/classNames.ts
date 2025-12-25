/**
 * className Utility Functions
 * Replaces inline ternary operators with cleaner conditional API
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function createClassNameBuilder(...baseClasses: string[]) {
  const base = baseClasses.join(" ");
  return (...conditionalClasses: (string | undefined | null | false)[]) =>
    cn(base, ...conditionalClasses);
}
