/**
 * Unit tests for DepositModal component
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DepositModal } from "@/components/wallet/portfolio/modals/DepositModal";

// Mock all the dependencies
const mockUseWalletProvider = vi.fn(() => ({
  isConnected: true,
}));

vi.mock("@/providers/WalletProvider", () => ({
  useWalletProvider: () => mockUseWalletProvider(),
}));

const mockTransactionData = {
  chainList: [
    { chainId: 1, name: "Ethereum", symbol: "ETH" },
    { chainId: 42161, name: "Arbitrum", symbol: "ETH" },
  ],
  selectedChain: { chainId: 1, name: "Ethereum" },
  availableTokens: [{ symbol: "USDC", address: "0x123", usdPrice: 1 }],
  selectedToken: { symbol: "USDC", address: "0x123", usdPrice: 1 },
  tokenQuery: { data: [], isLoading: false },
  balances: {},
  balanceQuery: { data: { balance: "1000" }, isLoading: false },
  usdAmount: 100,
  isLoadingTokens: false,
  isLoadingBalance: false,
  isLoading: false,
};

// Mock the 3 simplified hooks that TransactionModalBase uses
vi.mock(
  "@/components/wallet/portfolio/modals/hooks/useTransactionForm",
  () => ({
    useTransactionForm: vi.fn(() => ({
      formState: { isValid: true },
      control: {},
      setValue: vi.fn(),
      handleSubmit: vi.fn(cb => () => cb()),
      watch: vi.fn((field: string) => {
        if (field === "chainId") return 1;
        if (field === "tokenAddress") return "0x123";
        if (field === "amount") return "100";
        return "";
      }),
    })),
  })
);

vi.mock(
  "@/components/wallet/portfolio/modals/hooks/useTransactionData",
  () => ({
    useTransactionData: vi.fn(() => mockTransactionData),
  })
);

vi.mock(
  "@/components/wallet/portfolio/modals/hooks/useTransactionSubmission",
  () => ({
    useTransactionSubmission: vi.fn(() => ({
      status: "idle",
      result: null,
      isSubmitting: false,
      isSubmitDisabled: false,
      handleSubmit: vi.fn(),
      resetState: vi.fn(),
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

const mockDropdownState = {
  dropdownRef: { current: null },
  isAssetDropdownOpen: false,
  isChainDropdownOpen: false,
  toggleAssetDropdown: vi.fn(),
  toggleChainDropdown: vi.fn(),
  closeDropdowns: vi.fn(),
};

const mockUseTransactionModalState = vi.fn(() => ({
  isConnected: mockUseWalletProvider().isConnected,
  dropdownState: mockDropdownState,
}));

// Mock the transaction modal dependencies
vi.mock(
  "@/components/wallet/portfolio/modals/transactionModalDependencies",
  () => ({
    buildModalFormState: vi.fn(() => ({
      handlePercentage: vi.fn(),
      isValid: true,
    })),
    resolveActionLabel: vi.fn().mockReturnValue("Review & Deposit"),
    useTransactionModalState: () => mockUseTransactionModalState(),
    TransactionModalContent: ({
      modalState,
    }: {
      modalState: {
        selectedChain?: { name?: string };
        transactionData?: { selectedToken?: { symbol?: string } };
      };
    }) => (
      <div data-testid="transaction-modal-content">
        <button data-testid="selector-network" data-open="false">
          {modalState.selectedChain?.name ?? "Network"}
        </button>
        <button data-testid="selector-asset" data-open="false">
          {modalState.transactionData?.selectedToken?.symbol ?? "Asset"}
        </button>
        <div data-testid="form-actions">Form Actions</div>
      </div>
    ),
    TokenOptionButton: ({
      symbol,
      balanceLabel,
    }: {
      symbol: string;
      balanceLabel: string;
    }) => (
      <div data-testid="token-option">
        {symbol} {balanceLabel}
      </div>
    ),
    EmptyAssetsMessage: () => (
      <div data-testid="empty-assets">No assets found.</div>
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
