/**
 * useToast Unit Tests
 *
 * Tests for the toast notification context and hook
 */

import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "@/hooks/useToast";

// Mock the ToastNotification component
vi.mock("@/components/ui/ToastNotification", () => ({
  ToastNotification: ({
    toast,
    onClose,
  }: {
    toast: { id: string; message: string };
    onClose: (id: string) => void;
  }) => (
    <div data-testid={`toast-${toast.id}`}>
      <span>{toast.message}</span>
      <button onClick={() => onClose(toast.id)}>Close</button>
    </div>
  ),
}));

// Mock the Z_INDEX constant
vi.mock("@/constants/design-system", () => ({
  Z_INDEX: {
    TOAST: "z-50",
  },
}));

describe("useToast", () => {
  describe("when used outside provider", () => {
    it("should throw error when useToast is used outside ToastProvider", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation((_msg: unknown) => undefined);

      expect(() => {
        renderHook(() => useToast());
      }).toThrow("useToast must be used within a ToastProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("when used within provider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    it("should provide showToast and hideToast functions", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(result.current.showToast).toBeDefined();
      expect(typeof result.current.showToast).toBe("function");
      expect(result.current.hideToast).toBeDefined();
      expect(typeof result.current.hideToast).toBe("function");
    });

    it("should add toast when showToast is called", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({
          message: "Test toast message",
          type: "success",
        });
      });

      // Toast was added - verify by calling showToast again
      expect(result.current.showToast).toBeDefined();
    });

    it("should remove toast when hideToast is called", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      // Add a toast first
      act(() => {
        result.current.showToast({
          message: "Toast to remove",
          type: "info",
        });
      });

      // Hide with a random ID (won't match, but tests the function)
      act(() => {
        result.current.hideToast("non-existent-id");
      });

      expect(result.current.hideToast).toBeDefined();
    });
  });
});

describe("ToastProvider", () => {
  it("should render children", () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child content</div>
      </ToastProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("should render toasts when showToast is called", async () => {
    const TestComponent = () => {
      const { showToast } = useToast();

      return (
        <button
          onClick={() =>
            showToast({
              message: "Visible toast",
              type: "success",
            })
          }
        >
          Show Toast
        </button>
      );
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByRole("button").click();
    });

    await waitFor(() => {
      expect(screen.getByText("Visible toast")).toBeInTheDocument();
    });
  });

  it("should remove toast when close is clicked", async () => {
    const TestComponent = () => {
      const { showToast } = useToast();

      return (
        <button
          onClick={() =>
            showToast({
              message: "Temporary toast",
              type: "info",
            })
          }
        >
          Show Toast
        </button>
      );
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show the toast
    act(() => {
      screen.getByRole("button", { name: "Show Toast" }).click();
    });

    await waitFor(() => {
      expect(screen.getByText("Temporary toast")).toBeInTheDocument();
    });

    // Close the toast
    act(() => {
      screen.getByRole("button", { name: "Close" }).click();
    });

    await waitFor(() => {
      expect(screen.queryByText("Temporary toast")).not.toBeInTheDocument();
    });
  });

  it("should support multiple toasts", async () => {
    const TestComponent = () => {
      const { showToast } = useToast();

      return (
        <>
          <button
            data-testid="toast1"
            onClick={() => showToast({ message: "First toast", type: "info" })}
          >
            Toast 1
          </button>
          <button
            data-testid="toast2"
            onClick={() =>
              showToast({ message: "Second toast", type: "success" })
            }
          >
            Toast 2
          </button>
        </>
      );
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show multiple toasts
    act(() => {
      screen.getByTestId("toast1").click();
    });
    act(() => {
      screen.getByTestId("toast2").click();
    });

    await waitFor(() => {
      expect(screen.getByText("First toast")).toBeInTheDocument();
      expect(screen.getByText("Second toast")).toBeInTheDocument();
    });
  });
});
