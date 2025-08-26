import { expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup, configure } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Configure React Testing Library to work better with React 18+
configure({
  // Increase default timeout for async operations
  asyncTimeout: 5000,
});

// Configure global React environment for act() support
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock console.error to suppress act() warnings in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === "string" &&
      (message.includes("not configured to support act") ||
        message.includes("Warning: ReactDOM.render is no longer supported"))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

// Mock React Query's error boundary logging to avoid console noise during tests
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    // Silence QueryErrorResetBoundary console errors during testing
    useQueryErrorResetBoundary: () => ({ reset: vi.fn() }),
  };
});

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers);

// Clean up after each test case
afterEach(() => {
  cleanup();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = "";
  thresholds: ReadonlyArray<number> = [];

  constructor(
    _callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.root = (options?.root as Element) || null;
    this.rootMargin = options?.rootMargin || "";
    this.thresholds = Array.isArray(options?.threshold)
      ? options.threshold
      : [options?.threshold || 0];
  }

  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

// Mock PointerEvent for framer-motion
(global as any).PointerEvent = class PointerEvent extends Event {
  pointerId: number;
  width: number;
  height: number;
  pressure: number;
  tangentialPressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  pointerType: string;
  isPrimary: boolean;
  altitudeAngle: number = 0;
  azimuthAngle: number = 0;

  constructor(type: string, eventInitDict: any = {}) {
    super(type, eventInitDict);
    this.pointerId = eventInitDict.pointerId || 0;
    this.width = eventInitDict.width || 1;
    this.height = eventInitDict.height || 1;
    this.pressure = eventInitDict.pressure || 0;
    this.tangentialPressure = eventInitDict.tangentialPressure || 0;
    this.tiltX = eventInitDict.tiltX || 0;
    this.tiltY = eventInitDict.tiltY || 0;
    this.twist = eventInitDict.twist || 0;
    this.pointerType = eventInitDict.pointerType || "";
    this.isPrimary = eventInitDict.isPrimary || false;
  }

  getCoalescedEvents() {
    return [];
  }
  getPredictedEvents() {
    return [];
  }
};

// Mock HTMLElement.setPointerCapture and releasePointerCapture
HTMLElement.prototype.setPointerCapture = vi.fn();
HTMLElement.prototype.releasePointerCapture = vi.fn();
