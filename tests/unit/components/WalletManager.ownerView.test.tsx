import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletManager } from "../../../src/components/WalletManager";
import * as userService from "../../../src/services/userService";
import { UserCryptoWallet } from "../../../src/types/user.types";
import { render } from "../../test-utils";

// Mock UserContext
let mockUserContextValue = {
  userInfo: { userId: "user-123" },
  loading: false,
  error: null as string | null,
  isConnected: true,
  connectedWallet: "0x1234567890123456789012345678901234567890",
  refetch: vi.fn(),
};

vi.mock("../../../src/contexts/UserContext", () => ({
  useUser: () => mockUserContextValue,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, animate, exit, initial, layout, ...props }: any) => {
      const cleanProps = { ...props };
      delete cleanProps.animate;
      delete cleanProps.exit;
      delete cleanProps.initial;
      delete cleanProps.layout;
      return <div {...cleanProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-query client
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

// Mock UI primitives
vi.mock("../../../src/components/ui", () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={`glass-card ${className || ""}`}>{children}</div>
  ),
  GradientButton: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

// Mock Loading components
vi.mock("../../../src/components/ui/UnifiedLoading", () => ({
  UnifiedLoading: ({ "aria-label": ariaLabel }: any) => (
    <div data-testid="unified-loading" aria-label={ariaLabel} />
  ),
}));
vi.mock("../../../src/components/ui/LoadingSpinner", () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

// Mock service layer
vi.mock("../../../src/services/userService", () => ({
  getUserWallets: vi.fn(),
  addWalletToBundle: vi.fn(),
  removeWalletFromBundle: vi.fn(),
  validateWalletAddress: vi.fn(),
  transformWalletData: vi.fn(),
  handleWalletError: vi.fn(),
  getUserProfile: vi.fn(),
  updateUserEmail: vi.fn(),
}));

describe("WalletManager owner/viewer behavior", () => {
  const mockUserService = vi.mocked(userService);

  const mockWallets: UserCryptoWallet[] = [
    {
      id: "wallet-1",
      user_id: "user-123",
      wallet: "0x1234567890123456789012345678901234567890",
      is_main: true,
      label: "Primary Wallet",
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "wallet-2",
      user_id: "user-123",
      wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      is_main: false,
      label: "Trading Wallet",
      created_at: "2024-01-02T00:00:00Z",
    },
  ];

  const mockTransformed = [
    {
      id: "wallet-1",
      address: "0x1234567890123456789012345678901234567890",
      label: "Primary Wallet",
      isMain: true,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "wallet-2",
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      label: "Trading Wallet",
      isMain: false,
      isActive: false,
      createdAt: "2024-01-02T00:00:00Z",
    },
  ];

  const renderManager = async (props?: { urlUserId?: string }) => {
    let result: any;
    await act(async () => {
      result = render(
        <WalletManager isOpen onClose={vi.fn()} {...(props || {})} />
      );
      await Promise.resolve();
    });
    return result;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserContextValue = {
      userInfo: { userId: "user-123" },
      loading: false,
      error: null,
      isConnected: true,
      connectedWallet: "0x1234567890123456789012345678901234567890",
      refetch: vi.fn(),
    };
    mockUserService.getUserWallets.mockResolvedValue({
      success: true,
      data: mockWallets,
    });
    mockUserService.transformWalletData.mockReturnValue(mockTransformed);
  });

  it("uses urlUserId for fetching when viewing another user's bundle", async () => {
    await renderManager({ urlUserId: "viewer-xyz" });

    await waitFor(() => {
      expect(mockUserService.getUserWallets).toHaveBeenCalledWith("viewer-xyz");
    });
  });

  it("hides action menus and subscription when not owner", async () => {
    await renderManager({ urlUserId: "viewer-xyz" });

    // Wait for wallets to render
    await screen.findByText("Primary Wallet");

    // No action menus should be present
    const menus = screen.queryAllByLabelText(/Actions for/);
    expect(menus.length).toBe(0);

    // No Add Another Wallet section header
    expect(screen.queryByText("Add Another Wallet")).not.toBeInTheDocument();

    // No PnL subscription section
    expect(screen.queryByText("Weekly PnL Reports")).not.toBeInTheDocument();
  });

  it("does not auto-refresh for viewer (non-owner)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await renderManager({ urlUserId: "viewer-xyz" });

      await waitFor(() => {
        expect(mockUserService.getUserWallets).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
        await Promise.resolve();
      });

      // Still only the initial fetch
      expect(mockUserService.getUserWallets).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
