import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, vi } from "vitest";
import { PortfolioChart } from "@/components/PortfolioChart/";
import { ChartTestFixtures } from "../fixtures/chartTestData";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    line: ({ children, ...props }: any) => <line {...props}>{children}</line>,
    circle: ({ children, ...props }: any) => (
      <circle {...props}>{children}</circle>
    ),
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <span
      role="img"
      aria-label={alt}
      data-src={src}
      data-testid="next-image-mock"
      {...props}
    />
  ),
}));

describe("PortfolioChart debug", () => {
  it("renders performance chart", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <PortfolioChart
          portfolioData={ChartTestFixtures.mediumPortfolioData()}
          allocationData={ChartTestFixtures.balancedAllocation()}
          drawdownData={ChartTestFixtures.drawdownData()}
          sharpeData={ChartTestFixtures.sharpeData()}
          volatilityData={ChartTestFixtures.volatilityData()}
          activeTab="performance"
        />
      </QueryClientProvider>
    );

    const svg = container.querySelector('svg[data-chart-type="performance"]');
    expect(svg).not.toBeNull();
  });
});
