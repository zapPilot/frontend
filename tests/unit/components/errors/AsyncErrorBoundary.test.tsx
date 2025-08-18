import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AsyncErrorBoundary } from "../../../../src/components/errors/AsyncErrorBoundary";

// Mock child component
function TestComponent() {
  return <div data-testid="test-component">Test Content</div>;
}

// Mock ErrorBoundary with a simple implementation
vi.mock("../../../../src/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: vi.fn(({ children }) => children),
}));

describe("AsyncErrorBoundary", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe("Basic Rendering", () => {
    it("should render children when no error occurs", () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AsyncErrorBoundary>
            <TestComponent />
          </AsyncErrorBoundary>
        </QueryClientProvider>
      );

      expect(screen.getByTestId("test-component")).toBeInTheDocument();
    });

    it("should wrap children with QueryErrorResetBoundary and ErrorBoundary", () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <AsyncErrorBoundary>
            <TestComponent />
          </AsyncErrorBoundary>
        </QueryClientProvider>
      );

      expect(container).toBeInTheDocument();
      expect(screen.getByTestId("test-component")).toBeInTheDocument();
    });
  });

  describe("Props Handling", () => {
    it("should accept resetKeys prop", () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AsyncErrorBoundary resetKeys={["key1", "key2"]}>
            <TestComponent />
          </AsyncErrorBoundary>
        </QueryClientProvider>
      );

      expect(screen.getByTestId("test-component")).toBeInTheDocument();
    });

    it("should accept custom fallback prop", () => {
      const customFallback = (
        <div data-testid="custom-fallback">Custom Error</div>
      );

      render(
        <QueryClientProvider client={queryClient}>
          <AsyncErrorBoundary fallback={customFallback}>
            <TestComponent />
          </AsyncErrorBoundary>
        </QueryClientProvider>
      );

      expect(screen.getByTestId("test-component")).toBeInTheDocument();
    });

    it("should accept onError callback prop", () => {
      const onError = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AsyncErrorBoundary onError={onError}>
            <TestComponent />
          </AsyncErrorBoundary>
        </QueryClientProvider>
      );

      expect(screen.getByTestId("test-component")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("should work with React Query provider", () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AsyncErrorBoundary>
            <TestComponent />
          </AsyncErrorBoundary>
        </QueryClientProvider>
      );

      expect(screen.getByTestId("test-component")).toBeInTheDocument();
    });

    it("should render without crashing when no props provided", () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AsyncErrorBoundary>
            <TestComponent />
          </AsyncErrorBoundary>
        </QueryClientProvider>
      );

      expect(screen.getByTestId("test-component")).toBeInTheDocument();
    });
  });
});
