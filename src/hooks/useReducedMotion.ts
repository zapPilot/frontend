/**
 * Custom React hook to detect user's motion preference for accessibility
 *
 * @returns {boolean} True if user prefers reduced motion, false otherwise
 *
 * @description
 * This hook monitors the CSS media query `(prefers-reduced-motion: reduce)`
 * to determine if the user has enabled reduced motion in their system
 * accessibility settings. It automatically updates when the preference changes.
 *
 * The hook is essential for creating accessible animations by:
 * - Disabling or reducing animations when preferred
 * - Removing motion that might cause vestibular disorders
 * - Respecting user accessibility choices
 *
 * @example
 * ```typescript
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1 }}
 *       transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion MDN prefers-reduced-motion}
 * @see {@link https://web.dev/prefers-reduced-motion/ Web.dev Accessibility Guide}
 */

import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
