/**
 * QueryProvider Unit Tests
 *
 * Tests for the React Query provider wrapper
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { QueryProvider } from "@/providers/QueryProvider";

// Mock React Query
vi.mock("@tanstack/react-query", () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}));

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => <div data-testid="devtools" />,
}));

vi.mock("@/lib/state/queryClient", () => ({
  queryClient: {},
}));

describe("QueryProvider", () => {
  it("should render children", () => {
    render(
      <QueryProvider>
        <div data-testid="child">Test Child</div>
      </QueryProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("should wrap children with QueryClientProvider", () => {
    render(
      <QueryProvider>
        <span>Content</span>
      </QueryProvider>
    );

    expect(screen.getByTestId("query-provider")).toBeInTheDocument();
  });
});
