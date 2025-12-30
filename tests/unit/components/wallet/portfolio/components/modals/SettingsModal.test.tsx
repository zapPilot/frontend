import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsModal } from "@/components/wallet/portfolio/components/modals/SettingsModal";

// Mock the modal components
vi.mock("@/components/ui/modal", () => ({
  Modal: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
  }) => (isOpen ? <div data-testid="mock-modal">{children}</div> : null),
  ModalHeader: ({
    title,
    subtitle,
    onClose,
  }: {
    title: string;
    subtitle: string;
    onClose: () => void;
  }) => (
    <div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <button onClick={onClose} aria-label="Close modal">
        ×
      </button>
    </div>
  ),
  ModalContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ModalFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("SettingsModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("renders when open", () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
    expect(screen.getByText("Core Settings")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<SettingsModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();
  });

  it("displays Google Calendar connection option", () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("Google Calendar")).toBeInTheDocument();
    expect(screen.getByText("Remind me to rebalance")).toBeInTheDocument();
  });

  it("displays subtitle about automated rebalancing", () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    // Check for part of the subtitle text that's definitely unique
    expect(screen.getByText(/personal regime/i)).toBeInTheDocument();
  });

  it("has a Connect button for Google Calendar", () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    const connectButton = screen.getByRole("button", { name: /Connect/i });
    expect(connectButton).toBeInTheDocument();
  });

  it("calls onClose when modal header close button is clicked", () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    const modalCloseButton = screen.getByRole("button", {
      name: /Close modal/i,
    });
    fireEvent.click(modalCloseButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when footer Close button is clicked", () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    const footerCloseButton = screen.getByRole("button", { name: /^Close$/i });
    fireEvent.click(footerCloseButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("renders Calendar icon", () => {
    const { container } = render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    );

    // Calendar icon from lucide-react should be present
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
