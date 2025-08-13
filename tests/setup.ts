import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers);

// Clean up after each test case
afterEach(() => {
  cleanup();
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
