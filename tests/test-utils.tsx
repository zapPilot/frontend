import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  RenderOptions,
  renderHook as originalRenderHook,
  RenderHookOptions,
} from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { ToastProvider } from "../src/hooks/useToast";

/**
 * Create a new QueryClient for each test to ensure test isolation
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries during testing
        retry: false,
        // Disable background refetching during testing
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        // Set stale time to infinity during testing to prevent unexpected refetches
        staleTime: Infinity,
        // Disable garbage collection during testing
        gcTime: Infinity,
      },
      mutations: {
        // Disable retries during testing
        retry: false,
      },
    },
    // Disable error logging during testing
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

interface AllTheProvidersProps {
  children: ReactNode;
}

/**
 * Test wrapper component that provides all necessary context providers
 */
function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with necessary providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Custom renderHook function that wraps hooks with necessary providers
 */
function customRenderHook<Result, Props>(
  hook: (initialProps: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, "wrapper">
) {
  return originalRenderHook(hook, { wrapper: AllTheProviders, ...options });
}

/**
 * Create a QueryClient specifically for testing with manual control
 */
export function createMockQueryClient(): QueryClient {
  return createTestQueryClient();
}

/**
 * Wrapper component for components that need only QueryClient
 */
export function QueryClientWrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react";

// Override the default render and renderHook methods
export { customRender as render, customRenderHook as renderHook };

// =============================================================================
// MOCK UTILITIES
// =============================================================================

/**
 * Centralized formatter mocks.
 * Import and use in test files to avoid duplication.
 *
 * @example
 * ```typescript
 * import { mockFormatters } from 'tests/test-utils';
 *
 * vi.mock('@/lib/formatters', () => mockFormatters);
 * ```
 */
export { mockFormatters, resetFormatterMocks } from "./mocks/formatters";
