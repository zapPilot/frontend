import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsTab } from "@/components/SettingsTab";
import { WalletManager } from "@/components/WalletManager";

import { render } from "../test-utils";

// Mock Navigation component
vi.mock("@/components/Navigation", () => ({
  Navigation: ({
    activeTab,
    onTabChange,
  }: {
    activeTab: string;
    onTabChange: (tab: string) => void;
  }) => (
    <nav data-testid="navigation">
      <button
        data-testid="nav-portfolio"
        onClick={() => onTabChange("portfolio")}
      >
        Portfolio
      </button>
      <button
        data-testid="nav-settings"
        onClick={() => onTabChange("settings")}
      >
        Settings
      </button>
      <span data-testid="active-tab">{activeTab}</span>
    </nav>
  ),
}));

// Mock WalletManager component with modal behavior
let mockWalletList = [
  {
    address: "0x1234...5678",
    displayName: "Primary Wallet",
    isConnected: true,
  },
  {
    address: "0xabcd...ef00",
    displayName: "Trading Wallet",
    isConnected: false,
  },
];

vi.mock("@/components/WalletManager", () => ({
  WalletManager: ({
    isOpen: _isOpen,
    onClose,
    onWalletAdded,
    onWalletRemoved,
    onWalletSelected,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onWalletAdded?: (wallet: any) => void;
    onWalletRemoved?: (address: string) => void;
    onWalletSelected?: (address: string) => void;
  }) => {
    // FIX: Use React state to ensure component re-renders when wallet list changes
    const [wallets, setWallets] = useState(() => mockWalletList);

    if (!_isOpen) return null;

    return (
      <div data-testid="wallet-manager-modal" role="dialog">
        <div data-testid="wallet-manager-header">
          <h2>Manage Wallets</h2>
          <button data-testid="close-wallet-manager" onClick={onClose}>
            Close
          </button>
        </div>

        <div data-testid="wallet-list">
          {wallets.map(wallet => (
            <div
              key={wallet.address}
              data-testid={`wallet-item-${wallet.address}`}
            >
              <span data-testid={`wallet-address-${wallet.address}`}>
                {wallet.address}
              </span>
              <span data-testid={`wallet-name-${wallet.address}`}>
                {wallet.displayName}
              </span>
              <span data-testid={`wallet-status-${wallet.address}`}>
                {wallet.isConnected ? "connected" : "disconnected"}
              </span>
              <button
                data-testid={`select-wallet-${wallet.address}`}
                onClick={() => {
                  // Update wallet connection status when selected
                  const updatedList = wallets.map(w => ({
                    ...w,
                    isConnected: w.address === wallet.address,
                  }));
                  mockWalletList = updatedList;
                  setWallets(updatedList);
                  onWalletSelected?.(wallet.address);
                }}
              >
                Select
              </button>
              <button
                data-testid={`remove-wallet-${wallet.address}`}
                onClick={() => {
                  const updatedList = wallets.filter(
                    w => w.address !== wallet.address
                  );
                  mockWalletList = updatedList;
                  setWallets(updatedList);
                  onWalletRemoved?.(wallet.address);
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div data-testid="add-wallet-section">
          <input
            data-testid="new-wallet-address-input"
            placeholder="Wallet address"
          />
          <input
            data-testid="new-wallet-name-input"
            placeholder="Wallet name (optional)"
          />
          <button
            data-testid="add-wallet-button"
            onClick={() => {
              const addressInput = document.querySelector(
                '[data-testid="new-wallet-address-input"]'
              ) as HTMLInputElement;
              const nameInput = document.querySelector(
                '[data-testid="new-wallet-name-input"]'
              ) as HTMLInputElement;

              if (addressInput?.value) {
                const newWallet = {
                  address: addressInput.value,
                  displayName:
                    nameInput?.value || `Wallet ${wallets.length + 1}`,
                  isConnected: false,
                };
                const updatedList = [...wallets, newWallet];
                mockWalletList = updatedList;
                setWallets(updatedList);
                onWalletAdded?.(newWallet);
                addressInput.value = "";
                nameInput.value = "";
              }
            }}
          >
            Add Wallet
          </button>
        </div>
      </div>
    );
  },
}));

interface MenuItem {
  icon: any;
  label: string;
  description: string;
  onClick: () => void;
}

// Mock MenuSection and VersionInfo from SettingsTab
vi.mock("@/components/SettingsTab/index", () => ({
  MenuSection: ({ title, items }: { title: string; items: MenuItem[] }) => (
    <div data-testid={`menu-section-${title.toLowerCase().replace(/ /g, "-")}`}>
      <h3 data-testid="menu-section-title">{title}</h3>
      {items.map(item => (
        <button
          key={item.label}
          data-testid={`menu-item-${item.label.toLowerCase().replace(/ /g, "-")}`}
          onClick={item.onClick}
        >
          <span
            data-testid={`menu-item-label-${item.label.toLowerCase().replace(/ /g, "-")}`}
          >
            {item.label}
          </span>
          <span
            data-testid={`menu-item-desc-${item.label.toLowerCase().replace(/ /g, "-")}`}
          >
            {item.description}
          </span>
        </button>
      ))}
    </div>
  ),
  VersionInfo: () => (
    <div data-testid="version-info">
      <span data-testid="app-version">v0.1.0</span>
      <span data-testid="build-date">2025-01-17</span>
    </div>
  ),
}));

// Container component that simulates the app shell with navigation
// FIX: Use React state instead of module variable to trigger re-renders
function SettingsPageContainer({
  children,
  onWalletManagerOpen,
}: {
  children: ReactNode;
  onWalletManagerOpen?: () => void;
}) {
  // Use React state to properly trigger re-renders when modal opens/closes
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);

  const handleWalletManagerOpen = () => {
    setIsWalletManagerOpen(true);
    onWalletManagerOpen?.();
  };

  const handleWalletManagerClose = () => {
    setIsWalletManagerOpen(false);
  };

  return (
    <div data-testid="settings-page-container">
      {/* Simulate global wallet manager trigger */}
      <button
        data-testid="global-wallet-manager-trigger"
        onClick={handleWalletManagerOpen}
      >
        Open Wallet Manager
      </button>

      {children}

      {/* Wallet Manager Modal */}
      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={handleWalletManagerClose}
      />
    </div>
  );
}

describe("Settings & Wallet Management Flow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWalletList = [
      {
        address: "0x1234...5678",
        displayName: "Primary Wallet",
        isConnected: true,
      },
      {
        address: "0xabcd...ef00",
        displayName: "Trading Wallet",
        isConnected: false,
      },
    ];
  });

  describe("Settings Tab Navigation", () => {
    it("should render all settings menu sections and items", async () => {
      await act(async () => {
        render(<SettingsTab />);
      });

      // Verify header
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(
        screen.getByText("Manage your account preferences and get help")
      ).toBeInTheDocument();

      // Verify menu sections
      expect(
        screen.getByTestId("menu-section-account-&-preferences")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("menu-section-help-&-support")
      ).toBeInTheDocument();

      // Verify menu items in Account section
      expect(screen.getByTestId("menu-item-app-settings")).toBeInTheDocument();
      expect(screen.getByTestId("menu-item-notifications")).toBeInTheDocument();
      expect(
        screen.getByTestId("menu-item-security-&-privacy")
      ).toBeInTheDocument();

      // Verify menu items in Help section
      expect(screen.getByTestId("menu-item-help-center")).toBeInTheDocument();
      expect(screen.getByTestId("menu-item-user-guide")).toBeInTheDocument();

      // Verify version info
      expect(screen.getByTestId("version-info")).toBeInTheDocument();
      expect(screen.getByTestId("app-version")).toHaveTextContent("v0.1.0");
    });

    it("should handle menu item clicks", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<SettingsTab />);
      });

      const appSettingsItem = screen.getByTestId("menu-item-app-settings");

      await act(async () => {
        await user.click(appSettingsItem);
      });

      // Menu item should be clickable (implementation pending as per component)
      expect(appSettingsItem).toBeInTheDocument();
    });
  });

  describe("Wallet Manager Integration", () => {
    it("should open wallet manager and display wallet list", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <SettingsPageContainer>
            <SettingsTab />
          </SettingsPageContainer>
        );
      });

      // Wallet manager should not be visible initially
      expect(
        screen.queryByTestId("wallet-manager-modal")
      ).not.toBeInTheDocument();

      // Open wallet manager
      const openButton = screen.getByTestId("global-wallet-manager-trigger");
      await act(async () => {
        await user.click(openButton);
      });

      // Verify modal is open
      await waitFor(() => {
        expect(screen.getByTestId("wallet-manager-modal")).toBeInTheDocument();
      });

      // Verify wallet list is displayed
      expect(screen.getByTestId("wallet-list")).toBeInTheDocument();
      expect(
        screen.getByTestId("wallet-item-0x1234...5678")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("wallet-item-0xabcd...ef00")
      ).toBeInTheDocument();

      // Verify wallet details
      expect(screen.getByTestId("wallet-name-0x1234...5678")).toHaveTextContent(
        "Primary Wallet"
      );
      expect(
        screen.getByTestId("wallet-status-0x1234...5678")
      ).toHaveTextContent("connected");
      expect(
        screen.getByTestId("wallet-status-0xabcd...ef00")
      ).toHaveTextContent("disconnected");
    });

    it("should add a new wallet through wallet manager", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <SettingsPageContainer>
            <SettingsTab />
          </SettingsPageContainer>
        );
      });

      // Open wallet manager
      await act(async () => {
        await user.click(screen.getByTestId("global-wallet-manager-trigger"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("wallet-manager-modal")).toBeInTheDocument();
      });

      // Initial wallet count
      const initialWalletCount = mockWalletList.length;

      // Add new wallet
      const addressInput = screen.getByTestId("new-wallet-address-input");
      const nameInput = screen.getByTestId("new-wallet-name-input");
      const addButton = screen.getByTestId("add-wallet-button");

      await act(async () => {
        await user.type(addressInput, "0x9999...1111");
        await user.type(nameInput, "DeFi Wallet");
        await user.click(addButton);
      });

      // Verify wallet was added
      await waitFor(() => {
        expect(mockWalletList.length).toBe(initialWalletCount + 1);
        const newWallet = mockWalletList.find(
          w => w.address === "0x9999...1111"
        );
        expect(newWallet).toBeDefined();
        expect(newWallet?.displayName).toBe("DeFi Wallet");
        expect(newWallet?.isConnected).toBe(false);
      });
    });

    it("should remove a wallet from wallet manager", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <SettingsPageContainer>
            <SettingsTab />
          </SettingsPageContainer>
        );
      });

      // Open wallet manager
      await act(async () => {
        await user.click(screen.getByTestId("global-wallet-manager-trigger"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("wallet-manager-modal")).toBeInTheDocument();
      });

      const initialWalletCount = mockWalletList.length;

      // Remove wallet
      const removeButton = screen.getByTestId("remove-wallet-0xabcd...ef00");
      await act(async () => {
        await user.click(removeButton);
      });

      // Verify wallet was removed
      await waitFor(() => {
        expect(mockWalletList.length).toBe(initialWalletCount - 1);
        expect(
          mockWalletList.find(w => w.address === "0xabcd...ef00")
        ).toBeUndefined();
      });
    });

    it("should switch active wallet", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <SettingsPageContainer>
            <SettingsTab />
          </SettingsPageContainer>
        );
      });

      // Open wallet manager
      await act(async () => {
        await user.click(screen.getByTestId("global-wallet-manager-trigger"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("wallet-manager-modal")).toBeInTheDocument();
      });

      // Verify initial connected wallet
      expect(
        screen.getByTestId("wallet-status-0x1234...5678")
      ).toHaveTextContent("connected");
      expect(
        screen.getByTestId("wallet-status-0xabcd...ef00")
      ).toHaveTextContent("disconnected");

      // Select different wallet
      const selectButton = screen.getByTestId("select-wallet-0xabcd...ef00");
      await act(async () => {
        await user.click(selectButton);
      });

      // Verify wallet connection switched
      await waitFor(() => {
        const primaryWallet = mockWalletList.find(
          w => w.address === "0x1234...5678"
        );
        const tradingWallet = mockWalletList.find(
          w => w.address === "0xabcd...ef00"
        );

        expect(primaryWallet?.isConnected).toBe(false);
        expect(tradingWallet?.isConnected).toBe(true);
      });
    });

    it("should close wallet manager modal", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <SettingsPageContainer>
            <SettingsTab />
          </SettingsPageContainer>
        );
      });

      // Open wallet manager
      await act(async () => {
        await user.click(screen.getByTestId("global-wallet-manager-trigger"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("wallet-manager-modal")).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByTestId("close-wallet-manager");
      await act(async () => {
        await user.click(closeButton);
      });

      // Verify modal is closed
      await waitFor(() => {
        expect(
          screen.queryByTestId("wallet-manager-modal")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Full Settings & Wallet Management Flow", () => {
    it("should complete end-to-end flow: navigate to settings -> open wallet manager -> add wallet -> switch wallet -> close", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <SettingsPageContainer>
            <SettingsTab />
          </SettingsPageContainer>
        );
      });

      // Step 1: Verify settings page is rendered
      expect(screen.getByText("Settings")).toBeInTheDocument();

      // Step 2: Open wallet manager
      await act(async () => {
        await user.click(screen.getByTestId("global-wallet-manager-trigger"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("wallet-manager-modal")).toBeInTheDocument();
      });

      // Step 3: Add new wallet
      await act(async () => {
        await user.type(
          screen.getByTestId("new-wallet-address-input"),
          "0xdead...beef"
        );
        await user.type(
          screen.getByTestId("new-wallet-name-input"),
          "Test Wallet"
        );
        await user.click(screen.getByTestId("add-wallet-button"));
      });

      await waitFor(() => {
        expect(
          mockWalletList.find(w => w.address === "0xdead...beef")
        ).toBeDefined();
      });

      // Step 4: Switch to new wallet
      await act(async () => {
        await user.click(screen.getByTestId("select-wallet-0xdead...beef"));
      });

      await waitFor(() => {
        const newWallet = mockWalletList.find(
          w => w.address === "0xdead...beef"
        );
        expect(newWallet?.isConnected).toBe(true);
      });

      // Step 5: Close wallet manager
      await act(async () => {
        await user.click(screen.getByTestId("close-wallet-manager"));
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId("wallet-manager-modal")
        ).not.toBeInTheDocument();
      });

      // Verify settings page is still visible
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("should persist wallet changes across modal open/close cycles", async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <SettingsPageContainer>
            <SettingsTab />
          </SettingsPageContainer>
        );
      });

      // Open wallet manager
      await act(async () => {
        await user.click(screen.getByTestId("global-wallet-manager-trigger"));
      });

      // Add wallet
      await act(async () => {
        await user.type(
          screen.getByTestId("new-wallet-address-input"),
          "0xaaaa...bbbb"
        );
        await user.click(screen.getByTestId("add-wallet-button"));
      });

      const walletCountAfterAdd = mockWalletList.length;

      // Close modal
      await act(async () => {
        await user.click(screen.getByTestId("close-wallet-manager"));
      });

      // Re-open modal
      await act(async () => {
        await user.click(screen.getByTestId("global-wallet-manager-trigger"));
      });

      // Verify wallet persisted
      await waitFor(() => {
        expect(mockWalletList.length).toBe(walletCountAfterAdd);
        expect(
          mockWalletList.find(w => w.address === "0xaaaa...bbbb")
        ).toBeDefined();
      });
    });
  });
});
