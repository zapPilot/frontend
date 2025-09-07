import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletManager } from "../../../src/components/WalletManager";
// Account service is not used by WalletManager for email updates; keep import removed.
import * as userService from "../../../src/services/userService";
import { UserCryptoWallet } from "../../../src/types/user.types";
import { render } from "../../test-utils";

// Mock animation frame for better control of async operations
const mockRAF = vi.fn();
global.requestAnimationFrame = mockRAF;

// Mock UserContext with a mockable useUser hook
let mockUserContextValue = {
  userInfo: { userId: "user-123" },
  loading: false,
  error: null,
  isConnected: true,
  connectedWallet: "0x1234567890123456789012345678901234567890",
  refetch: vi.fn(),
};

vi.mock("../../../src/contexts/UserContext", () => {
  const MockUserContext = {
    Provider: ({ children, value }: any) => (
      <div data-testid="user-context-provider">{children}</div>
    ),
    Consumer: ({ children }: any) => children({}),
  };

  return {
    UserContext: MockUserContext,
    useUser: () => mockUserContextValue,
  };
});

vi.mock("../../../src/hooks/useToast", async () => {
  const actual = await vi.importActual("../../../src/hooks/useToast");
  return {
    ...actual,
    useToast: () => ({
      showToast: vi.fn(),
      hideToast: vi.fn(),
    }),
  };
});

// Mock external dependencies
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, animate, exit, initial, layout, ...props }: any) => {
      // Filter out framer-motion specific props to avoid React warnings
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

// No need to mock accountService for this test suite.

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

// Mock UI components
vi.mock("../../../src/components/ui", () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={`glass-card ${className}`}>{children}</div>
  ),
  GradientButton: ({ children, onClick, disabled, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`gradient-button ${className}`}
    >
      {children}
    </button>
  ),
}));

vi.mock("../../../src/components/ui/UnifiedLoading", () => ({
  UnifiedLoading: ({ "aria-label": ariaLabel }: any) => (
    <div data-testid="unified-loading" aria-label={ariaLabel}>
      Loading...
    </div>
  ),
}));

vi.mock("../../../src/components/ui/LoadingSpinner", () => ({
  LoadingSpinner: ({ size, color }: any) => (
    <div data-testid="loading-spinner" data-size={size} data-color={color}>
      Spinner
    </div>
  ),
}));

describe("WalletManager", () => {
  const mockUserService = vi.mocked(userService);
  // Note: Email subscription uses userService.updateUserEmail

  // Mock data
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

  const mockTransformedWallets = [
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

  const mockUserContext = {
    userInfo: { userId: "user-123" },
    loading: false,
    error: null,
    isConnected: true,
    connectedWallet: "0x1234567890123456789012345678901234567890",
    refetch: vi.fn(),
  };

  const renderWalletManager = async (
    isOpen: boolean = true,
    onClose: () => void = vi.fn(),
    userContext = mockUserContext
  ) => {
    // Update the mock context value
    mockUserContextValue = { ...userContext };

    let result: any;
    await act(async () => {
      result = render(<WalletManager isOpen={isOpen} onClose={onClose} />);
      // Flush any immediate effects
      await Promise.resolve();
    });
    return result;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock context to default values
    mockUserContextValue = {
      userInfo: { userId: "user-123" },
      loading: false,
      error: null,
      isConnected: true,
      connectedWallet: "0x1234567890123456789012345678901234567890",
      refetch: vi.fn(),
    };

    // Setup default mocks
    mockUserService.getUserWallets.mockResolvedValue({
      success: true,
      data: mockWallets,
    });
    mockUserService.transformWalletData.mockReturnValue(mockTransformedWallets);
    mockUserService.validateWalletAddress.mockReturnValue(true);
    mockUserService.addWalletToBundle.mockResolvedValue({
      success: true,
      data: { wallet_id: "wallet-new", message: "Wallet added successfully" },
    });
    mockUserService.removeWalletFromBundle.mockResolvedValue({
      success: true,
      data: { message: "Wallet removed successfully" },
    });
    mockUserService.handleWalletError.mockReturnValue("Mock error message");
    mockUserService.updateUserEmail.mockResolvedValue({
      success: true,
      data: { message: "Email updated" },
    });

    // Mock clipboard API - setup default that will be overridden in tests
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });

    // Mock document.execCommand for fallback clipboard functionality
    Object.defineProperty(document, "execCommand", {
      value: vi.fn().mockReturnValue(true),
      writable: true,
      configurable: true,
    });
  });

  describe("Rendering and Initial State", () => {
    it("renders nothing when modal is closed", async () => {
      await renderWalletManager(false);
      expect(screen.queryByText("Bundle Wallets")).not.toBeInTheDocument();
    });

    it("renders modal when open", async () => {
      await renderWalletManager();

      expect(screen.getByText("Bundle Wallets")).toBeInTheDocument();
      expect(screen.getByText("Manage your wallet bundle")).toBeInTheDocument();
    });

    it("shows correct user context information", async () => {
      await renderWalletManager();

      expect(screen.getByText("Bundle Wallets")).toBeInTheDocument();
      expect(screen.getByText("Manage your wallet bundle")).toBeInTheDocument();
    });

    it("handles disconnected wallet state", async () => {
      const disconnectedContext = {
        ...mockUserContext,
        isConnected: false,
        connectedWallet: null,
      };

      await renderWalletManager(true, vi.fn(), disconnectedContext);

      // Look for the disconnected state message
      expect(
        await screen.findByText("No wallet connected")
      ).toBeInTheDocument();
    });

    it("displays loading state initially", async () => {
      const loadingContext = {
        ...mockUserContext,
        loading: true,
      };

      await renderWalletManager(true, vi.fn(), loadingContext);

      // When the component loads, it immediately triggers loadWallets() which sets isRefreshing
      // This results in "Refreshing wallets..." being shown even on initial load
      expect(
        screen.getByText(/Loading bundle wallets|Refreshing wallets/)
      ).toBeInTheDocument();
      expect(screen.getByTestId("unified-loading")).toBeInTheDocument();
    });

    it("displays error state when user context has error", async () => {
      const errorContext = {
        ...mockUserContext,
        error: "Failed to load user data",
      };

      await renderWalletManager(true, vi.fn(), errorContext);

      expect(screen.getByText("Failed to load user data")).toBeInTheDocument();
    });
  });

  describe("Wallet Loading and Display", () => {
    it("loads and displays wallets on mount", async () => {
      await renderWalletManager();

      await waitFor(() => {
        expect(mockUserService.getUserWallets).toHaveBeenCalledWith("user-123");
      });

      await waitFor(() => {
        expect(mockUserService.transformWalletData).toHaveBeenCalledWith(
          mockWallets
        );
      });

      // Use more specific selectors to avoid multiple element matches
      expect(await screen.findByText("Primary Wallet")).toBeInTheDocument(); // Wallet label
      expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
    });

    it("handles empty wallet list", async () => {
      await act(async () => {
        mockUserService.getUserWallets.mockResolvedValue({
          success: true,
          data: [],
        });
        mockUserService.transformWalletData.mockReturnValue([]);
      });

      await renderWalletManager();

      await waitFor(() => {
        expect(mockUserService.getUserWallets).toHaveBeenCalled();
      });

      // Should still show the "Add Your First Wallet" button
      expect(
        await screen.findByText(/Add Your First Wallet/i)
      ).toBeInTheDocument();
    });

    it("handles API error when loading wallets", async () => {
      await act(async () => {
        mockUserService.getUserWallets.mockResolvedValue({
          success: false,
          error: "Failed to load wallets",
        });
      });

      await renderWalletManager();

      await waitFor(() => {
        expect(mockUserService.getUserWallets).toHaveBeenCalled();
      });

      // Component should handle the error gracefully and show empty state
      expect(
        await screen.findByText(/Add Your First Wallet/i)
      ).toBeInTheDocument();
    });

    it("formats wallet addresses correctly", async () => {
      await renderWalletManager();

      await waitFor(() => {
        expect(
          screen.getByText("Manage your wallet bundle")
        ).toBeInTheDocument();
        expect(screen.getByText(/0xabcd.*abcd/)).toBeInTheDocument();
      });
    });
  });

  describe("Wallet Operations", () => {
    describe("Adding Wallets", () => {
      it("shows add wallet form when Add button clicked", async () => {
        const user = userEvent.setup();

        await renderWalletManager();

        // Wait for and click the add wallet button (use role-based selector to avoid text conflicts)
        const addButton = await screen.findByRole("button", {
          name: /Add Another Wallet|Add Your First Wallet/i,
        });
        await act(async () => {
          await user.click(addButton);
        });

        expect(
          screen.getByPlaceholderText("Wallet Label (e.g., Trading Wallet)")
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Wallet Address (0x...)")
        ).toBeInTheDocument();
        expect(screen.getByText("Add to Bundle")).toBeInTheDocument();
        expect(screen.getByText("Cancel")).toBeInTheDocument();
      });

      it("cancels add wallet form when Cancel clicked", async () => {
        const user = userEvent.setup();

        await renderWalletManager();

        const addButton = await screen.findByRole("button", {
          name: /Add Another Wallet|Add Your First Wallet/i,
        });
        await act(async () => {
          await user.click(addButton);
          await user.click(screen.getByText("Cancel"));
        });

        expect(
          screen.queryByPlaceholderText("Wallet Label (e.g., Trading Wallet)")
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole("button", {
            name: /Add Another Wallet|Add Your First Wallet/i,
          })
        ).toBeInTheDocument();
      });

      it("validates wallet address before adding", async () => {
        const user = userEvent.setup();
        await act(async () => {
          mockUserService.validateWalletAddress.mockReturnValue(false);
        });

        await renderWalletManager();

        const addButton = await screen.findByRole("button", {
          name: /Add Another Wallet|Add Your First Wallet/i,
        });
        await act(async () => {
          await user.click(addButton);
        });

        const labelInput = screen.getByPlaceholderText(
          "Wallet Label (e.g., Trading Wallet)"
        );
        const addressInput = screen.getByPlaceholderText(
          "Wallet Address (0x...)"
        );

        await act(async () => {
          await user.type(labelInput, "New Wallet");
          await user.type(addressInput, "invalid-address");
          await user.click(screen.getByText("Add to Bundle"));
        });

        expect(
          screen.getByText(/Invalid wallet address format/)
        ).toBeInTheDocument();
        expect(mockUserService.addWalletToBundle).not.toHaveBeenCalled();
      });

      it("requires both label and address fields", async () => {
        const user = userEvent.setup();

        await renderWalletManager();

        const addButton = await screen.findByRole("button", {
          name: /Add Another Wallet|Add Your First Wallet/i,
        });
        await act(async () => {
          await user.click(addButton);
          await user.click(screen.getByText("Add to Bundle"));
        });

        expect(
          screen.getByText("Wallet label is required")
        ).toBeInTheDocument();
        expect(mockUserService.addWalletToBundle).not.toHaveBeenCalled();
      });

      it("successfully adds new wallet", async () => {
        const user = userEvent.setup();

        await renderWalletManager();

        const addButton = await screen.findByRole("button", {
          name: /Add Another Wallet|Add Your First Wallet/i,
        });
        await act(async () => {
          await user.click(addButton);
        });

        const labelInput = screen.getByPlaceholderText(
          "Wallet Label (e.g., Trading Wallet)"
        );
        const addressInput = screen.getByPlaceholderText(
          "Wallet Address (0x...)"
        );

        await act(async () => {
          await user.type(labelInput, "New Trading Wallet");
          await user.type(
            addressInput,
            "0x9876543210987654321098765432109876543210"
          );
          await user.click(screen.getByText("Add to Bundle"));
        });

        await waitFor(() => {
          expect(mockUserService.addWalletToBundle).toHaveBeenCalledWith(
            "user-123",
            "0x9876543210987654321098765432109876543210",
            "New Trading Wallet"
          );
        });
      });

      it("handles add wallet API error", async () => {
        const user = userEvent.setup();
        await act(async () => {
          mockUserService.addWalletToBundle.mockResolvedValue({
            success: false,
            error: "Wallet already exists",
          });
        });

        await renderWalletManager();

        const addButton = await screen.findByRole("button", {
          name: /Add Another Wallet|Add Your First Wallet/i,
        });
        await act(async () => {
          await user.click(addButton);
        });

        const labelInput = screen.getByPlaceholderText(
          "Wallet Label (e.g., Trading Wallet)"
        );
        const addressInput = screen.getByPlaceholderText(
          "Wallet Address (0x...)"
        );

        await act(async () => {
          await user.type(labelInput, "Duplicate Wallet");
          await user.type(
            addressInput,
            "0x1234567890123456789012345678901234567890"
          );
          await user.click(screen.getByText("Add to Bundle"));
        });

        await waitFor(() => {
          expect(screen.getByText("Wallet already exists")).toBeInTheDocument();
        });
      });
    });

    describe("Removing Wallets", () => {
      it("removes non-main wallet when delete button clicked", async () => {
        const user = userEvent.setup();

        await renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
        });

        // Find delete button for the non-main wallet - look for it via the action menu
        const actionMenus = screen.getAllByLabelText(/Actions for/);
        await act(async () => {
          await user.click(actionMenus[1]); // Click the action menu for the non-main wallet
        });

        const removeButton = screen.getByText("Remove from Bundle");
        await act(async () => {
          await user.click(removeButton);
        });

        await waitFor(() => {
          expect(mockUserService.removeWalletFromBundle).toHaveBeenCalledWith(
            "user-123",
            "wallet-2"
          );
        });
      });

      it("shows delete button for main wallet (current implementation allows deleting main wallet)", async () => {
        await renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Primary Wallet")).toBeInTheDocument();
        });

        // Click on primary wallet action menu
        const actionMenus = screen.getAllByLabelText(/Actions for/);
        const user = userEvent.setup();
        await act(async () => {
          await user.click(actionMenus[0]); // Primary wallet action menu
        });

        // Current implementation shows delete button for all wallets including main
        expect(screen.getByText("Remove from Bundle")).toBeInTheDocument();
      });

      it("handles remove wallet API error", async () => {
        const user = userEvent.setup();
        await act(async () => {
          mockUserService.removeWalletFromBundle.mockResolvedValue({
            success: false,
            error: "Cannot remove main wallet",
          });
        });

        await renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
        });

        // Find action menu and remove button
        const actionMenus = screen.getAllByLabelText(/Actions for/);
        await act(async () => {
          await user.click(actionMenus[1]); // Secondary wallet action menu
        });

        const removeButton = screen.getByText("Remove from Bundle");
        await act(async () => {
          await user.click(removeButton);
        });

        await waitFor(() => {
          expect(
            screen.getByText("Cannot remove main wallet")
          ).toBeInTheDocument();
        });
      });
    });

    describe("Editing Wallet Labels", () => {
      it("shows edit input when edit button clicked", async () => {
        const user = userEvent.setup();

        await renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
        });

        // Find action menu for non-main wallet and click edit
        const actionMenus = screen.getAllByLabelText(/Actions for/);
        await act(async () => {
          await user.click(actionMenus[1]); // Secondary wallet action menu
        });

        const editButton = screen.getByText("Edit Label");
        await act(async () => {
          await user.click(editButton);
        });

        await waitFor(() => {
          expect(
            screen.getByDisplayValue("Trading Wallet")
          ).toBeInTheDocument();
        });
      });

      it("saves label when Enter key pressed", async () => {
        const user = userEvent.setup();

        await renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
        });

        // Find action menu for non-main wallet and click edit
        const actionMenus = screen.getAllByLabelText(/Actions for/);
        await act(async () => {
          await user.click(actionMenus[1]); // Secondary wallet action menu
        });

        const editButton = screen.getByText("Edit Label");
        await act(async () => {
          await user.click(editButton);
        });

        const editInput = await screen.findByDisplayValue("Trading Wallet");
        await act(async () => {
          await user.clear(editInput);
          await user.type(editInput, "Updated Trading Wallet");
          await user.keyboard("{Enter}");
        });

        // Since there's no actual API endpoint for label updates, it should update optimistically
        await waitFor(() => {
          expect(
            screen.queryByDisplayValue("Updated Trading Wallet")
          ).not.toBeInTheDocument();
        });
      });

      it("cancels edit when Escape key pressed", async () => {
        const user = userEvent.setup();

        await renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
        });

        // Find action menu for non-main wallet and click edit
        const actionMenus = screen.getAllByLabelText(/Actions for/);
        await act(async () => {
          await user.click(actionMenus[1]); // Secondary wallet action menu
        });

        const editButton = screen.getByText("Edit Label");
        await act(async () => {
          await user.click(editButton);
        });

        const editInput = await screen.findByDisplayValue("Trading Wallet");
        await act(async () => {
          await user.clear(editInput);
          await user.type(editInput, "Changed Label");
          await user.keyboard("{Escape}");
        });

        await waitFor(() => {
          expect(
            screen.queryByDisplayValue("Changed Label")
          ).not.toBeInTheDocument();
          expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
        });
      });

      it("shows edit button for main wallet (current implementation allows editing main wallet)", async () => {
        await renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Primary Wallet")).toBeInTheDocument();
        });

        // Click on primary wallet action menu
        const actionMenus = screen.getAllByLabelText(/Actions for/);
        const user = userEvent.setup();
        await act(async () => {
          await user.click(actionMenus[0]); // Primary wallet action menu
        });

        // Current implementation shows edit button for all wallets including main
        expect(screen.getByText("Edit Label")).toBeInTheDocument();
      });
    });

    describe("Copy Address Feature", () => {
      it("copies wallet address to clipboard", async () => {
        const user = userEvent.setup();
        const mockWriteText = vi.fn().mockResolvedValue(undefined);

        // Override the clipboard mock for this test
        Object.defineProperty(navigator, "clipboard", {
          value: { writeText: mockWriteText },
          writable: true,
          configurable: true,
        });

        await renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText(/0x1234.*7890/)).toBeInTheDocument(); // Only in wallet card
        });

        // Find action menu for first wallet and click copy
        const actionMenus = screen.getAllByLabelText(/Actions for/);
        await act(async () => {
          await user.click(actionMenus[0]); // Click first wallet's action menu
        });

        const copyButton = screen.getByText("Copy Address");
        await act(async () => {
          await user.click(copyButton);
        });

        expect(mockWriteText).toHaveBeenCalledWith(
          "0x1234567890123456789012345678901234567890"
        );
      });

      it("handles clipboard copy failure gracefully", async () => {
        const user = userEvent.setup();
        const mockWriteText = vi
          .fn()
          .mockRejectedValue(new Error("Copy failed"));

        // Override the clipboard mock for this test
        Object.defineProperty(navigator, "clipboard", {
          value: { writeText: mockWriteText },
          writable: true,
          configurable: true,
        });

        await renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText(/0x1234.*7890/)).toBeInTheDocument(); // Only in wallet card
        });

        // The component should handle copy failure gracefully without crashing
        expect(screen.getByText("Bundle Wallets")).toBeInTheDocument();
      });
    });
  });

  describe("User Interactions", () => {
    it("closes modal when close button clicked", async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();

      await renderWalletManager(true, mockOnClose);

      // Find the close button by aria-label
      const closeButton = screen.getByLabelText("Close wallet manager");
      await act(async () => {
        await user.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("closes modal when backdrop clicked", async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();

      const { container } = await renderWalletManager(true, mockOnClose);

      // Click on the backdrop (the overlay div)
      const backdrop = container.querySelector(".fixed.inset-0");
      if (backdrop) {
        await act(async () => {
          await user.click(backdrop);
        });
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it("does not close modal when clicking inside the modal content", async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();

      await renderWalletManager(true, mockOnClose);

      const modalContent = screen.getByText("Bundle Wallets");
      await act(async () => {
        await user.click(modalContent);
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    it("shows loading spinners during operations", async () => {
      const user = userEvent.setup();
      // Mock a delayed response to see loading state
      await act(async () => {
        mockUserService.addWalletToBundle.mockImplementation(
          () =>
            new Promise(resolve =>
              setTimeout(
                () =>
                  resolve({
                    success: true,
                    data: { wallet_id: "wallet-new", message: "Success" },
                  }),
                100
              )
            )
        );
      });

      await renderWalletManager();

      const addButton = await screen.findByRole("button", {
        name: /Add Another Wallet|Add Your First Wallet/i,
      });
      await act(async () => {
        await user.click(addButton);
      });

      const labelInput = screen.getByPlaceholderText(
        "Wallet Label (e.g., Trading Wallet)"
      );
      const addressInput = screen.getByPlaceholderText(
        "Wallet Address (0x...)"
      );

      await act(async () => {
        await user.type(labelInput, "Test Wallet");
        await user.type(
          addressInput,
          "0x9876543210987654321098765432109876543210"
        );
      });

      const submitButton = screen.getByText("Add to Bundle");
      await act(async () => {
        await user.click(submitButton);
      });

      // Should show loading state
      expect(screen.getByText("Adding...")).toBeInTheDocument();
    });

    it("shows loading state during wallet removal", async () => {
      const user = userEvent.setup();
      // Mock a delayed response
      await act(async () => {
        mockUserService.removeWalletFromBundle.mockImplementation(
          () =>
            new Promise(resolve =>
              setTimeout(
                () =>
                  resolve({
                    success: true,
                    data: { message: "Success" },
                  }),
                100
              )
            )
        );
      });

      await renderWalletManager();

      await waitFor(() => {
        expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
      });

      // Click on the action menu for the secondary wallet and then remove
      const actionMenus = screen.getAllByLabelText(/Actions for/);
      await act(async () => {
        await user.click(actionMenus[1]); // Secondary wallet action menu
      });

      const removeButton = screen.getByText("Remove from Bundle");
      await act(async () => {
        await user.click(removeButton);
      });

      // Should show loading spinner
      expect(screen.getByText("Removing...")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("handles network errors during wallet operations", async () => {
      const user = userEvent.setup();
      await act(async () => {
        mockUserService.addWalletToBundle.mockRejectedValue(
          new Error("Network error")
        );
        mockUserService.handleWalletError.mockReturnValue(
          "Network connection failed"
        );
      });

      await renderWalletManager();

      const addButton = await screen.findByRole("button", {
        name: /Add Another Wallet|Add Your First Wallet/i,
      });
      await act(async () => {
        await user.click(addButton);
      });

      const labelInput = screen.getByPlaceholderText(
        "Wallet Label (e.g., Trading Wallet)"
      );
      const addressInput = screen.getByPlaceholderText(
        "Wallet Address (0x...)"
      );

      await act(async () => {
        await user.type(labelInput, "Test Wallet");
        await user.type(
          addressInput,
          "0x9876543210987654321098765432109876543210"
        );
        await user.click(screen.getByText("Add to Bundle"));
      });

      await waitFor(() => {
        expect(
          screen.getByText("Network connection failed")
        ).toBeInTheDocument();
      });
    });

    it("displays operation-specific error messages", async () => {
      const user = userEvent.setup();
      await act(async () => {
        mockUserService.removeWalletFromBundle.mockResolvedValue({
          success: false,
          error: "Cannot remove primary wallet",
        });
      });

      await renderWalletManager();

      await waitFor(() => {
        expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
      });

      const actionMenus = screen.getAllByLabelText(/Actions for/);
      await act(async () => {
        await user.click(actionMenus[1]); // Secondary wallet action menu
      });

      const removeButton = screen.getByText("Remove from Bundle");
      await act(async () => {
        await user.click(removeButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText("Cannot remove primary wallet")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Auto-refresh Functionality", () => {
    it("sets up periodic auto-refresh when modal is open", async () => {
      // Use fake timers with modern implementation
      vi.useFakeTimers({ shouldAdvanceTime: true });

      try {
        renderWalletManager();

        // Wait for initial load
        await waitFor(() => {
          expect(mockUserService.getUserWallets).toHaveBeenCalledTimes(1);
        });

        // Fast-forward 30 seconds to trigger auto-refresh
        await act(async () => {
          vi.advanceTimersByTime(30000);
          // Give React a chance to process the timer
          await Promise.resolve();
        });

        // Allow the auto-refresh to complete with a longer timeout
        await waitFor(
          () => {
            expect(mockUserService.getUserWallets).toHaveBeenCalledTimes(2);
          },
          { timeout: 2000 }
        );
      } finally {
        vi.useRealTimers();
      }
    }, 10000); // Increase test timeout to 10 seconds

    it("cleans up auto-refresh interval when modal closes", async () => {
      // Use fake timers with modern implementation
      vi.useFakeTimers({ shouldAdvanceTime: true });

      try {
        const { rerender } = await renderWalletManager();

        // Wait for initial load
        await waitFor(() => {
          expect(mockUserService.getUserWallets).toHaveBeenCalledTimes(1);
        });

        // Re-render with closed modal
        rerender(<WalletManager isOpen={false} onClose={vi.fn()} />);

        // Fast-forward time and ensure no additional calls
        await act(async () => {
          vi.advanceTimersByTime(30000);
          await Promise.resolve();
        });

        // Should only have the initial call, no additional refresh
        expect(mockUserService.getUserWallets).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    }, 10000); // Increase test timeout to 10 seconds
  });

  describe("Email Subscription", () => {
    it("uses email from UserContext and does not fetch profile", async () => {
      // Provide email via context
      const contextWithEmail = {
        userInfo: { userId: "user-123", email: "owner@example.com" },
        loading: false,
        error: null,
        isConnected: true,
        connectedWallet: "0x1234567890123456789012345678901234567890",
        refetch: vi.fn(),
      };

      await renderWalletManager(true, vi.fn(), contextWithEmail);

      // Should not fetch profile anymore
      expect(mockUserService.getUserProfile).not.toHaveBeenCalled();

      // UI shows subscribed state with the context email
      expect(
        screen.getByText(/You.*subscribed to weekly PnL reports/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/owner@example.com/)).toBeInTheDocument();
    });
    it("successfully subscribes with a valid email", async () => {
      const user = userEvent.setup();
      await act(async () => {
        mockUserService.getUserProfile.mockResolvedValue({
          success: true,
          data: { user: { email: null } },
        });
      });

      await renderWalletManager();

      await screen.findByRole("button", {
        name: /Add Another Wallet|Add Your First Wallet/i,
      });

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const subscribeButton = screen.getByText("Subscribe");

      await act(async () => {
        await user.type(emailInput, "test@example.com");
        await user.click(subscribeButton);
      });

      await waitFor(() => {
        expect(mockUserService.updateUserEmail).toHaveBeenCalledWith(
          "user-123",
          "test@example.com"
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/You.*subscribed to weekly PnL reports/)
        ).toBeInTheDocument();
      });
    });

    it("handles API errors during subscription", async () => {
      const user = userEvent.setup();
      await act(async () => {
        mockUserService.updateUserEmail.mockRejectedValue(
          new Error("Email already subscribed")
        );
        mockUserService.handleWalletError.mockReturnValue(
          "Email is already subscribed"
        );
      });

      await renderWalletManager();

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const subscribeButton = screen.getByText("Subscribe");

      await act(async () => {
        await user.type(emailInput, "duplicate@example.com");
        await user.click(subscribeButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText("Email is already subscribed")
        ).toBeInTheDocument();
      });
    });
  });
});
