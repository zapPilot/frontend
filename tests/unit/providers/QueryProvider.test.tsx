import { useQueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QueryProvider } from "@/providers/QueryProvider";

import { render, screen } from "../../test-utils";

vi.mock("@/lib/state/queryClient", () => {
  const { QueryClient } = require("@tanstack/react-query");
  return { queryClient: new QueryClient() };
});

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => <div data-testid="devtools" />,
}));

describe("QueryProvider", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children", () => {
    render(
      <QueryProvider>
        <div data-testid="test-child">Test Content</div>
      </QueryProvider>
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("does not render devtools in test environment", () => {
    process.env.NODE_ENV = "test";
    process.env["NEXT_PUBLIC_ENABLE_RQ_DEVTOOLS"] = "1";

    render(
      <QueryProvider>
        <div>Child</div>
      </QueryProvider>
    );

    expect(screen.queryByTestId("devtools")).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("provides QueryClient context", () => {
    function TestComponent() {
      const queryClient = useQueryClient();
      return (
        <div data-testid="has-client">
          {queryClient ? "Has Client" : "No Client"}
        </div>
      );
    }

    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    );

    expect(screen.getByTestId("has-client")).toHaveTextContent("Has Client");
  });
});
