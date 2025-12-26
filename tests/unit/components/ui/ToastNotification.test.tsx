import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Toast,
  ToastNotification,
} from "../../../../src/components/ui/ToastNotification";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  AlertCircle: () => <span data-testid="icon-info">Info Icon</span>,
  AlertTriangle: () => <span data-testid="icon-warning">Warning Icon</span>,
  CheckCircle: () => <span data-testid="icon-success">Success Icon</span>,
  ExternalLink: () => <span data-testid="external-link-icon">Link</span>,
  X: () => <span data-testid="close-icon">X</span>,
  XCircle: () => <span data-testid="icon-error">Error Icon</span>,
}));

describe("ToastNotification", () => {
  const mockOnClose = vi.fn();

  const createToast = (overrides: Partial<Toast> = {}): Toast => ({
    id: "test-toast-1",
    type: "success",
    title: "Test Title",
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnClose.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Snapshot Tests - UI Design Freeze", () => {
    it("should match snapshot for success toast", () => {
      const { container } = render(
        <ToastNotification
          toast={createToast({ type: "success" })}
          onClose={mockOnClose}
        />
      );
      // Trigger animation
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(container.firstChild).toMatchSnapshot();
    });

    it("should match snapshot for error toast", () => {
      const { container } = render(
        <ToastNotification
          toast={createToast({ type: "error" })}
          onClose={mockOnClose}
        />
      );
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(container.firstChild).toMatchSnapshot();
    });

    it("should match snapshot for info toast", () => {
      const { container } = render(
        <ToastNotification
          toast={createToast({ type: "info" })}
          onClose={mockOnClose}
        />
      );
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(container.firstChild).toMatchSnapshot();
    });

    it("should match snapshot for warning toast", () => {
      const { container } = render(
        <ToastNotification
          toast={createToast({ type: "warning" })}
          onClose={mockOnClose}
        />
      );
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(container.firstChild).toMatchSnapshot();
    });

    it("should match snapshot with message", () => {
      const { container } = render(
        <ToastNotification
          toast={createToast({ message: "This is a detailed message" })}
          onClose={mockOnClose}
        />
      );
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(container.firstChild).toMatchSnapshot();
    });

    it("should match snapshot with link", () => {
      const { container } = render(
        <ToastNotification
          toast={createToast({
            link: { text: "View details", url: "https://example.com" },
          })}
          onClose={mockOnClose}
        />
      );
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(container.firstChild).toMatchSnapshot();
    });

    it("should match snapshot with action button", () => {
      const { container } = render(
        <ToastNotification
          toast={createToast({
            action: { label: "Retry", onClick: vi.fn() },
          })}
          onClose={mockOnClose}
        />
      );
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("Behavior Tests", () => {
    it("should render title", () => {
      render(
        <ToastNotification
          toast={createToast({ title: "My Title" })}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("My Title")).toBeInTheDocument();
    });

    it("should render message when provided", () => {
      render(
        <ToastNotification
          toast={createToast({ message: "Toast message" })}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("Toast message")).toBeInTheDocument();
    });

    it("should render correct icon for success type", () => {
      render(
        <ToastNotification
          toast={createToast({ type: "success" })}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByTestId("icon-success")).toBeInTheDocument();
    });

    it("should render correct icon for error type", () => {
      render(
        <ToastNotification
          toast={createToast({ type: "error" })}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByTestId("icon-error")).toBeInTheDocument();
    });

    it("should render correct icon for info type", () => {
      render(
        <ToastNotification
          toast={createToast({ type: "info" })}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByTestId("icon-info")).toBeInTheDocument();
    });

    it("should render correct icon for warning type", () => {
      render(
        <ToastNotification
          toast={createToast({ type: "warning" })}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByTestId("icon-warning")).toBeInTheDocument();
    });

    it("should close toast when close button is clicked", () => {
      render(<ToastNotification toast={createToast()} onClose={mockOnClose} />);

      const closeButton = screen.getByTestId("close-icon").closest("button");
      fireEvent.click(closeButton!);

      // Wait for exit animation
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockOnClose).toHaveBeenCalledWith("test-toast-1");
    });

    it("should auto-dismiss after default duration", () => {
      render(<ToastNotification toast={createToast()} onClose={mockOnClose} />);

      // Default duration is 6000ms + 300ms for exit animation
      act(() => {
        vi.advanceTimersByTime(6000);
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockOnClose).toHaveBeenCalledWith("test-toast-1");
    });

    it("should auto-dismiss after custom duration", () => {
      render(
        <ToastNotification
          toast={createToast({ duration: 3000 })}
          onClose={mockOnClose}
        />
      );

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockOnClose).toHaveBeenCalledWith("test-toast-1");
    });

    it("should render link when provided", () => {
      render(
        <ToastNotification
          toast={createToast({
            link: { text: "View details", url: "https://example.com" },
          })}
          onClose={mockOnClose}
        />
      );

      const link = screen.getByText("View details");
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute("href", "https://example.com");
    });

    it("should call action onClick when action button is clicked", () => {
      const mockAction = vi.fn();
      render(
        <ToastNotification
          toast={createToast({
            action: { label: "Retry", onClick: mockAction },
          })}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText("Retry"));
      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });
});
