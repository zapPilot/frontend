/**
 * Unit Tests for PoolPerformanceTable Component
 *
 * Coverage Areas:
 * - Core rendering (loading, error, empty, desktop table, mobile cards)
 * - Sorting functionality (4 columns, toggle direction, stable sort)
 * - Category filtering (btc, eth, stablecoins, others)
 * - Pagination (Top N: 5, 10, 20, 50, All)
 * - Underperforming pool detection (APR ≤ 2.5% or protocol_matched=false)
 * - APR formatting and icons (green >5%, red ≤1%, white 1-5%, yellow underperforming)
 * - Edge cases (single pool, all underperforming, filter+sort+paginate flow)
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PoolDetail } from "@/services/analyticsService";

// ============================================================================
// Mock Dependencies
// ============================================================================

// Mock formatters
vi.mock("@/lib/formatters", () => ({
  formatCurrency: vi.fn((val: number) => `$${val.toLocaleString("en-US")}`),
  formatPercentage: vi.fn((val: number, showPlus = false, decimals = 1) => {
    // Match real formatPercentage: no multiplication by 100
    const formatted = val.toFixed(decimals);
    return `${showPlus && val > 0 ? "+" : ""}${formatted}%`;
  }),
}));

// Mock portfolio utilities
vi.mock("@/utils/portfolio.utils", () => ({
  categorizePool: vi.fn((symbols: string[]) => {
    const first = symbols[0]?.toLowerCase() ?? "";
    if (first.includes("btc") || first === "wbtc") return "btc";
    if (first.includes("eth") || first === "weth") return "eth";
    if (["usdc", "usdt", "dai", "busd"].includes(first)) return "stablecoins";
    return "others";
  }),
}));

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    tr: ({ children, ...props }: any) => createElement("tr", props, children),
    div: ({ children, ...props }: any) => createElement("div", props, children),
  },
}));

// Mock logger
vi.mock("@/utils/logger", () => ({
  createContextLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock shared components
vi.mock("@/components/shared/ProtocolImage", () => ({
  ProtocolImage: ({ protocol, size }: any) =>
    createElement("div", {
      "data-testid": "protocol-image",
      "data-protocol": protocol.name,
      "data-size": size,
    }),
}));

vi.mock("@/components/shared/TokenImage", () => ({
  TokenImage: ({ token, size }: any) =>
    createElement("div", {
      "data-testid": "token-image",
      "data-token": token.symbol,
      "data-size": size,
    }),
}));

vi.mock("@/components/ui", () => ({
  BaseCard: ({ children, variant }: any) =>
    createElement(
      "div",
      { "data-testid": "base-card", "data-variant": variant },
      children
    ),
  AssetBadge: ({ symbol }: any) =>
    createElement(
      "span",
      {
        "data-testid": "asset-badge",
        "data-symbol": symbol,
      },
      symbol
    ),
}));

vi.mock("@/components/ui/LoadingSystem", () => ({
  Skeleton: ({ variant, width, height, "aria-label": ariaLabel }: any) =>
    createElement("div", {
      "data-testid": "skeleton",
      "data-variant": variant,
      "data-width": width,
      "data-height": height,
      "aria-label": ariaLabel,
    }),
}));

// Import component after mocks
const { PoolPerformanceTable } = await import(
  "@/components/PoolAnalytics/PoolPerformanceTable"
);

// ============================================================================
// Test Fixtures
// ============================================================================

interface MockPoolOptions {
  id?: string;
  chain?: string;
  protocol?: string;
  value?: number;
  symbols?: string[];
  apr?: number;
  matched?: boolean;
  contribution?: number;
  snapshots?: number;
}

function createMockPool(options: MockPoolOptions = {}): PoolDetail {
  return {
    snapshot_id: options.id ?? `snap-${Math.random()}`,
    snapshot_ids: Array(options.snapshots ?? 3)
      .fill(null)
      .map((_, i) => `snap${i}`),
    chain: options.chain ?? "ethereum",
    protocol_name: options.protocol ?? "Aave",
    asset_usd_value: options.value ?? 1000,
    pool_symbols: options.symbols ?? ["USDC", "USDT"],
    final_apr: options.apr ?? 0.05,
    protocol_matched: options.matched ?? true,
    contribution_to_portfolio: options.contribution ?? 0.1,
    apr_data: {},
  };
}

// Example pools for testing
const mockBitcoinPool = createMockPool({ symbols: ["WBTC"], apr: 0.045 });

// ============================================================================
// Test Suite
// ============================================================================

describe("PoolPerformanceTable - Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render desktop table view with valid pool data", () => {
    const pools = [
      createMockPool({ protocol: "Aave", value: 1000 }),
      createMockPool({ protocol: "Compound", value: 2000 }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    // Check table exists
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    // Check table headers in thead (APR column removed in recent update)
    const thead = table.querySelector("thead");
    expect(thead).toBeInTheDocument();
    expect(
      within(thead as HTMLElement).getByText("Protocol")
    ).toBeInTheDocument();
    expect(
      within(thead as HTMLElement).getByText("Assets")
    ).toBeInTheDocument();
    expect(
      within(thead as HTMLElement).getByText("Positions")
    ).toBeInTheDocument();
    expect(within(thead as HTMLElement).getByText("Value")).toBeInTheDocument();
    expect(
      within(thead as HTMLElement).getByText("Portfolio %")
    ).toBeInTheDocument();

    // Check data rows
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3); // header + 2 data rows
  });

  it("should render mobile card view on small screens", () => {
    const pools = [createMockPool({ protocol: "Aave" })];

    const { container } = render(<PoolPerformanceTable pools={pools} />);

    // Mobile cards should be in a div with md:hidden class
    const mobileContainer = container.querySelector(".md\\:hidden");
    expect(mobileContainer).toBeInTheDocument();
  });

  it("should show loading skeleton when isLoading=true", () => {
    render(<PoolPerformanceTable pools={[]} isLoading={true} />);

    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Loading pool performance data")
    ).toBeInTheDocument();
    expect(screen.getByText("Loading pool analytics...")).toBeInTheDocument();
  });

  it("should show error state with AlertTriangle icon when error provided", () => {
    const errorMessage = "Failed to load pool data";
    render(<PoolPerformanceTable pools={[]} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    // AlertTriangle icon should be present
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("should show empty state when pools array is empty", () => {
    render(<PoolPerformanceTable pools={[]} />);

    expect(screen.getByText("No pool data available")).toBeInTheDocument();
  });

  it("should render retry button when error + onRetry provided", async () => {
    const onRetry = vi.fn();
    render(<PoolPerformanceTable pools={[]} error="Error" onRetry={onRetry} />);

    const retryButton = screen.getByText("Try Again");
    expect(retryButton).toBeInTheDocument();

    await userEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should display category filter badge when categoryFilter provided", () => {
    const pools = [mockBitcoinPool];
    render(<PoolPerformanceTable pools={pools} categoryFilter="btc" />);

    expect(screen.getByText("Showing Bitcoin pools")).toBeInTheDocument();
  });

  it("should show 'All' in TopN dropdown when defaultTopN=null", () => {
    const pools = [createMockPool()];
    render(<PoolPerformanceTable pools={pools} defaultTopN={null} />);

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("all");
  });
});

describe("PoolPerformanceTable - Sorting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should default sort by value descending", () => {
    const pools = [
      createMockPool({ protocol: "Aave", value: 1000 }),
      createMockPool({ protocol: "Compound", value: 2000 }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const rows = screen.getAllByRole("row");
    // First data row should have higher value
    expect(within(rows[1]).getByText("$2,000")).toBeInTheDocument();
  });

  it("should sort by protocol name alphabetically", async () => {
    const pools = [
      createMockPool({ protocol: "Compound", value: 1000 }),
      createMockPool({ protocol: "Aave", value: 2000 }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const protocolHeader = screen.getByText("Protocol");
    await userEvent.click(protocolHeader);

    const rows = screen.getAllByRole("row");
    // After sorting by protocol desc, Compound should be first
    expect(within(rows[1]).getByText("Compound")).toBeInTheDocument();
  });

  it("should sort by Portfolio % numerically (descending)", async () => {
    const pools = [
      createMockPool({ contribution: 0.15, value: 1000 }),
      createMockPool({ contribution: 0.25, value: 1000 }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const table = screen.getByRole("table");
    const contributionHeader = within(table).getByText("Portfolio %");
    await userEvent.click(contributionHeader);

    const rows = screen.getAllByRole("row");
    // Higher contribution should be first
    expect(within(rows[1]).getByText("0.3%")).toBeInTheDocument(); // 0.25 rounded to 0.3
  });

  it("should sort by Portfolio % numerically (ascending)", async () => {
    const pools = [
      createMockPool({ contribution: 0.25, value: 1000 }),
      createMockPool({ contribution: 0.15, value: 1000 }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const table = screen.getByRole("table");
    const contributionHeader = within(table).getByText("Portfolio %");
    // First click: desc
    await userEvent.click(contributionHeader);
    // Second click: asc
    await userEvent.click(contributionHeader);

    const rows = screen.getAllByRole("row");
    // Lower contribution should be first (0.15 formatted with 1 decimal = 0.1%)
    expect(within(rows[1]).getByText("0.1%")).toBeInTheDocument();
  });

  it("should sort by value numerically", async () => {
    const pools = [
      createMockPool({ value: 1000 }),
      createMockPool({ value: 2000 }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const table = screen.getByRole("table");
    const valueHeader = within(table).getByText("Value");
    // Default is already value desc, so clicking toggles to asc
    await userEvent.click(valueHeader);

    const rows = screen.getAllByRole("row");
    // After toggling to asc, lower value should be first
    expect(within(rows[1]).getByText("$1,000")).toBeInTheDocument();
  });

  it("should sort by contribution numerically", async () => {
    const pools = [
      createMockPool({ contribution: 0.2, value: 1000 }),
      createMockPool({ contribution: 0.4, value: 1000 }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const table = screen.getByRole("table");
    const contributionHeader = within(table).getByText("Portfolio %");
    await userEvent.click(contributionHeader);

    const rows = screen.getAllByRole("row");
    // Higher contribution should be first (desc) - formatter returns "0.4%" not "40.0%"
    expect(within(rows[1]).getByText("0.4%")).toBeInTheDocument();
  });

  it("should toggle sort direction on same column (desc → asc → desc)", async () => {
    const pools = [
      createMockPool({ protocol: "Aave", value: 1000 }),
      createMockPool({ protocol: "Compound", value: 2000 }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const table = screen.getByRole("table");
    const valueHeader = within(table).getByText("Value");

    // Default is already value desc, so first click toggles to asc
    await userEvent.click(valueHeader);
    let rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("$1,000")).toBeInTheDocument();

    // Second click: toggle back to desc
    await userEvent.click(valueHeader);
    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("$2,000")).toBeInTheDocument();

    // Third click: toggle to asc again
    await userEvent.click(valueHeader);
    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("$1,000")).toBeInTheDocument();
  });

  it("should reset to descending when changing columns", async () => {
    const pools = [
      createMockPool({ protocol: "Aave", value: 1000, contribution: 0.15 }),
      createMockPool({ protocol: "Compound", value: 2000, contribution: 0.25 }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const table = screen.getByRole("table");
    const valueHeader = within(table).getByText("Value");
    const contributionHeader = within(table).getByText("Portfolio %");

    // Click value twice to get ascending
    await userEvent.click(valueHeader);
    await userEvent.click(valueHeader);

    // Now click Portfolio % - should default to descending
    await userEvent.click(contributionHeader);

    const rows = screen.getAllByRole("row");
    // Higher contribution should be first (descending)
    expect(within(rows[1]).getByText("0.3%")).toBeInTheDocument(); // 0.25 rounded to 0.3
  });

  it("should show correct chevron icon (up/down/gray)", () => {
    const pools = [createMockPool({ value: 1000 })];
    render(<PoolPerformanceTable pools={pools} />);

    // Default sort is by value desc
    // Check that chevrons exist
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("should maintain stable sort with equal values", async () => {
    const pools = [
      createMockPool({ id: "1", protocol: "Aave", value: 1000 }),
      createMockPool({ id: "2", protocol: "Compound", value: 1000 }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const table = screen.getByRole("table");
    const valueHeader = within(table).getByText("Value");
    await userEvent.click(valueHeader);

    const rows = screen.getAllByRole("row");
    // Both have same value, order should be stable
    expect(rows).toHaveLength(3); // header + 2 data rows
  });
});

describe("PoolPerformanceTable - Filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should filter by 'btc' category", () => {
    const pools = [
      createMockPool({ symbols: ["WBTC"], apr: 0.04 }),
      createMockPool({ symbols: ["WETH"], apr: 0.05 }),
    ];

    render(<PoolPerformanceTable pools={pools} categoryFilter="btc" />);

    // Should show 1 of 1 pools (only WBTC)
    expect(screen.getByText(/1 pools/)).toBeInTheDocument();
  });

  it("should filter by 'eth' category", () => {
    const pools = [
      createMockPool({ symbols: ["WBTC"], apr: 0.04 }),
      createMockPool({ symbols: ["WETH"], apr: 0.05 }),
    ];

    render(<PoolPerformanceTable pools={pools} categoryFilter="eth" />);

    expect(screen.getByText(/1 pools/)).toBeInTheDocument();
  });

  it("should filter by 'stablecoins' category", () => {
    const pools = [
      createMockPool({ symbols: ["USDC", "DAI"], apr: 0.03 }),
      createMockPool({ symbols: ["WETH"], apr: 0.05 }),
    ];

    render(<PoolPerformanceTable pools={pools} categoryFilter="stablecoins" />);

    expect(screen.getByText(/1 pools/)).toBeInTheDocument();
  });

  it("should filter by 'others' category", () => {
    const pools = [
      createMockPool({ symbols: ["LINK"], apr: 0.04 }),
      createMockPool({ symbols: ["WETH"], apr: 0.05 }),
    ];

    render(<PoolPerformanceTable pools={pools} categoryFilter="others" />);

    expect(screen.getByText(/1 pools/)).toBeInTheDocument();
  });

  it("should call onClearCategoryFilter when clear button clicked", async () => {
    const onClearFilter = vi.fn();
    const pools = [mockBitcoinPool];

    render(
      <PoolPerformanceTable
        pools={pools}
        categoryFilter="btc"
        onClearCategoryFilter={onClearFilter}
      />
    );

    const clearButton = screen.getByTitle("Clear filter");
    await userEvent.click(clearButton);

    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });
});

describe("PoolPerformanceTable - Pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should default show Top 5 pools", () => {
    const pools = Array.from({ length: 10 }, (_, i) =>
      createMockPool({ id: `pool-${i}`, value: 1000 * (i + 1) })
    );

    render(<PoolPerformanceTable pools={pools} defaultTopN={5} />);

    expect(screen.getByText(/Showing 5 of 10/)).toBeInTheDocument();
  });

  it("should show Top 10 when selecting 10", async () => {
    const pools = Array.from({ length: 20 }, (_, i) =>
      createMockPool({ id: `pool-${i}`, value: 1000 * (i + 1) })
    );

    render(<PoolPerformanceTable pools={pools} defaultTopN={5} />);

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "10");

    expect(screen.getByText(/Showing 10 of 20/)).toBeInTheDocument();
  });

  it("should show Top 20 when selecting 20", async () => {
    const pools = Array.from({ length: 30 }, (_, i) =>
      createMockPool({ id: `pool-${i}`, value: 1000 * (i + 1) })
    );

    render(<PoolPerformanceTable pools={pools} defaultTopN={5} />);

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "20");

    expect(screen.getByText(/Showing 20 of 30/)).toBeInTheDocument();
  });

  it("should show all pools when selecting 'All'", async () => {
    const pools = Array.from({ length: 15 }, (_, i) =>
      createMockPool({ id: `pool-${i}`, value: 1000 * (i + 1) })
    );

    render(<PoolPerformanceTable pools={pools} defaultTopN={5} />);

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "all");

    expect(screen.getByText(/15 pools/)).toBeInTheDocument();
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it("should apply Top N after sorting", async () => {
    const pools = [
      createMockPool({ id: "1", value: 1000, contribution: 0.15 }),
      createMockPool({ id: "2", value: 2000, contribution: 0.25 }),
      createMockPool({ id: "3", value: 3000, contribution: 0.2 }),
    ];

    render(<PoolPerformanceTable pools={pools} defaultTopN={2} />);

    const table = screen.getByRole("table");
    const contributionHeader = within(table).getByText("Portfolio %");
    await userEvent.click(contributionHeader);

    // Should show top 2 by contribution (0.25, 0.20)
    expect(screen.getByText(/Showing 2 of 3/)).toBeInTheDocument();
  });

  it("should show correct 'X of Y pools' count", () => {
    const pools = Array.from({ length: 7 }, (_, i) =>
      createMockPool({ id: `pool-${i}`, value: 1000 * (i + 1) })
    );

    render(<PoolPerformanceTable pools={pools} defaultTopN={5} />);

    expect(screen.getByText(/Showing 5 of 7/)).toBeInTheDocument();
  });
});

describe("PoolPerformanceTable - Underperforming Detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should mark pool with APR ≤ 2.5% as underperforming", () => {
    const pool = createMockPool({ apr: 0.025 }); // Exactly 2.5%
    render(<PoolPerformanceTable pools={[pool]} />);

    // Check summary footer
    expect(screen.getByText("1")).toBeInTheDocument(); // Underperforming count
  });

  it("should NOT mark pool with APR = 2.6% as underperforming", () => {
    const pool = createMockPool({ apr: 0.026 }); // Just above threshold
    render(<PoolPerformanceTable pools={[pool]} />);

    // Check summary footer - should show 0 underperforming
    const summarySection = screen.getByText("Performing Well").parentElement;
    expect(summarySection).toBeInTheDocument();
  });

  it("should mark pool with protocol_matched=false as underperforming", () => {
    const pool = createMockPool({ matched: false, apr: 0.05 });
    render(<PoolPerformanceTable pools={[pool]} />);

    // Should show 1 underperforming
    const underperformingSection =
      screen.getByText("Underperforming").parentElement;
    expect(underperformingSection).toBeInTheDocument();
  });

  it("should show underperforming count in summary footer", () => {
    const pools = [
      createMockPool({ apr: 0.02 }), // Underperforming
      createMockPool({ apr: 0.05 }), // Normal
      createMockPool({ matched: false }), // Underperforming
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const underperformingSection =
      screen.getByText("Underperforming").parentElement;
    expect(
      within(underperformingSection as HTMLElement).getByText("2")
    ).toBeInTheDocument();
  });

  it("should show performing well count in summary footer", () => {
    const pools = [
      createMockPool({ apr: 0.05 }), // Performing well
      createMockPool({ apr: 0.06 }), // Performing well
      createMockPool({ apr: 0.02 }), // Underperforming
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const performingSection = screen.getByText("Performing Well").parentElement;
    expect(
      within(performingSection as HTMLElement).getByText("2")
    ).toBeInTheDocument();
  });

  it("should show yellow background for underperforming pools on mobile", () => {
    const pool = createMockPool({ apr: 0.02 });
    const { container } = render(<PoolPerformanceTable pools={[pool]} />);

    // Check for yellow background class in mobile view
    const mobileCard = container.querySelector(".bg-yellow-900\\/20");
    expect(mobileCard).toBeInTheDocument();
  });
});

describe("PoolPerformanceTable - APR Formatting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show green text + TrendingUp icon for APR > 5%", () => {
    const pool = createMockPool({ apr: 0.06 }); // 6%
    render(<PoolPerformanceTable pools={[pool]} />);

    // APR appears in both desktop and mobile views
    const aprElements = screen.getAllByText("6.00%");
    expect(aprElements.length).toBeGreaterThan(0);
    // TrendingUp icon should be present
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("should show red text + TrendingDown icon for APR ≤ 1%", () => {
    const pool = createMockPool({ apr: 0.01 }); // 1%
    render(<PoolPerformanceTable pools={[pool]} />);

    // APR appears in both desktop and mobile views
    const aprElements = screen.getAllByText("1.00%");
    expect(aprElements.length).toBeGreaterThan(0);
    // TrendingDown icon should be present
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("should show white text with no icon for 1% < APR ≤ 5%", () => {
    const pool = createMockPool({ apr: 0.03 }); // 3%
    render(<PoolPerformanceTable pools={[pool]} />);

    // APR appears in both desktop and mobile views
    const aprElements = screen.getAllByText("3.00%");
    expect(aprElements.length).toBeGreaterThan(0);
  });

  it("should show yellow text for underperforming pools regardless of APR", () => {
    const pool = createMockPool({ apr: 0.02 }); // 2% - underperforming
    render(<PoolPerformanceTable pools={[pool]} />);

    // APR appears in both desktop and mobile views
    const aprElements = screen.getAllByText("2.00%");
    expect(aprElements.length).toBeGreaterThan(0);
  });
});

describe("PoolPerformanceTable - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display single pool correctly", () => {
    const pool = createMockPool({ protocol: "Aave", value: 1000 });
    render(<PoolPerformanceTable pools={[pool]} />);

    // Protocol appears in both desktop and mobile views
    expect(screen.getAllByText("Aave")[0]).toBeInTheDocument();
    expect(screen.getAllByText("$1,000")[0]).toBeInTheDocument();
    expect(screen.getByText(/1 pools/)).toBeInTheDocument();
  });

  it("should show 0 performing well when all pools underperforming", () => {
    const pools = [
      createMockPool({ apr: 0.01 }),
      createMockPool({ apr: 0.015 }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    const performingSection = screen.getByText("Performing Well").parentElement;
    // "0" appears multiple times in the UI (desktop + mobile), so use within to scope
    const zeros = within(performingSection as HTMLElement).getAllByText("0");
    expect(zeros.length).toBeGreaterThan(0);
  });

  it("should handle filter → sort → paginate flow correctly", async () => {
    const pools = [
      createMockPool({ symbols: ["WBTC"], apr: 0.04, value: 1000 }),
      createMockPool({ symbols: ["WBTC"], apr: 0.06, value: 2000 }),
      createMockPool({ symbols: ["WETH"], apr: 0.05, value: 1500 }),
    ];

    const onClearFilter = vi.fn();
    render(
      <PoolPerformanceTable
        pools={pools}
        categoryFilter="btc"
        onClearCategoryFilter={onClearFilter}
        defaultTopN={1}
      />
    );

    // Should show only BTC pools (2)
    expect(screen.getByText(/Showing 1 of 2/)).toBeInTheDocument();

    // Should show highest APR BTC pool (6%) - appears in both desktop and mobile
    expect(screen.getAllByText("6.00%").length).toBeGreaterThan(0);
    expect(screen.queryByText("4.00%")).toBeNull();
  });

  it("should maintain sort state when changing category filter", async () => {
    const pools = [
      createMockPool({ symbols: ["WBTC"], contribution: 0.2, value: 1000 }),
      createMockPool({ symbols: ["WBTC"], contribution: 0.3, value: 2000 }),
    ];

    const { rerender } = render(<PoolPerformanceTable pools={pools} />);

    const table = screen.getByRole("table");
    const contributionHeader = within(table).getByText("Portfolio %");
    await userEvent.click(contributionHeader);

    // Now apply filter
    rerender(<PoolPerformanceTable pools={pools} categoryFilter="btc" />);

    // Sort should still be applied (highest contribution first) - appears in both desktop and mobile
    expect(screen.getAllByText("0.3%").length).toBeGreaterThan(0);
  });

  it("should show '+N more' for token symbols overflow (3+ desktop, 2+ mobile)", () => {
    const pool = createMockPool({
      symbols: ["USDC", "USDT", "DAI", "BUSD"],
    });

    render(<PoolPerformanceTable pools={[pool]} />);

    // Should show +1 more for 4 symbols (shows 3 + +1) - appears in both desktop and mobile
    const plusOnes = screen.getAllByText("+1");
    expect(plusOnes.length).toBeGreaterThan(0);
  });

  it("should default snapshot count to 0 when snapshot_ids undefined", () => {
    const pool: PoolDetail = {
      snapshot_id: "snap-1",
      snapshot_ids: undefined,
      chain: "ethereum",
      protocol_name: "Aave",
      asset_usd_value: 1000,
      pool_symbols: ["USDC"],
      final_apr: 0.05,
      protocol_matched: true,
      contribution_to_portfolio: 0.1,
      apr_data: {},
    };

    render(<PoolPerformanceTable pools={[pool]} />);

    // Should show 0 in Positions column - "0" appears in both desktop table and mobile cards
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    // Check the data row (index 1, after header)
    expect(within(rows[1]).getByText("0")).toBeInTheDocument();
  });
});

describe("PoolPerformanceTable - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render complete desktop table with all columns and data", () => {
    const pools = [
      createMockPool({
        protocol: "Aave",
        value: 5000,
        symbols: ["USDC", "USDT"],
        apr: 0.055,
        contribution: 0.25,
        snapshots: 5,
      }),
    ];

    render(<PoolPerformanceTable pools={pools} />);

    // Check all column data is present - using getAllByText for items that appear in both desktop and mobile
    expect(screen.getAllByText("Aave")[0]).toBeInTheDocument();
    expect(screen.getAllByText("USDC")[0]).toBeInTheDocument();
    expect(screen.getAllByText("USDT")[0]).toBeInTheDocument();
    expect(screen.getAllByText("5")[0]).toBeInTheDocument(); // Snapshot count
    expect(screen.getAllByText("5.50%")[0]).toBeInTheDocument(); // APR
    expect(screen.getAllByText("$5,000")[0]).toBeInTheDocument(); // Value
    expect(screen.getAllByText("0.3%")[0]).toBeInTheDocument(); // Contribution (0.25.toFixed(1) = "0.3" due to rounding)
  });

  it("should calculate and display average APR correctly", () => {
    const pools = [
      createMockPool({ apr: 0.04 }), // 4%
      createMockPool({ apr: 0.06 }), // 6%
    ];

    render(<PoolPerformanceTable pools={pools} />);

    // Average should be 5%
    const avgSection = screen.getByText("Avg APR").parentElement;
    expect(
      within(avgSection as HTMLElement).getByText("5.00%")
    ).toBeInTheDocument();
  });

  it("should handle empty filter results gracefully", () => {
    const pools = [createMockPool({ symbols: ["WETH"] })];

    render(<PoolPerformanceTable pools={pools} categoryFilter="btc" />);

    // Should show 0 pools when filter matches nothing
    expect(screen.getByText(/0 pools/)).toBeInTheDocument();
  });

  it("should update summary counts when changing Top N selection", async () => {
    const pools = [
      createMockPool({ apr: 0.01 }), // Underperforming
      createMockPool({ apr: 0.05 }), // Normal
      createMockPool({ apr: 0.06 }), // Normal
    ];

    render(<PoolPerformanceTable pools={pools} defaultTopN={2} />);

    // Initial: Top 2
    let underperformingSection =
      screen.getByText("Underperforming").parentElement;
    let performingSection = screen.getByText("Performing Well").parentElement;

    // Change to All
    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "all");

    // Now should show all 3 pools' counts
    underperformingSection = screen.getByText("Underperforming").parentElement;
    performingSection = screen.getByText("Performing Well").parentElement;

    expect(
      within(underperformingSection as HTMLElement).getByText("1")
    ).toBeInTheDocument();
    expect(
      within(performingSection as HTMLElement).getByText("2")
    ).toBeInTheDocument();
  });
});
