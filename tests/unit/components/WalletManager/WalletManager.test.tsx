import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WalletManager } from "@/components/WalletManager/WalletManager";
import { useUser } from "@/contexts/UserContext";
import { useAsyncRetryButton } from "@/hooks/ui/useAsyncRetryButton";

// Mock Child Components
vi.mock("@/components/WalletManager/components/WalletList", () => ({
  WalletList: ({ onAddWallet, onWalletChange }: any) => (
    <div data-testid="wallet-list">
      <button onClick={onAddWallet}>Add Wallet</button>
      <button onClick={() => onWalletChange({ label: "changed" })}>
        Change Wallet
      </button>
    </div>
  ),
}));

vi.mock("@/components/WalletManager/contexts/WalletListContext", () => ({
  WalletListProvider: ({ children }: any) => (
    <div data-testid="wallet-list-provider">{children}</div>
  ),
}));

vi.mock("@/components/WalletManager/components/EmailSubscription", () => ({
  EmailSubscription: () => <div data-testid="email-subscription" />,
}));

vi.mock("@/components/WalletManager/components/DeleteAccountButton", () => ({
  DeleteAccountButton: () => <div data-testid="delete-account-button" />,
}));

vi.mock("@/components/WalletManager/components/EditWalletModal", () => ({
  EditWalletModal: () => <div data-testid="edit-wallet-modal" />,
}));

// Mock Hooks
vi.mock("@/contexts/UserContext");
vi.mock("@/hooks/ui/useAsyncRetryButton");
vi.mock("@/components/WalletManager/hooks/useWalletOperations", () => ({
  useWalletOperations: () => ({
    wallets: [],
    operations: {},
    isRefreshing: false,
    newWallet: {},
    editingWallet: null,
    setNewWallet: vi.fn(),
    setEditingWallet: vi.fn(),
    setIsAdding: vi.fn(),
    setValidationError: vi.fn(),
    handleAddWallet: vi.fn(),
    handleDeleteWallet: vi.fn(),
    handleDeleteAccount: vi.fn(),
    handleEditLabel: vi.fn(),
    handleCopyAddress: vi.fn(),
  }),
}));

vi.mock("@/components/WalletManager/hooks/useEmailSubscription", () => ({
  useEmailSubscription: () => ({
    email: "test@example.com",
    subscribedEmail: "test@example.com",
    isEditingSubscription: false,
    handleSubscribe: vi.fn(),
    handleUnsubscribe: vi.fn(),
    setEmail: vi.fn(),
    startEditingSubscription: vi.fn(),
    cancelEditingSubscription: vi.fn(),
  }),
}));

vi.mock("@/components/WalletManager/hooks/useDropdownMenu", () => ({
  useDropdownMenu: () => ({
    openDropdown: null,
    menuPosition: {},
    toggleDropdown: vi.fn(),
    closeDropdown: vi.fn(),
  }),
}));

describe("WalletManager", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    urlUserId: "user-1",
    onEmailSubscribed: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUser).mockReturnValue({
      userInfo: { userId: "user-1" },
      loading: false,
      error: null,
      isConnected: true,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useAsyncRetryButton).mockReturnValue({
      handleRetry: vi.fn(),
      isRetrying: false,
    } as any);
  });

  it("returns null if not open", () => {
    const { container } = render(
      <WalletManager {...defaultProps} isOpen={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders loading skeleton when loading", () => {
    vi.mocked(useUser).mockReturnValue({
      userInfo: { userId: "user-1" },
      loading: true,
    } as any);

    render(<WalletManager {...defaultProps} />);
    // Need to check for skeleton elements or text indicating loading
    expect(screen.getByText("Loading bundled wallets...")).toBeInTheDocument();
  });

  it("renders content when loaded", () => {
    render(<WalletManager {...defaultProps} />);
    expect(screen.getByText("Bundled Wallets")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-list")).toBeInTheDocument();
  });

  it("renders error state", () => {
    vi.mocked(useUser).mockReturnValue({
      userInfo: { userId: "user-1" },
      loading: false,
      error: "Failed to load",
    } as any);

    render(<WalletManager {...defaultProps} />);
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("renders owner exclusive components", () => {
    // Current user = urlUserId = Owner
    vi.mocked(useUser).mockReturnValue({
      userInfo: { userId: "user-1" },
      loading: false,
    } as any);

    render(<WalletManager {...defaultProps} urlUserId="user-1" />);

    expect(screen.getByTestId("email-subscription")).toBeInTheDocument();
    expect(screen.getByTestId("delete-account-button")).toBeInTheDocument();
  });

  it("hides owner components for viewer", () => {
    // Current user != urlUserId
    vi.mocked(useUser).mockReturnValue({
      userInfo: { userId: "user-2" },
      loading: false,
    } as any);

    render(<WalletManager {...defaultProps} urlUserId="user-1" />);

    expect(screen.queryByTestId("email-subscription")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("delete-account-button")
    ).not.toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    render(<WalletManager {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Close wallet manager"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
