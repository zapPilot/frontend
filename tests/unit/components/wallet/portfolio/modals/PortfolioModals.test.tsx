import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PortfolioModals } from "@/components/wallet/portfolio/modals/PortfolioModals";

const MOCK_DATA = {
  currentAllocation: {
    crypto: 50,
    stable: 50,
    simplifiedCrypto: 50,
  },
  targetAllocation: {
    crypto: 60,
    stable: 40,
  },
} as any;

// Mock child modals
vi.mock("@/components/wallet/portfolio/modals", () => ({
  DepositModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="deposit-modal">
        Deposit Modal <button onClick={onClose}>Close</button>
      </div>
    ) : null,
  WithdrawModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="withdraw-modal">Withdraw Modal</div> : null,
  RebalanceModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="rebalance-modal">Rebalance Modal</div> : null,
}));

vi.mock("@/components/wallet/portfolio/modals/SettingsModal", () => ({
  SettingsModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="settings-modal">
        Settings Modal <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe("PortfolioModals", () => {
  const defaultProps = {
    activeModal: null,
    onClose: vi.fn(),
    data: MOCK_DATA,
    isSettingsOpen: false,
    setIsSettingsOpen: vi.fn(),
  };

  it("renders nothing when no modal is active", () => {
    render(<PortfolioModals {...defaultProps} />);
    expect(screen.queryByTestId("deposit-modal")).not.toBeInTheDocument();
    expect(screen.queryByTestId("withdraw-modal")).not.toBeInTheDocument();
    expect(screen.queryByTestId("rebalance-modal")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
  });

  it("renders DepositModal when activeModal is 'deposit'", () => {
    render(<PortfolioModals {...defaultProps} activeModal="deposit" />);
    expect(screen.getByTestId("deposit-modal")).toBeInTheDocument();
  });

  it("renders WithdrawModal when activeModal is 'withdraw'", () => {
    render(<PortfolioModals {...defaultProps} activeModal="withdraw" />);
    expect(screen.getByTestId("withdraw-modal")).toBeInTheDocument();
  });

  it("renders RebalanceModal when activeModal is 'rebalance'", () => {
    render(<PortfolioModals {...defaultProps} activeModal="rebalance" />);
    expect(screen.getByTestId("rebalance-modal")).toBeInTheDocument();
  });

  it("renders SettingsModal when isSettingsOpen is true", () => {
    render(<PortfolioModals {...defaultProps} isSettingsOpen={true} />);
    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
  });

  it("handles SettingsModal close", () => {
    const setIsSettingsOpen = vi.fn();
    render(
      <PortfolioModals
        {...defaultProps}
        isSettingsOpen={true}
        setIsSettingsOpen={setIsSettingsOpen}
      />
    );

    // Find close button inside mock
    const closeBtn = screen.getByText("Close");
    fireEvent.click(closeBtn);
    expect(setIsSettingsOpen).toHaveBeenCalledWith(false);
  });
});
