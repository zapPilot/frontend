/**
 * Tests for useClickOutside hook
 */

import { renderHook } from "@testing-library/react";
import { RefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useClickOutside } from "@/hooks/useClickOutside";

describe("useClickOutside", () => {
  let mockCallback: ReturnType<typeof vi.fn>;
  let containerRef: RefObject<HTMLDivElement>;
  let container: HTMLDivElement;

  beforeEach(() => {
    mockCallback = vi.fn();
    container = document.createElement("div");
    document.body.appendChild(container);
    containerRef = { current: container };
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it("should call callback when clicking outside the element", () => {
    renderHook(() => useClickOutside(containerRef, mockCallback, true));

    // Click on document (outside)
    document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should NOT call callback when clicking inside the element", () => {
    renderHook(() => useClickOutside(containerRef, mockCallback, true));

    // Click inside container
    container.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should call callback when pressing Escape key", () => {
    renderHook(() => useClickOutside(containerRef, mockCallback, true));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should NOT call callback when pressing other keys", () => {
    renderHook(() => useClickOutside(containerRef, mockCallback, true));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should NOT call callback when isActive is false", () => {
    renderHook(() => useClickOutside(containerRef, mockCallback, false));

    document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should disable Escape key handling when enableEscapeKey is false", () => {
    renderHook(() =>
      useClickOutside(containerRef, mockCallback, true, {
        enableEscapeKey: false,
      })
    );

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(mockCallback).not.toHaveBeenCalled();

    // But click outside should still work
    document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should clean up event listeners on unmount", () => {
    const { unmount } = renderHook(() =>
      useClickOutside(containerRef, mockCallback, true)
    );

    unmount();

    // After unmount, events should not trigger callback
    document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should handle null ref gracefully", () => {
    const nullRef: RefObject<HTMLDivElement> = { current: null };

    // Should not throw when ref is null
    expect(() => {
      renderHook(() => useClickOutside(nullRef, mockCallback, true));
    }).not.toThrow();

    // With null ref, contains() will fail so callback won't be called
    // (the ref.current is null, so the condition ref.current && ... short-circuits)
  });
});
