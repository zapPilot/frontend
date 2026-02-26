import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsModal } from "@/components/wallet/portfolio/modals/SettingsModal";

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

// Mock Telegram service functions
const mockGetTelegramStatus = vi.fn();
const mockRequestTelegramToken = vi.fn();
const mockDisconnectTelegram = vi.fn();

vi.mock("@/services", () => ({
  getTelegramStatus: (...args: unknown[]) => mockGetTelegramStatus(...args),
  requestTelegramToken: (...args: unknown[]) =>
    mockRequestTelegramToken(...args),
  disconnectTelegram: (...args: unknown[]) => mockDisconnectTelegram(...args),
}));

describe("SettingsModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockGetTelegramStatus.mockReset();
    mockRequestTelegramToken.mockReset();
    mockDisconnectTelegram.mockReset();
  });

  it("renders when open with Notifications title", () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<SettingsModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();
  });

  it("displays subtitle about Telegram alerts", () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    expect(
      screen.getByText(/connect telegram to receive portfolio alerts/i)
    ).toBeInTheDocument();
  });

  it("shows connect-wallet message when no userId", () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/connect your wallet first/i)).toBeInTheDocument();
  });

  it("shows loading state initially with userId", () => {
    mockGetTelegramStatus.mockReturnValue(new Promise(() => undefined));

    const { container } = render(
      <SettingsModal isOpen={true} onClose={mockOnClose} userId="0x123" />
    );

    // Loader2 renders an SVG with the animate-spin class
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument();
  });

  it("shows disconnected state with Connect button", async () => {
    mockGetTelegramStatus.mockResolvedValue({
      isConnected: false,
      isEnabled: false,
      connectedAt: null,
    });

    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} userId="0x123" />
    );

    await waitFor(() => {
      expect(screen.getByText("Telegram")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Connect/i })
    ).toBeInTheDocument();
  });

  it("shows connected state with Disconnect button", async () => {
    mockGetTelegramStatus.mockResolvedValue({
      isConnected: true,
      isEnabled: true,
      connectedAt: "2026-01-01T00:00:00Z",
    });

    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} userId="0x123" />
    );

    await waitFor(() => {
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Disconnect/i })
    ).toBeInTheDocument();
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
});
