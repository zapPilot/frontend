import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WalletNavigation } from "@/components/wallet/portfolio/components/WalletNavigation";

// Mock child components to verify integration
vi.mock("@/components/wallet/portfolio/components/search/WalletSearchNav", () => ({
  WalletSearchNav: ({ onSearch }: { onSearch: (val: string) => void }) => (
    <div data-testid="wallet-search-nav">
      <button onClick={() => onSearch("mock-address")}>Search Mock</button>
    </div>
  ),
}));

vi.mock("@/components/wallet/portfolio/components/WalletMenu", () => ({
  WalletMenu: () => <div data-testid="wallet-menu">Wallet Menu</div>,
}));

describe("WalletNavigation Component", () => {
  const mockSetActiveTab = vi.fn();
  const mockOnOpenSettings = vi.fn();
  const mockOnSearch = vi.fn();

  it("renders correctly with search bar (snapshot)", () => {
    const { container } = render(
      <WalletNavigation
        activeTab="dashboard"
        setActiveTab={mockSetActiveTab}
        onOpenSettings={mockOnOpenSettings}
        onSearch={mockOnSearch}
        showSearch={true}
      />
    );
    expect(container).toMatchSnapshot();
    expect(screen.getByTestId("wallet-search-nav")).toBeInTheDocument();
  });

  it("does not render search bar if showSearch is false", () => {
    render(
      <WalletNavigation
        activeTab="dashboard"
        setActiveTab={mockSetActiveTab}
        onOpenSettings={mockOnOpenSettings}
        onSearch={mockOnSearch}
        showSearch={false}
      />
    );
    expect(screen.queryByTestId("wallet-search-nav")).not.toBeInTheDocument();
  });

  it("does not render search bar if onSearch is undefined", () => {
    render(
      <WalletNavigation
        activeTab="dashboard"
        setActiveTab={mockSetActiveTab}
        onOpenSettings={mockOnOpenSettings}
        showSearch={true}
        // onSearch undefined
      />
    );
    expect(screen.queryByTestId("wallet-search-nav")).not.toBeInTheDocument();
  });
});
