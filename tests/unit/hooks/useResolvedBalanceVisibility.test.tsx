import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { useResolvedBalanceVisibility } from "../../../src/hooks/useResolvedBalanceVisibility";
import { BalanceVisibilityProvider } from "../../../src/contexts/BalanceVisibilityContext";

describe("useResolvedBalanceVisibility", () => {
  describe("Basic Functionality", () => {
    it("should return context value when no prop is provided", () => {
      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <BalanceVisibilityProvider>{children}</BalanceVisibilityProvider>
        );
      }

      const { result } = renderHook(() => useResolvedBalanceVisibility(), {
        wrapper: Wrapper,
      });

      // Default context value should be false (visible)
      expect(result.current).toBe(false);
    });

    it("should return prop value when provided as true", () => {
      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <BalanceVisibilityProvider>{children}</BalanceVisibilityProvider>
        );
      }

      const { result } = renderHook(() => useResolvedBalanceVisibility(true), {
        wrapper: Wrapper,
      });

      expect(result.current).toBe(true);
    });

    it("should return prop value when provided as false", () => {
      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <BalanceVisibilityProvider>{children}</BalanceVisibilityProvider>
        );
      }

      const { result } = renderHook(() => useResolvedBalanceVisibility(false), {
        wrapper: Wrapper,
      });

      expect(result.current).toBe(false);
    });
  });

  describe("Prop Priority", () => {
    it("should prioritize explicit prop value (false) over context value", () => {
      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <BalanceVisibilityProvider>{children}</BalanceVisibilityProvider>
        );
      }

      // Prop value (false) should be used when explicitly provided
      const { result } = renderHook(() => useResolvedBalanceVisibility(false), {
        wrapper: Wrapper,
      });

      expect(result.current).toBe(false);
    });

    it("should prioritize explicit prop value (true) over context value", () => {
      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <BalanceVisibilityProvider>{children}</BalanceVisibilityProvider>
        );
      }

      // Prop value (true) should be used when explicitly provided
      const { result } = renderHook(() => useResolvedBalanceVisibility(true), {
        wrapper: Wrapper,
      });

      expect(result.current).toBe(true);
    });

    it("should use context value when prop is undefined", () => {
      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <BalanceVisibilityProvider>{children}</BalanceVisibilityProvider>
        );
      }

      const { result } = renderHook(
        () => useResolvedBalanceVisibility(undefined),
        { wrapper: Wrapper }
      );

      // Should use context default value (false)
      expect(result.current).toBe(false);
    });
  });

  describe("Context Integration", () => {
    it("should use context value when no prop is provided", () => {
      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <BalanceVisibilityProvider>{children}</BalanceVisibilityProvider>
        );
      }

      const { result } = renderHook(() => useResolvedBalanceVisibility(), {
        wrapper: Wrapper,
      });

      // Should use context default value (false)
      expect(result.current).toBe(false);
    });

    it("should not be affected by context when prop is provided", () => {
      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <BalanceVisibilityProvider>{children}</BalanceVisibilityProvider>
        );
      }

      const { result } = renderHook(() => useResolvedBalanceVisibility(false), {
        wrapper: Wrapper,
      });

      // Prop value should take precedence
      expect(result.current).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null prop as undefined (use context)", () => {
      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <BalanceVisibilityProvider>{children}</BalanceVisibilityProvider>
        );
      }

      const { result } = renderHook(
        () => useResolvedBalanceVisibility(null as unknown as boolean),
        { wrapper: Wrapper }
      );

      // null ?? contextValue should return contextValue
      expect(result.current).toBe(false);
    });

    it("should work with multiple rerenders", () => {
      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <BalanceVisibilityProvider>{children}</BalanceVisibilityProvider>
        );
      }

      const { result, rerender } = renderHook(
        ({ propValue }: { propValue?: boolean }) =>
          useResolvedBalanceVisibility(propValue),
        {
          wrapper: Wrapper,
          initialProps: { propValue: true },
        }
      );

      expect(result.current).toBe(true);

      // Change prop to false
      rerender({ propValue: false });
      expect(result.current).toBe(false);

      // Change prop to undefined
      rerender({ propValue: undefined });
      expect(result.current).toBe(false); // Should use context (default false)

      // Change prop back to true
      rerender({ propValue: true });
      expect(result.current).toBe(true);
    });
  });
});
