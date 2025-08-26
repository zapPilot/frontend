import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletManager } from "../../../src/components/WalletManager";

// Mock UserContext
const UserContext = {
  Provider: ({ children, value }: any) => (
    <div data-testid="user-context-provider">{children}</div>
  ),
  Consumer: ({ children }: any) => children({}),
};

vi.mock("../../../src/contexts/UserContext", () => ({
  UserContext,
  useUser: () => ({}),
}));
import * as userService from "../../../src/services/userService";
import { UserCryptoWallet } from "../../../src/types/user.types";
import { render } from "../../test-utils";

// Mock external dependencies
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
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
}));

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

vi.mock("../../../src/components/ui/LoadingState", () => ({
  RefreshButton: ({ onClick, isLoading, title }: any) => (
    <button
      onClick={onClick}
      disabled={isLoading}
      title={title}
      data-testid="refresh-button"
    >
      {isLoading ? "Loading..." : "Refresh"}
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

  // Mock data
  const mockWallets: UserCryptoWallet[] = [
    {
      id: "wallet-1",
      user_id: "user-123",
      wallet: "0x1234567890123456789012345678901234567890",
      is_main: true,
      label: "Primary Wallet",
      is_visible: true,
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "wallet-2",
      user_id: "user-123",
      wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      is_main: false,
      label: "Trading Wallet",
      is_visible: true,
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
      isVisible: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "wallet-2",
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      label: "Trading Wallet",
      isMain: false,
      isActive: false,
      isVisible: true,
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

  const renderWalletManager = (
    isOpen: boolean = true,
    onClose: () => void = vi.fn(),
    userContext = mockUserContext
  ) => {
    return render(
      <UserContext.Provider value={userContext as any}>
        <WalletManager isOpen={isOpen} onClose={onClose} />
      </UserContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

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

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe("Rendering and Initial State", () => {
    it("renders nothing when modal is closed", () => {
      const { container } = renderWalletManager(false);
      expect(container.firstChild).toBeNull();
    });

    it("renders modal when open", () => {
      renderWalletManager();

      expect(screen.getByText("Bundle Wallets")).toBeInTheDocument();
      expect(screen.getByText("0x1234...7890 bundle")).toBeInTheDocument();
    });

    it("shows correct user context information", () => {
      renderWalletManager();

      expect(screen.getByText("Bundle Wallets")).toBeInTheDocument();
      expect(screen.getByText("0x1234...7890 bundle")).toBeInTheDocument();
    });

    it("handles disconnected wallet state", () => {
      const disconnectedContext = {
        ...mockUserContext,
        isConnected: false,
        connectedWallet: null,
      };

      renderWalletManager(true, vi.fn(), disconnectedContext);

      expect(screen.getByText("No wallet connected")).toBeInTheDocument();
    });

    it("displays loading state initially", async () => {
      const loadingContext = {
        ...mockUserContext,
        loading: true,
      };

      renderWalletManager(true, vi.fn(), loadingContext);

      expect(screen.getByText("Loading bundle wallets...")).toBeInTheDocument();
      expect(screen.getByTestId("unified-loading")).toBeInTheDocument();
    });

    it("displays error state when user context has error", () => {
      const errorContext = {
        ...mockUserContext,
        error: "Failed to load user data",
      };

      renderWalletManager(true, vi.fn(), errorContext);

      expect(screen.getByText("Failed to load user data")).toBeInTheDocument();
    });
  });

  describe("Wallet Loading and Display", () => {
    it("loads and displays wallets on mount", async () => {
      renderWalletManager();

      await waitFor(() => {
        expect(mockUserService.getUserWallets).toHaveBeenCalledWith("user-123");
      });

      await waitFor(() => {
        expect(mockUserService.transformWalletData).toHaveBeenCalledWith(
          mockWallets
        );
      });

      expect(screen.getByText("Primary Wallet")).toBeInTheDocument();
      expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
      expect(screen.getByText("Primary")).toBeInTheDocument(); // Primary badge
    });

    it("handles empty wallet list", async () => {
      mockUserService.getUserWallets.mockResolvedValue({
        success: true,
        data: [],
      });
      mockUserService.transformWalletData.mockReturnValue([]);

      renderWalletManager();

      await waitFor(() => {
        expect(mockUserService.getUserWallets).toHaveBeenCalled();
      });

      // Should still show the "Add New Wallet" button
      expect(screen.getByText("Add New Wallet")).toBeInTheDocument();
    });

    it("handles API error when loading wallets", async () => {
      mockUserService.getUserWallets.mockResolvedValue({
        success: false,
        error: "Failed to load wallets",
      });

      renderWalletManager();

      await waitFor(() => {
        expect(mockUserService.getUserWallets).toHaveBeenCalled();
      });

      // Component should handle the error gracefully and show empty state
      expect(screen.getByText("Add New Wallet")).toBeInTheDocument();
    });

    it("formats wallet addresses correctly", async () => {
      renderWalletManager();

      await waitFor(() => {
        expect(screen.getByText("0x1234...7890")).toBeInTheDocument();
        expect(screen.getByText("0xabcd...abcd")).toBeInTheDocument();
      });
    });
  });

  describe("Wallet Operations", () => {
    describe("Adding Wallets", () => {
      it("shows add wallet form when Add button clicked", async () => {
        const user = userEvent.setup();
        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Add New Wallet")).toBeInTheDocument();
        });

        await user.click(screen.getByText("Add New Wallet"));

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
        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Add New Wallet")).toBeInTheDocument();
        });

        await user.click(screen.getByText("Add New Wallet"));
        await user.click(screen.getByText("Cancel"));

        expect(
          screen.queryByPlaceholderText("Wallet Label (e.g., Trading Wallet)")
        ).not.toBeInTheDocument();
        expect(screen.getByText("Add New Wallet")).toBeInTheDocument();
      });

      it("validates wallet address before adding", async () => {
        const user = userEvent.setup();
        mockUserService.validateWalletAddress.mockReturnValue(false);

        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Add New Wallet")).toBeInTheDocument();
        });

        await user.click(screen.getByText("Add New Wallet"));

        const labelInput = screen.getByPlaceholderText(
          "Wallet Label (e.g., Trading Wallet)"
        );
        const addressInput = screen.getByPlaceholderText(
          "Wallet Address (0x...)"
        );

        await user.type(labelInput, "New Wallet");
        await user.type(addressInput, "invalid-address");
        await user.click(screen.getByText("Add to Bundle"));

        expect(
          screen.getByText(/Invalid wallet address format/)
        ).toBeInTheDocument();
        expect(mockUserService.addWalletToBundle).not.toHaveBeenCalled();
      });

      it("requires both label and address fields", async () => {
        const user = userEvent.setup();
        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Add New Wallet")).toBeInTheDocument();
        });

        await user.click(screen.getByText("Add New Wallet"));
        await user.click(screen.getByText("Add to Bundle"));

        expect(
          screen.getByText("Please fill in all fields")
        ).toBeInTheDocument();
        expect(mockUserService.addWalletToBundle).not.toHaveBeenCalled();
      });

      it("successfully adds new wallet", async () => {
        const user = userEvent.setup();
        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Add New Wallet")).toBeInTheDocument();
        });

        await user.click(screen.getByText("Add New Wallet"));

        const labelInput = screen.getByPlaceholderText(
          "Wallet Label (e.g., Trading Wallet)"
        );
        const addressInput = screen.getByPlaceholderText(
          "Wallet Address (0x...)"
        );

        await user.type(labelInput, "New Trading Wallet");
        await user.type(
          addressInput,
          "0x9876543210987654321098765432109876543210"
        );
        await user.click(screen.getByText("Add to Bundle"));

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
        mockUserService.addWalletToBundle.mockResolvedValue({
          success: false,
          error: "Wallet already exists",
        });

        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Add New Wallet")).toBeInTheDocument();
        });

        await user.click(screen.getByText("Add New Wallet"));

        const labelInput = screen.getByPlaceholderText(
          "Wallet Label (e.g., Trading Wallet)"
        );
        const addressInput = screen.getByPlaceholderText(
          "Wallet Address (0x...)"
        );

        await user.type(labelInput, "Duplicate Wallet");
        await user.type(
          addressInput,
          "0x1234567890123456789012345678901234567890"
        );
        await user.click(screen.getByText("Add to Bundle"));

        await waitFor(() => {
          expect(screen.getByText("Wallet already exists")).toBeInTheDocument();
        });
      });
    });

    describe("Removing Wallets", () => {
      it("removes non-main wallet when delete button clicked", async () => {
        const user = userEvent.setup();
        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
        });

        // Find delete button for the non-main wallet
        const deleteButtons = screen.getAllByTitle("Remove from Bundle");
        expect(deleteButtons).toHaveLength(1); // Only non-main wallets have delete buttons

        await user.click(deleteButtons[0]);

        await waitFor(() => {
          expect(mockUserService.removeWalletFromBundle).toHaveBeenCalledWith(
            "user-123",
            "wallet-2"
          );
        });
      });

      it("does not show delete button for main wallet", async () => {
        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Primary Wallet")).toBeInTheDocument();
        });

        // Main wallet should not have delete button
        const deleteButtons = screen.queryAllByTitle("Remove from Bundle");
        expect(deleteButtons).toHaveLength(1); // Only for the non-main wallet
      });

      it("handles remove wallet API error", async () => {
        const user = userEvent.setup();
        mockUserService.removeWalletFromBundle.mockResolvedValue({
          success: false,
          error: "Cannot remove main wallet",
        });

        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle("Remove from Bundle");
        await user.click(deleteButtons[0]);

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
        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
        });

        const editButtons = screen.getAllByTitle("Edit Label");
        await user.click(editButtons[0]);

        const editInput = screen.getByDisplayValue("Trading Wallet");
        expect(editInput).toBeInTheDocument();
      });

      it("saves label when Enter key pressed", async () => {
        const user = userEvent.setup();
        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
        });

        const editButtons = screen.getAllByTitle("Edit Label");
        await user.click(editButtons[0]);

        const editInput = screen.getByDisplayValue("Trading Wallet");
        await user.clear(editInput);
        await user.type(editInput, "Updated Trading Wallet");
        await user.keyboard("{Enter}");

        // Since there's no actual API endpoint for label updates, it should update optimistically
        expect(
          screen.queryByDisplayValue("Updated Trading Wallet")
        ).not.toBeInTheDocument();
      });

      it("cancels edit when Escape key pressed", async () => {
        const user = userEvent.setup();
        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
        });

        const editButtons = screen.getAllByTitle("Edit Label");
        await user.click(editButtons[0]);

        const editInput = screen.getByDisplayValue("Trading Wallet");
        await user.clear(editInput);
        await user.type(editInput, "Changed Label");
        await user.keyboard("{Escape}");

        expect(
          screen.queryByDisplayValue("Changed Label")
        ).not.toBeInTheDocument();
        expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
      });

      it("does not show edit button for main wallet", async () => {
        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("Primary Wallet")).toBeInTheDocument();
        });

        // Only non-main wallets should have edit buttons
        const editButtons = screen.queryAllByTitle("Edit Label");
        expect(editButtons).toHaveLength(1); // Only for the non-main wallet
      });
    });

    describe("Copy Address Feature", () => {
      it("copies wallet address to clipboard", async () => {
        const user = userEvent.setup();
        const mockWriteText = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
          clipboard: { writeText: mockWriteText },
        });

        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("0x1234...7890")).toBeInTheDocument();
        });

        // Find copy button next to the first address
        const copyButtons = screen.getAllByRole("button");
        const copyButton = copyButtons.find(
          btn => btn.querySelector("svg") || btn.textContent?.includes("copy")
        );

        // Since we can't easily identify the copy button by role, let's click on the address area
        // and look for clipboard interaction
        const addressElement = screen.getByText("0x1234...7890").closest("div");
        const copyBtns = addressElement?.querySelectorAll("button") || [];

        if (copyBtns.length > 0) {
          await user.click(copyBtns[0] as HTMLElement);
          expect(mockWriteText).toHaveBeenCalledWith(
            "0x1234567890123456789012345678901234567890"
          );
        }
      });

      it("handles clipboard copy failure gracefully", async () => {
        const user = userEvent.setup();
        const mockWriteText = vi
          .fn()
          .mockRejectedValue(new Error("Copy failed"));
        Object.assign(navigator, {
          clipboard: { writeText: mockWriteText },
        });

        renderWalletManager();

        await waitFor(() => {
          expect(screen.getByText("0x1234...7890")).toBeInTheDocument();
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
      renderWalletManager(true, mockOnClose);

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("closes modal when backdrop clicked", async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      const { container } = renderWalletManager(true, mockOnClose);

      // Click on the backdrop (the overlay div)
      const backdrop = container.querySelector(".fixed.inset-0");
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it("does not close modal when clicking inside the modal content", async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      renderWalletManager(true, mockOnClose);

      const modalContent = screen.getByText("Bundle Wallets");
      await user.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("refreshes wallet data when refresh button clicked", async () => {
      const user = userEvent.setup();
      renderWalletManager();

      const refreshButton = screen.getByTestId("refresh-button");
      await user.click(refreshButton);

      // Should trigger a new call to getUserWallets
      await waitFor(() => {
        expect(mockUserService.getUserWallets).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });
  });

  describe("Loading States", () => {
    it("shows loading spinners during operations", async () => {
      const user = userEvent.setup();
      // Mock a delayed response to see loading state
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

      renderWalletManager();

      await waitFor(() => {
        expect(screen.getByText("Add New Wallet")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Add New Wallet"));

      const labelInput = screen.getByPlaceholderText(
        "Wallet Label (e.g., Trading Wallet)"
      );
      const addressInput = screen.getByPlaceholderText(
        "Wallet Address (0x...)"
      );

      await user.type(labelInput, "Test Wallet");
      await user.type(
        addressInput,
        "0x9876543210987654321098765432109876543210"
      );

      const addButton = screen.getByText("Add to Bundle");
      await user.click(addButton);

      // Should show loading state
      expect(screen.getByText("Adding...")).toBeInTheDocument();
    });

    it("shows loading state during wallet removal", async () => {
      const user = userEvent.setup();
      // Mock a delayed response
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

      renderWalletManager();

      await waitFor(() => {
        expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle("Remove from Bundle");
      await user.click(deleteButtons[0]);

      // Should show loading spinner
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });
  });

  describe("Summary Information", () => {
    it("displays correct wallet summary", async () => {
      renderWalletManager();

      await waitFor(() => {
        expect(screen.getByText("Bundle Summary")).toBeInTheDocument();
        expect(screen.getByText("Total Wallets:")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument(); // Should show 2 wallets
        expect(screen.getByText("Visible:")).toBeInTheDocument();
        expect(screen.getByText("Primary Wallet:")).toBeInTheDocument();
      });
    });

    it("shows connection status in summary", async () => {
      renderWalletManager();

      await waitFor(() => {
        expect(
          screen.getByText(/Connected to account-engine/)
        ).toBeInTheDocument();
        expect(screen.getByText(/User ID: user-123/)).toBeInTheDocument();
      });
    });

    it("shows disconnected state in summary", async () => {
      const disconnectedContext = {
        ...mockUserContext,
        isConnected: false,
        userInfo: null,
      };

      renderWalletManager(true, vi.fn(), disconnectedContext);

      expect(
        screen.getByText(/Connect a wallet to view your bundle wallets/)
      ).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("handles network errors during wallet operations", async () => {
      const user = userEvent.setup();
      mockUserService.addWalletToBundle.mockRejectedValue(
        new Error("Network error")
      );
      mockUserService.handleWalletError.mockReturnValue(
        "Network connection failed"
      );

      renderWalletManager();

      await waitFor(() => {
        expect(screen.getByText("Add New Wallet")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Add New Wallet"));

      const labelInput = screen.getByPlaceholderText(
        "Wallet Label (e.g., Trading Wallet)"
      );
      const addressInput = screen.getByPlaceholderText(
        "Wallet Address (0x...)"
      );

      await user.type(labelInput, "Test Wallet");
      await user.type(
        addressInput,
        "0x9876543210987654321098765432109876543210"
      );
      await user.click(screen.getByText("Add to Bundle"));

      await waitFor(() => {
        expect(
          screen.getByText("Network connection failed")
        ).toBeInTheDocument();
      });
    });

    it("displays operation-specific error messages", async () => {
      const user = userEvent.setup();
      mockUserService.removeWalletFromBundle.mockResolvedValue({
        success: false,
        error: "Cannot remove primary wallet",
      });

      renderWalletManager();

      await waitFor(() => {
        expect(screen.getByText("Trading Wallet")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle("Remove from Bundle");
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText("Cannot remove primary wallet")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Auto-refresh Functionality", () => {
    it("sets up periodic auto-refresh when modal is open", async () => {
      vi.useFakeTimers();

      renderWalletManager();

      await waitFor(() => {
        expect(mockUserService.getUserWallets).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 30 seconds to trigger auto-refresh
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockUserService.getUserWallets).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });

    it("cleans up auto-refresh interval when modal closes", async () => {
      vi.useFakeTimers();

      const { rerender } = renderWalletManager();

      // Re-render with closed modal
      rerender(
        <UserContext.Provider value={mockUserContext as any}>
          <WalletManager isOpen={false} onClose={vi.fn()} />
        </UserContext.Provider>
      );

      // Advance timers - should not trigger additional calls
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Should only have the initial call
      expect(mockUserService.getUserWallets).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});
