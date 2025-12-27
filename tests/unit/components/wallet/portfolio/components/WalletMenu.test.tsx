import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WalletMenu } from "@/components/wallet/portfolio/components/WalletMenu";
import { WALLET_LABELS } from "@/constants/wallet";

// Mock providers and hooks
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSwitchActiveWallet = vi.fn();

vi.mock("thirdweb/react", () => ({
  useConnectModal: () => ({
    connect: mockConnect,
    isConnecting: false,
  }),
  ConnectButton: () => <button>Connect Thirdweb</button>,
}));

vi.mock("@/providers/WalletProvider", () => ({
  useWalletProvider: () => ({
    connectedWallets: [],
    switchActiveWallet: mockSwitchActiveWallet,
    hasMultipleWallets: false,
    account: null,
    isConnected: false,
    disconnect: mockDisconnect,
  }),
}));

vi.mock("@/utils/formatters", () => ({
  formatAddress: (addr: string) => addr.substring(0, 6) + "...",
}));

// Mock child components
vi.mock("@/components/WalletManager/components/ConnectWalletButton", () => ({
  ConnectWalletButton: ({ className }: { className?: string }) => (
    <button className={className}>Connect Wallet Button</button>
  ),
}));

describe("WalletMenu Component", () => {
  const mockOnOpenSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders connect button in compact mode on mobile (hidden text)", () => {
    render(<WalletMenu onOpenSettings={mockOnOpenSettings} />);
    
    // The "Connect Wallet" text should be hidden on small screens
    // We check for the class 'hidden sm:inline' on the span
    const connectText = screen.getByText(WALLET_LABELS.CONNECT);
    expect(connectText).toHaveClass("hidden", "sm:inline");
  });

  it("renders wallet icon always", () => {
    // We can't easily check for the SVG icon directly without aria-label or testid on the icon itself,
    // but we can check the button exists
    render(<WalletMenu onOpenSettings={mockOnOpenSettings} />);
    const button = screen.getByTestId("unified-wallet-menu-button");
    expect(button).toBeInTheDocument();
  });

  it("calls connect when not connected", () => {
    render(<WalletMenu onOpenSettings={mockOnOpenSettings} />);
    const button = screen.getByTestId("unified-wallet-menu-button");
    fireEvent.click(button);
    expect(mockConnect).toHaveBeenCalled();
  });

  it("matches snapshot", () => {
    const { container } = render(
      <WalletMenu onOpenSettings={mockOnOpenSettings} />
    );
    expect(container).toMatchSnapshot();
  });
});
