import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  WalletPortfolio,
  WalletPortfolioProps,
} from "../../../src/components/WalletPortfolio";
import { useWalletPortfolioState } from "../../../src/hooks/useWalletPortfolioState";

// Mock the hook
vi.mock("../../../src/hooks/useWalletPortfolioState");

// Mock ThirdWeb hooks
vi.mock("thirdweb/react", () => ({
  useActiveAccount: vi.fn(() => null),
  ConnectButton: vi.fn(({ children, ...props }) => (
    <button data-testid="connect-button" {...props}>
      Connect Wallet
    </button>
  )),
}));

// Mock SimpleConnectButton
vi.mock("../../../src/components/Web3/SimpleConnectButton", () => ({
  SimpleConnectButton: vi.fn(({ className, size }) => (
    <button data-testid="simple-connect-button" className={className}>
      Connect Wallet
    </button>
  )),
}));

// Mock child components with type-safe props
vi.mock("../../../src/components/ui/GlassCard", () => ({
  GlassCard: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="glass-card">{children}</div>
  )),
}));

vi.mock("../../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(
    ({
      onAnalyticsClick,
      onWalletManagerClick,
      onToggleBalance,
      balanceHidden,
    }: {
      onAnalyticsClick?: () => void;
      onWalletManagerClick: () => void;
      onToggleBalance: () => void;
      balanceHidden: boolean;
    }) => (
      <div data-testid="wallet-header">
        {onAnalyticsClick && (
          <button data-testid="analytics-button" onClick={onAnalyticsClick}>
            Analytics
          </button>
        )}
        <button
          data-testid="wallet-manager-button"
          onClick={onWalletManagerClick}
        >
          Manager
        </button>
        <button data-testid="toggle-balance" onClick={onToggleBalance}>
          {balanceHidden ? "Show" : "Hide"}
        </button>
      </div>
    )
  ),
}));

vi.mock("../../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(
    ({
      totalValue,
      balanceHidden,
      isLoading,
      error,
      portfolioChangePercentage,
    }: {
      totalValue: number | null;
      balanceHidden: boolean;
      isLoading: boolean;
      error: string | null;
      portfolioChangePercentage: number;
    }) => (
      <div data-testid="wallet-metrics">
        <div data-testid="total-value">{totalValue}</div>
        <div data-testid="balance-hidden">{balanceHidden.toString()}</div>
        <div data-testid="is-loading">{isLoading.toString()}</div>
        <div data-testid="error">{error || "null"}</div>
        <div data-testid="change-percentage">{portfolioChangePercentage}</div>
      </div>
    )
  ),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(
    ({
      onZapInClick,
      onZapOutClick,
      onOptimizeClick,
    }: {
      onZapInClick?: () => void;
      onZapOutClick?: () => void;
      onOptimizeClick?: () => void;
    }) => (
      <div data-testid="wallet-actions">
        <button data-testid="zap-in" onClick={onZapInClick}>
          Zap In
        </button>
        <button data-testid="zap-out" onClick={onZapOutClick}>
          Zap Out
        </button>
        <button data-testid="optimize" onClick={onOptimizeClick}>
          Optimize
        </button>
      </div>
    )
  ),
}));

vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn((props: any) => (
    <div data-testid="portfolio-overview">
      <div data-testid="portfolio-title">{props.title}</div>
      <div data-testid="portfolio-loading">{props.isLoading?.toString()}</div>
      <div data-testid="portfolio-error">{props.apiError || "null"}</div>
      <div data-testid="portfolio-retrying">{props.isRetrying?.toString()}</div>
      {props.onRetry && (
        <button data-testid="retry-button" onClick={props.onRetry}>
          Retry
        </button>
      )}
    </div>
  )),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(
    ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
      isOpen ? (
        <div data-testid="wallet-manager">
          <button data-testid="close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      ) : null
  ),
}));

describe("WalletPortfolio - TypeScript Integration and Prop Validation Tests", () => {
  const mockUseWalletPortfolioState = vi.mocked(useWalletPortfolioState);

  const defaultMockState = {
    totalValue: 15000,
    portfolioData: [],
    pieChartData: [],
    isLoading: false,
    apiError: null,
    retry: vi.fn(),
    isRetrying: false,
    balanceHidden: false,
    expandedCategory: null,
    portfolioMetrics: { totalChangePercentage: 5.2 },
    toggleBalanceVisibility: vi.fn(),
    toggleCategoryExpansion: vi.fn(),
    isWalletManagerOpen: false,
    openWalletManager: vi.fn(),
    closeWalletManager: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWalletPortfolioState.mockReturnValue(defaultMockState);
  });

  describe("TypeScript Type Safety", () => {
    it("should accept all valid prop types", () => {
      const validProps: WalletPortfolioProps = {
        onAnalyticsClick: () => console.log("analytics"),
        onOptimizeClick: () => console.log("optimize"),
        onZapInClick: () => console.log("zap in"),
        onZapOutClick: () => console.log("zap out"),
      };

      expect(() => {
        render(<WalletPortfolio {...validProps} />);
      }).not.toThrow();

      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
    });

    it("should accept no props (all optional)", () => {
      expect(() => {
        render(<WalletPortfolio />);
      }).not.toThrow();

      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
    });

    it("should accept partial props", () => {
      const partialProps: WalletPortfolioProps = {
        onAnalyticsClick: () => console.log("analytics"),
        onZapInClick: () => console.log("zap in"),
        // onOptimizeClick and onZapOutClick are omitted
      };

      expect(() => {
        render(<WalletPortfolio {...partialProps} />);
      }).not.toThrow();

      expect(screen.getByTestId("analytics-button")).toBeInTheDocument();
    });

    it("should handle undefined props gracefully", () => {
      const propsWithUndefined: WalletPortfolioProps = {
        onAnalyticsClick: undefined,
        onOptimizeClick: undefined,
        onZapInClick: undefined,
        onZapOutClick: undefined,
      };

      expect(() => {
        render(<WalletPortfolio {...propsWithUndefined} />);
      }).not.toThrow();

      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
    });
  });

  describe("Callback Type Safety", () => {
    it("should enforce void return type for callbacks", () => {
      const callbacks: WalletPortfolioProps = {
        onAnalyticsClick: (): void => {
          // Valid: void return
        },
        onOptimizeClick: (): void => {
          console.log("optimizing");
          // Valid: void return with statement
        },
        onZapInClick: () => {
          // Valid: implicit void return
        },
        onZapOutClick: () => undefined, // Valid: explicit undefined return
      };

      render(<WalletPortfolio {...callbacks} />);

      fireEvent.click(screen.getByTestId("analytics-button"));
      fireEvent.click(screen.getByTestId("zap-in"));
      fireEvent.click(screen.getByTestId("zap-out"));
      fireEvent.click(screen.getByTestId("optimize"));

      // Should not throw type errors or runtime errors
      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
    });

    it("should handle async callbacks if allowed by types", () => {
      const asyncCallbacks: WalletPortfolioProps = {
        onAnalyticsClick: async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
        },
        onZapInClick: async () => {
          return Promise.resolve();
        },
      };

      render(<WalletPortfolio {...asyncCallbacks} />);

      expect(() => {
        fireEvent.click(screen.getByTestId("analytics-button"));
        fireEvent.click(screen.getByTestId("zap-in"));
      }).not.toThrow();
    });

    it("should handle callbacks with proper this context", () => {
      class TestContext {
        value = 42;

        onAnalytics = (): void => {
          expect(this.value).toBe(42);
        };

        onZapIn = (): void => {
          expect(this.value).toBe(42);
        };
      }

      const context = new TestContext();

      render(
        <WalletPortfolio
          onAnalyticsClick={context.onAnalytics}
          onZapInClick={context.onZapIn}
        />
      );

      fireEvent.click(screen.getByTestId("analytics-button"));
      fireEvent.click(screen.getByTestId("zap-in"));
    });
  });

  describe("Hook Integration Type Safety", () => {
    it("should handle typed hook return values", () => {
      const typedMockState = {
        ...defaultMockState,
        totalValue: 25000 as number,
        isLoading: false as boolean,
        apiError: null as string | null,
        balanceHidden: true as boolean,
        portfolioMetrics: { totalChangePercentage: -3.5 as number },
      };

      mockUseWalletPortfolioState.mockReturnValue(typedMockState);

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("25000");
      expect(screen.getByTestId("balance-hidden")).toHaveTextContent("true");
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      expect(screen.getByTestId("error")).toHaveTextContent("null");
      expect(screen.getByTestId("change-percentage")).toHaveTextContent("-3.5");
    });

    it("should handle null values in hook state", () => {
      const nullValueState = {
        ...defaultMockState,
        totalValue: null as number | null,
        apiError: "API Error" as string | null,
        expandedCategory: null as string | null,
      };

      mockUseWalletPortfolioState.mockReturnValue(nullValueState);

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("");
      expect(screen.getByTestId("error")).toHaveTextContent("API Error");
    });

    it("should handle array types correctly", () => {
      const arrayState = {
        ...defaultMockState,
        portfolioData: [] as any[],
        pieChartData: [] as any[],
      };

      mockUseWalletPortfolioState.mockReturnValue(arrayState);

      render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });

    it("should handle function types in hook state", () => {
      const functionState = {
        ...defaultMockState,
        retry: vi.fn() as () => void,
        toggleBalanceVisibility: vi.fn() as () => void,
        toggleCategoryExpansion: vi.fn() as (category: string) => void,
        openWalletManager: vi.fn() as () => void,
        closeWalletManager: vi.fn() as () => void,
      };

      mockUseWalletPortfolioState.mockReturnValue(functionState);

      render(<WalletPortfolio />);

      // Should not cause type errors
      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
    });
  });

  describe("Component Prop Forwarding", () => {
    it("should forward props to child components with correct types", () => {
      render(<WalletPortfolio />);

      // Verify that all child components receive the correct props
      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-actions")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });

    it("should pass optional callbacks correctly", () => {
      const onAnalyticsClick = vi.fn();

      render(<WalletPortfolio onAnalyticsClick={onAnalyticsClick} />);

      expect(screen.getByTestId("analytics-button")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("analytics-button"));
      expect(onAnalyticsClick).toHaveBeenCalledTimes(1);
    });

    it("should handle missing optional callbacks", () => {
      render(<WalletPortfolio />);

      // Analytics button should not be present when callback is not provided
      expect(screen.queryByTestId("analytics-button")).not.toBeInTheDocument();
    });

    it("should pass portfolio data with correct structure", () => {
      render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-title")).toHaveTextContent(
        "Asset Distribution"
      );
    });
  });

  describe("Generic Type Constraints", () => {
    it("should handle generic constraints in child components", () => {
      // Test that the component works with generic types from the type system
      render(<WalletPortfolio />);

      // Should render without TypeScript errors
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });

    it("should maintain type safety with complex nested types", () => {
      const complexState = {
        ...defaultMockState,
        portfolioData: [] as Array<{
          id: string;
          name: string;
          totalValue: number;
          percentage: number;
          color: string;
          assets: Array<{
            id: string;
            symbol: string;
            name: string;
            amount: number;
            value: number;
            price: number;
            change24h: number;
          }>;
        }>,
      };

      mockUseWalletPortfolioState.mockReturnValue(complexState);

      render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });
  });

  describe("Error Handling with Types", () => {
    it("should handle typed error states", () => {
      const errorState = {
        ...defaultMockState,
        apiError: "Network timeout error" as string,
        isLoading: false as boolean,
      };

      mockUseWalletPortfolioState.mockReturnValue(errorState);

      render(<WalletPortfolio />);

      expect(screen.getByTestId("error")).toHaveTextContent(
        "Network timeout error"
      );
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
    });

    it("should handle loading states with proper boolean typing", () => {
      const loadingState = {
        ...defaultMockState,
        isLoading: true as boolean,
        isRetrying: false as boolean,
      };

      mockUseWalletPortfolioState.mockReturnValue(loadingState);

      render(<WalletPortfolio />);

      expect(screen.getByTestId("is-loading")).toHaveTextContent("true");
    });
  });

  describe("Ref and DOM Types", () => {
    it("should handle ref types correctly", () => {
      // Test that the component can be used with refs if needed
      const TestWithRef = () => {
        const ref = React.useRef<HTMLDivElement>(null);

        return (
          <div ref={ref}>
            <WalletPortfolio />
          </div>
        );
      };

      render(<TestWithRef />);

      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
    });

    it("should handle DOM element types in event handlers", () => {
      const handleAnalytics = (event?: React.MouseEvent<HTMLButtonElement>) => {
        // Should not cause TypeScript errors
        if (event) {
          expect(event.type).toBeDefined();
        }
      };

      render(<WalletPortfolio onAnalyticsClick={handleAnalytics} />);

      fireEvent.click(screen.getByTestId("analytics-button"));
    });
  });

  describe("Union Types and Discriminated Unions", () => {
    it("should handle union types in state", () => {
      const unionState = {
        ...defaultMockState,
        totalValue: 15000 as number | null,
        expandedCategory: "btc" as string | null,
        apiError: null as string | null,
      };

      mockUseWalletPortfolioState.mockReturnValue(unionState);

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("15000");
    });

    it("should handle discriminated unions for different states", () => {
      // Test loading state
      const loadingState = {
        ...defaultMockState,
        isLoading: true,
        totalValue: null,
      };

      const { rerender } = render(<WalletPortfolio />);

      mockUseWalletPortfolioState.mockReturnValue(loadingState);
      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("is-loading")).toHaveTextContent("true");

      // Test error state
      const errorState = {
        ...defaultMockState,
        isLoading: false,
        apiError: "Error message",
      };

      mockUseWalletPortfolioState.mockReturnValue(errorState);
      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("error")).toHaveTextContent("Error message");
    });
  });

  describe("Type Inference", () => {
    it("should infer types correctly from props", () => {
      // Test that TypeScript can infer types without explicit annotations
      const callbacks = {
        onAnalyticsClick: () => {}, // Should infer () => void
        onZapInClick: () => {}, // Should infer () => void
      };

      render(<WalletPortfolio {...callbacks} />);

      expect(screen.getByTestId("analytics-button")).toBeInTheDocument();
    });

    it("should work with type assertions when needed", () => {
      const props = {
        onAnalyticsClick: (() => {}) as () => void,
        onOptimizeClick: (() => {}) as () => void,
      };

      render(<WalletPortfolio {...props} />);

      expect(screen.getByTestId("analytics-button")).toBeInTheDocument();
    });
  });

  describe("Conditional Types", () => {
    it("should handle conditional rendering based on prop types", () => {
      // With analytics callback
      const { unmount } = render(
        <WalletPortfolio onAnalyticsClick={() => {}} />
      );
      expect(screen.getByTestId("analytics-button")).toBeInTheDocument();
      unmount();

      // Without analytics callback
      render(<WalletPortfolio />);
      expect(screen.queryByTestId("analytics-button")).not.toBeInTheDocument();
    });

    it("should handle modal state conditional rendering", () => {
      // Modal closed
      render(<WalletPortfolio />);
      expect(screen.queryByTestId("wallet-manager")).not.toBeInTheDocument();

      // Modal open
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isWalletManagerOpen: true,
      });

      const { rerender } = render(<WalletPortfolio />);
      rerender(<WalletPortfolio />);
      expect(screen.getByTestId("wallet-manager")).toBeInTheDocument();
    });
  });

  describe("Type Guards and Runtime Checks", () => {
    it("should handle type guards for optional props", () => {
      const ConditionalWrapper = ({
        hasAnalytics,
      }: {
        hasAnalytics: boolean;
      }) => {
        const props: WalletPortfolioProps = hasAnalytics
          ? { onAnalyticsClick: () => {} }
          : {};

        return <WalletPortfolio {...props} />;
      };

      const { rerender } = render(<ConditionalWrapper hasAnalytics={true} />);
      expect(screen.getByTestId("analytics-button")).toBeInTheDocument();

      rerender(<ConditionalWrapper hasAnalytics={false} />);
      expect(screen.queryByTestId("analytics-button")).not.toBeInTheDocument();
    });

    it("should maintain type safety with runtime prop validation", () => {
      // This would typically include runtime prop validation
      // Here we test that types and runtime behavior align
      const validProps: WalletPortfolioProps = {
        onAnalyticsClick: vi.fn(),
        onZapInClick: vi.fn(),
        onZapOutClick: vi.fn(),
        onOptimizeClick: vi.fn(),
      };

      render(<WalletPortfolio {...validProps} />);

      // All buttons should be present
      expect(screen.getByTestId("analytics-button")).toBeInTheDocument();
      expect(screen.getByTestId("zap-in")).toBeInTheDocument();
      expect(screen.getByTestId("zap-out")).toBeInTheDocument();
      expect(screen.getByTestId("optimize")).toBeInTheDocument();
    });
  });
});
