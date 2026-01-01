/**
 * Unit tests for DepositModal component
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DepositModal } from "@/components/wallet/portfolio/modals/DepositModal";

// Mock all the dependencies
vi.mock("@/providers/WalletProvider", () => ({
  useWalletProvider: () => ({
    isConnected: true,
  }),
}));

// Mock useTransactionModalState hook that TransactionModalBase uses
vi.mock(
  "@/components/wallet/portfolio/modals/hooks/useTransactionModalState",
  () => ({
    useTransactionModalState: vi.fn(() => ({
      form: {
        formState: { isValid: true },
        control: {},
        setValue: vi.fn(),
        handleSubmit: vi.fn(cb => () => cb()),
      },
      chainId: 1,
      amount: "100",
      transactionData: {
        balanceQuery: { data: { balance: "1000" } },
        selectedToken: { symbol: "USDC", usdPrice: 1 },
        chainList: [
          { chainId: 1, name: "Ethereum", symbol: "ETH" },
          { chainId: 42161, name: "Arbitrum", symbol: "ETH" },
        ],
      },
      statusState: { status: "idle" },
      isSubmitDisabled: false,
      handleSubmit: vi.fn(),
      resetState: vi.fn(),
      selectedChain: { chainId: 1, name: "Ethereum" },
      isSubmitting: false,
    })),
  })
);

vi.mock("@/services", () => ({
  transactionService: {
    simulateDeposit: vi.fn(),
  },
}));

vi.mock("@/components/ui/modal", () => ({
  Modal: ({
    children,
    isOpen,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
  }) => (isOpen ? <div data-testid="modal">{children}</div> : null),
  ModalContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="modal-content" className={className}>
      {children}
    </div>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} data-testid="chain-logo" {...props} />
  ),
}));

// Mock the transaction modal dependencies
vi.mock(
  "@/components/wallet/portfolio/modals/transactionModalDependencies",
  () => ({
    useTransactionModalState: vi.fn(() => ({
      form: {
        formState: { isValid: true },
        control: {},
      },
      amount: "100",
      transactionData: {
        balanceQuery: { data: { balance: "1000" } },
        selectedToken: { symbol: "USDC", usdPrice: 1 },
      },
      statusState: { status: "idle" },
      isSubmitDisabled: false,
      handleSubmit: vi.fn(),
      resetState: vi.fn(),
      selectedChain: { chainId: 42161, name: "Arbitrum" },
      isSubmitting: false,
    })),
    applyPercentageToAmount: vi.fn(),
    resolveActionLabel: () => "Review & Deposit",
    buildFormActionsProps: vi.fn((form, amount) => ({
      form,
      amount,
    })),
    getChainLogo: () => "/chains/arbitrum.svg",
    TransactionModalHeader: ({
      title,
      onClose,
    }: {
      title: string;
      onClose: () => void;
    }) => (
      <div data-testid="modal-header">
        <span>{title}</span>
        <button onClick={onClose} data-testid="close-button">
          Close
        </button>
      </div>
    ),
    CompactSelectorButton: ({
      label,
      value,
    }: {
      label: string;
      value: string;
    }) => (
      <div data-testid={`selector-${label.toLowerCase()}`}>
        {label}: {value}
      </div>
    ),
    TransactionFormActionsWithForm: () => (
      <div data-testid="form-actions">Form Actions</div>
    ),
    SubmittingState: ({
      isSuccess,
      successMessage,
    }: {
      isSuccess: boolean;
      successMessage: string;
    }) => (
      <div data-testid="submitting-state">
        {isSuccess ? successMessage : "Processing..."}
      </div>
    ),
  })
);

describe("DepositModal", () => {
  it("should not render when isOpen is false", () => {
    render(<DepositModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    render(<DepositModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("should render modal header with title", () => {
    render(<DepositModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Deposit to Pilot")).toBeInTheDocument();
  });

  it("should render network and asset selectors", () => {
    render(<DepositModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId("selector-network")).toBeInTheDocument();
    expect(screen.getByTestId("selector-asset")).toBeInTheDocument();
  });

  it("should display selected chain name", () => {
    render(<DepositModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Ethereum/)).toBeInTheDocument();
  });

  it("should display selected token symbol", () => {
    render(<DepositModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/USDC/)).toBeInTheDocument();
  });

  it("should render form actions", () => {
    render(<DepositModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId("form-actions")).toBeInTheDocument();
  });

  it("should accept defaultChainId prop", () => {
    render(
      <DepositModal isOpen={true} onClose={vi.fn()} defaultChainId={42161} />
    );

    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });
});
