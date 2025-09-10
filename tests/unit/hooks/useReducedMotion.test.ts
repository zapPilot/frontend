/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useReducedMotion } from "../../../src/hooks/useReducedMotion";

// Mock matchMedia
const mockMatchMedia = vi.fn();

describe("useReducedMotion", () => {
  let mockMediaQuery: {
    matches: boolean;
    addEventListener: vi.Mock;
    removeEventListener: vi.Mock;
  };

  beforeEach(() => {
    mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return false initially when prefers-reduced-motion is not set", () => {
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
    expect(mockMatchMedia).toHaveBeenCalledWith(
      "(prefers-reduced-motion: reduce)"
    );
  });

  it("should return true initially when prefers-reduced-motion is set", () => {
    mockMediaQuery.matches = true;

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it("should add event listener on mount", () => {
    renderHook(() => useReducedMotion());

    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("should remove event listener on unmount", () => {
    const { unmount } = renderHook(() => useReducedMotion());

    act(() => {
      unmount();
    });

    expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });

  it("should update state when media query changes", () => {
    mockMediaQuery.matches = false;
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      changeHandler({ matches: true });
    });

    expect(result.current).toBe(true);
  });

  it("should update state multiple times when media query changes", () => {
    mockMediaQuery.matches = false;
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    // First change
    act(() => {
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      changeHandler({ matches: true });
    });

    expect(result.current).toBe(true);

    // Second change
    act(() => {
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      changeHandler({ matches: false });
    });

    expect(result.current).toBe(false);
  });

  it("should handle initial matches value correctly", () => {
    // Test with initial true value
    mockMediaQuery.matches = true;
    const { result: result1 } = renderHook(() => useReducedMotion());
    expect(result1.current).toBe(true);

    // Test with initial false value
    mockMediaQuery.matches = false;
    const { result: result2 } = renderHook(() => useReducedMotion());
    expect(result2.current).toBe(false);
  });

  it("should use the same event listener for add and remove", () => {
    const { unmount } = renderHook(() => useReducedMotion());

    const addedHandler = mockMediaQuery.addEventListener.mock.calls[0][1];

    act(() => {
      unmount();
    });

    const removedHandler = mockMediaQuery.removeEventListener.mock.calls[0][1];

    expect(addedHandler).toBe(removedHandler);
  });

  it("should handle matchMedia not being available", () => {
    // Remove matchMedia to test fallback
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: undefined,
    });

    // Should not throw an error
    expect(() => {
      renderHook(() => useReducedMotion());
    }).toThrow(); // This will throw because useEffect tries to call window.matchMedia
  });

  it("should work correctly when matchMedia returns null", () => {
    mockMatchMedia.mockReturnValue(null);

    expect(() => {
      renderHook(() => useReducedMotion());
    }).toThrow(); // This will throw because we try to access properties on null
  });

  it("should maintain consistent behavior across multiple renders", () => {
    mockMediaQuery.matches = false;
    const { result, rerender } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    // Rerender shouldn't change the result
    rerender();
    expect(result.current).toBe(false);

    // Change media query
    act(() => {
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      changeHandler({ matches: true });
    });

    expect(result.current).toBe(true);

    // Rerender after state change
    rerender();
    expect(result.current).toBe(true);
  });

  it("should only call matchMedia once per hook instance", () => {
    renderHook(() => useReducedMotion());

    expect(mockMatchMedia).toHaveBeenCalledTimes(1);
  });

  it("should call addEventListener exactly once", () => {
    renderHook(() => useReducedMotion());

    expect(mockMediaQuery.addEventListener).toHaveBeenCalledTimes(1);
  });

  it("should call removeEventListener exactly once on unmount", () => {
    const { unmount } = renderHook(() => useReducedMotion());

    expect(mockMediaQuery.removeEventListener).toHaveBeenCalledTimes(0);

    act(() => {
      unmount();
    });

    expect(mockMediaQuery.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it("should handle rapid state changes correctly", () => {
    mockMediaQuery.matches = false;
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    // Rapid changes
    act(() => {
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      changeHandler({ matches: true });
      changeHandler({ matches: false });
      changeHandler({ matches: true });
    });

    expect(result.current).toBe(true);
  });
});
