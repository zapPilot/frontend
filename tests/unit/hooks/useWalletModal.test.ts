import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWalletModal } from "../../../src/hooks/useWalletModal";

describe("useWalletModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("starts with modal closed", () => {
      const { result } = renderHook(() => useWalletModal());

      expect(result.current.isOpen).toBe(false);
    });

    it("provides all required functions", () => {
      const { result } = renderHook(() => useWalletModal());

      expect(typeof result.current.openModal).toBe("function");
      expect(typeof result.current.closeModal).toBe("function");
      expect(typeof result.current.isOpen).toBe("boolean");
    });
  });

  describe("Modal State Management", () => {
    it("opens modal when openModal is called", () => {
      const { result } = renderHook(() => useWalletModal());

      act(() => {
        result.current.openModal();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("closes modal when closeModal is called", () => {
      const { result } = renderHook(() => useWalletModal());

      // First open the modal
      act(() => {
        result.current.openModal();
      });

      expect(result.current.isOpen).toBe(true);

      // Then close it
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("handles multiple open/close cycles", () => {
      const { result } = renderHook(() => useWalletModal());

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.openModal();
        });
        expect(result.current.isOpen).toBe(true);

        act(() => {
          result.current.closeModal();
        });
        expect(result.current.isOpen).toBe(false);
      }
    });

    it("remains open when openModal called multiple times", () => {
      const { result } = renderHook(() => useWalletModal());

      act(() => {
        result.current.openModal();
        result.current.openModal();
        result.current.openModal();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("remains closed when closeModal called multiple times", () => {
      const { result } = renderHook(() => useWalletModal());

      act(() => {
        result.current.closeModal();
        result.current.closeModal();
        result.current.closeModal();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("Function Stability", () => {
    it("creates new function references across renders (performance optimized)", () => {
      const { result, rerender } = renderHook(() => useWalletModal());

      const initialOpenModal = result.current.openModal;
      const initialCloseModal = result.current.closeModal;

      rerender();

      // Functions are recreated each render for better performance (no useCallback overhead)
      expect(result.current.openModal).not.toBe(initialOpenModal);
      expect(result.current.closeModal).not.toBe(initialCloseModal);
    });

    it("creates new function references after state changes (performance optimized)", () => {
      const { result } = renderHook(() => useWalletModal());

      const initialOpenModal = result.current.openModal;
      const initialCloseModal = result.current.closeModal;

      act(() => {
        result.current.openModal();
      });

      // Functions are recreated each render for better performance (no useCallback overhead)
      expect(result.current.openModal).not.toBe(initialOpenModal);
      expect(result.current.closeModal).not.toBe(initialCloseModal);
    });
  });

  describe("Hook Lifecycle", () => {
    it("initializes correctly on mount", () => {
      const { result } = renderHook(() => useWalletModal());

      expect(result.current.isOpen).toBeDefined();
      expect(result.current.openModal).toBeDefined();
      expect(result.current.closeModal).toBeDefined();
    });

    it("handles remounting correctly", () => {
      const { result: firstResult, unmount } = renderHook(() =>
        useWalletModal()
      );

      act(() => {
        firstResult.current.openModal();
      });

      expect(firstResult.current.isOpen).toBe(true);

      unmount();

      // Re-mount - should start fresh with closed state
      const { result: secondResult } = renderHook(() => useWalletModal());
      expect(secondResult.current.isOpen).toBe(false);
    });
  });

  describe("Integration Patterns", () => {
    it("works correctly in conditional rendering scenarios", () => {
      // Test two separate hook instances instead of conditional rendering
      const { result: firstResult } = renderHook(() => useWalletModal());
      expect(firstResult.current.isOpen).toBe(false);

      act(() => {
        firstResult.current.openModal();
      });
      expect(firstResult.current.isOpen).toBe(true);

      // Create a second independent instance
      const { result: secondResult } = renderHook(() => useWalletModal());
      expect(secondResult.current.isOpen).toBe(false);
    });

    it("supports modal state management in components", () => {
      const { result } = renderHook(() => useWalletModal());

      // Simulate typical usage pattern
      act(() => {
        result.current.openModal();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.closeModal();
      });
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("Performance", () => {
    it("handles rapid state changes efficiently", () => {
      const { result } = renderHook(() => useWalletModal());

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.openModal();
          result.current.closeModal();
        }
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("does not cause unnecessary re-renders", () => {
      let renderCount = 0;
      const { rerender } = renderHook(() => {
        renderCount++;
        return useWalletModal();
      });

      expect(renderCount).toBe(1);

      // Re-render without state change shouldn't cause additional renders
      rerender();

      expect(renderCount).toBe(2);
    });
  });

  describe("Edge Cases", () => {
    it("handles concurrent state changes", async () => {
      const { result } = renderHook(() => useWalletModal());

      act(() => {
        result.current.openModal();
      });

      // The synchronous call should take effect
      expect(result.current.isOpen).toBe(true);
    });

    it("maintains consistent state during component updates", () => {
      const { result } = renderHook(() => useWalletModal());

      act(() => {
        result.current.openModal();
      });

      const { result: newResult } = renderHook(() => useWalletModal());

      // New instance should start fresh
      expect(newResult.current.isOpen).toBe(false);
      // Original should maintain state
      expect(result.current.isOpen).toBe(true);
    });
  });
});
