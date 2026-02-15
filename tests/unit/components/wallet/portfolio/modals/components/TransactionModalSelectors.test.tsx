import { describe, expect, it, vi } from "vitest";

import {
  EmptyAssetsMessage,
  TokenOptionButton,
  TransactionModalContent,
} from "@/components/wallet/portfolio/modals/components/TransactionModalSelectors";

import { render, screen } from "../../../../../../test-utils";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock("lucide-react", () => {
  const Icon = () => <svg />;
  return {
    Check: (props: any) => <svg data-testid="check-icon" {...props} />,
    CheckCircle: Icon,
    AlertCircle: Icon,
    AlertTriangle: Icon,
    XCircle: Icon,
    ExternalLink: Icon,
    X: Icon,
  };
});

vi.mock("next/image", () => ({
  default: (props: any) => <div data-testid="next-image" {...props} />,
}));

vi.mock("@/lib/ui/classNames", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/lib/ui/animationVariants", () => ({
  dropdownMenu: {},
}));

vi.mock("@/components/wallet/portfolio/modals/utils/assetHelpers", () => ({
  getChainLogo: vi.fn(() => "/chain.png"),
}));

vi.mock("@/components/wallet/portfolio/modals/utils/modalHelpers", () => ({
  buildFormActionsProps: vi.fn(() => ({})),
}));

vi.mock(
  "@/components/wallet/portfolio/modals/components/CompactSelectorButton",
  () => ({
    CompactSelectorButton: (props: any) => (
      <button data-testid="selector-btn" onClick={props.onClick}>
        {props.label}: {props.value}
      </button>
    ),
  })
);

vi.mock(
  "@/components/wallet/portfolio/modals/components/TransactionModalParts",
  () => ({
    TransactionFormActionsWithForm: () => <div data-testid="form-actions" />,
  })
);

describe("TokenOptionButton", () => {
  it("renders symbol text and first character", () => {
    const onSelect = vi.fn();
    render(
      <TokenOptionButton
        symbol="USDC"
        balanceLabel="100.00"
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("renders balance label", () => {
    const onSelect = vi.fn();
    render(
      <TokenOptionButton
        symbol="ETH"
        balanceLabel="5.25 ETH"
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("5.25 ETH")).toBeInTheDocument();
  });

  it("shows check icon when selected", () => {
    const onSelect = vi.fn();
    render(
      <TokenOptionButton
        symbol="DAI"
        balanceLabel="1000.00"
        isSelected={true}
        onSelect={onSelect}
      />
    );

    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
  });

  it("does not show check icon when not selected", () => {
    const onSelect = vi.fn();
    render(
      <TokenOptionButton
        symbol="WBTC"
        balanceLabel="0.5"
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.queryByTestId("check-icon")).not.toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(
      <TokenOptionButton
        symbol="USDT"
        balanceLabel="500.00"
        isSelected={false}
        onSelect={onSelect}
      />
    );

    const button = screen.getByRole("button");
    button.click();

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe("EmptyAssetsMessage", () => {
  it("renders default 'No assets found.' message", () => {
    render(<EmptyAssetsMessage />);

    expect(screen.getByText("No assets found.")).toBeInTheDocument();
  });

  it("renders custom message", () => {
    const customMessage =
      "Your wallet is empty. Add some tokens to get started.";
    render(<EmptyAssetsMessage message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });
});

describe("TransactionModalContent", () => {
  const mockForm = {
    setValue: vi.fn(),
    getValues: vi.fn(),
    watch: vi.fn(),
    register: vi.fn(),
    handleSubmit: vi.fn(),
  };

  const mockTransactionData = {
    selectedToken: { symbol: "USDC", usdPrice: 1.0 },
    chainList: [{ chainId: 1, name: "Ethereum" }],
  };

  const mockModalState = {
    form: mockForm,
    chainId: 1,
    amount: "100",
    transactionData: mockTransactionData,
    selectedChain: { chainId: 1, name: "Ethereum" },
    isSubmitDisabled: false,
    handleSubmit: vi.fn(),
  };

  const mockDropdownState = {
    dropdownRef: { current: null },
    isChainDropdownOpen: false,
    isAssetDropdownOpen: false,
    toggleChainDropdown: vi.fn(),
    toggleAssetDropdown: vi.fn(),
    closeDropdowns: vi.fn(),
  };

  const mockAssetContent = <div data-testid="asset-content">Asset List</div>;

  const defaultProps = {
    modalState: mockModalState as any,
    dropdownState: mockDropdownState as any,
    actionLabel: "Deposit",
    actionGradient: "from-blue-500 to-purple-500",
    handlePercentage: vi.fn(),
    assetContent: mockAssetContent,
  };

  it("renders with chain and asset selectors", () => {
    render(<TransactionModalContent {...defaultProps} />);

    const selectorButtons = screen.getAllByTestId("selector-btn");
    expect(selectorButtons).toHaveLength(2);
  });

  it("renders form actions section", () => {
    render(<TransactionModalContent {...defaultProps} />);

    expect(screen.getByTestId("form-actions")).toBeInTheDocument();
  });
});
