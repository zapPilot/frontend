import { vi } from "vitest";

/**
 * Mock implementation of Next.js dynamic imports for testing
 * This ensures that dynamic imports work properly in the test environment
 */
const mockDynamic = vi.fn(
  (
    importFunc: () => Promise<any>,
    options?: { loading?: () => JSX.Element; ssr?: boolean }
  ) => {
    // Create a component that resolves the import synchronously in tests
    const MockedDynamicComponent = (props: any) => {
      // In tests, we need to resolve imports synchronously
      // So we'll create a mock that returns the component directly
      try {
        // For testing, we'll try to resolve the import immediately
        const importResult = importFunc();

        // If it's a promise, we need to handle it
        if (importResult && typeof importResult.then === "function") {
          // Return loading component if available, otherwise return a placeholder
          if (options?.loading) {
            return options.loading();
          }
          return null;
        }

        // If it's not a promise, assume it's already resolved
        return importResult?.default ? importResult.default(props) : null;
      } catch (_error) {
        // If import fails, return loading or null
        if (options?.loading) {
          return options.loading();
        }
        return null;
      }
    };

    MockedDynamicComponent.displayName = "MockedDynamicComponent";
    return MockedDynamicComponent;
  }
);

export default mockDynamic;
