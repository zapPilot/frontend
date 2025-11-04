/**
 * Unit tests for useChartHover hook
 * Tests hover state management, RAF optimization, and data point extraction
 */

import { act,renderHook } from "@testing-library/react";
import { afterEach,beforeEach, describe, expect, it, vi } from "vitest";

import { useChartHover } from "@/hooks/useChartHover";
import type { ChartHoverState } from "@/types/chartHover";

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRaf = vi.fn((cb: FrameRequestCallback) => {
  cb(0);
  return 1;
});
const mockCancelRaf = vi.fn();

describe("useChartHover", () => {
  beforeEach(() => {
    global.requestAnimationFrame =
      mockRaf as unknown as typeof requestAnimationFrame;
    global.cancelAnimationFrame =
      mockCancelRaf as unknown as typeof cancelAnimationFrame;
    mockRaf.mockClear();
    mockCancelRaf.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Sample test data
  const sampleData = [
    { date: "2025-01-01", value: 10000 },
    { date: "2025-01-02", value: 11000 },
    { date: "2025-01-03", value: 10500 },
    { date: "2025-01-04", value: 12000 },
    { date: "2025-01-05", value: 13000 },
  ];

  const defaultOptions = {
    chartType: "performance",
    chartWidth: 800,
    chartHeight: 300,
    chartPadding: 10,
    minValue: 10000,
    maxValue: 13000,
    getYValue: (point: (typeof sampleData)[0]) => point.value,
    buildHoverData: (
      point: (typeof sampleData)[0],
      x: number,
      y: number,
      _index: number
    ): ChartHoverState => ({
      chartType: "performance" as const,
      x,
      y,
      date: point.date,
      value: point.value,
      benchmark: 0,
    }),
  };

  describe("Initial State", () => {
    it("should initialize with null hoveredPoint", () => {
      const { result } = renderHook(() =>
        useChartHover(sampleData, defaultOptions)
      );

      expect(result.current.hoveredPoint).toBeNull();
    });

    it("should provide handleMouseMove and handleMouseLeave functions", () => {
      const { result } = renderHook(() =>
        useChartHover(sampleData, defaultOptions)
      );

      expect(typeof result.current.handleMouseMove).toBe("function");
      expect(typeof result.current.handleMouseLeave).toBe("function");
    });
  });

  describe("Mouse Move Handling", () => {
    it("should update hoveredPoint on mouse move", () => {
      const { result } = renderHook(() =>
        useChartHover(sampleData, defaultOptions)
      );

      // Create mock SVG element and mouse event
      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      const mockEvent = {
        clientX: 400, // Middle of the chart (50% of 800px)
        clientY: 150,
        currentTarget: mockSvg,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.handleMouseMove(mockEvent);
      });

      // Should select middle data point (index 2)
      expect(result.current.hoveredPoint).not.toBeNull();
      expect(result.current.hoveredPoint?.chartType).toBe("performance");
      expect(result.current.hoveredPoint?.date).toBe(sampleData[2].date);
    });

    it("should use RAF for performance optimization", () => {
      const { result } = renderHook(() =>
        useChartHover(sampleData, defaultOptions)
      );

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      const mockEvent = {
        clientX: 200,
        clientY: 150,
        currentTarget: mockSvg,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.handleMouseMove(mockEvent);
      });

      expect(mockRaf).toHaveBeenCalled();
    });

    it("should clamp index to data bounds", () => {
      const { result } = renderHook(() =>
        useChartHover(sampleData, defaultOptions)
      );

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      // Test left boundary
      const leftEvent = {
        clientX: -100, // Beyond left edge
        clientY: 150,
        currentTarget: mockSvg,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.handleMouseMove(leftEvent);
      });

      expect(result.current.hoveredPoint?.date).toBe(sampleData[0].date);

      // Test right boundary
      const rightEvent = {
        clientX: 1000, // Beyond right edge
        clientY: 150,
        currentTarget: mockSvg,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.handleMouseMove(rightEvent);
      });

      expect(result.current.hoveredPoint?.date).toBe(
        sampleData[sampleData.length - 1].date
      );
    });

    it("should not update if index has not changed", () => {
      const { result } = renderHook(() =>
        useChartHover(sampleData, defaultOptions)
      );

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      const mockEvent = {
        clientX: 200,
        clientY: 150,
        currentTarget: mockSvg,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.handleMouseMove(mockEvent);
      });

      const firstHoveredPoint = result.current.hoveredPoint;
      mockRaf.mockClear();

      // Move slightly but still within same data point
      const samePointEvent = {
        ...mockEvent,
        clientX: 205,
      };

      act(() => {
        result.current.handleMouseMove(samePointEvent);
      });

      // RAF should not be called again for same index
      expect(result.current.hoveredPoint).toBe(firstHoveredPoint);
    });
  });

  describe("Mouse Leave Handling", () => {
    it("should clear hoveredPoint on mouse leave", () => {
      const { result } = renderHook(() =>
        useChartHover(sampleData, defaultOptions)
      );

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      const mockEvent = {
        clientX: 400,
        clientY: 150,
        currentTarget: mockSvg,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      // First, hover to set a point
      act(() => {
        result.current.handleMouseMove(mockEvent);
      });

      expect(result.current.hoveredPoint).not.toBeNull();

      // Then leave
      act(() => {
        result.current.handleMouseLeave();
      });

      expect(result.current.hoveredPoint).toBeNull();
    });

    it("should cancel pending RAF on mouse leave", () => {
      const { result } = renderHook(() =>
        useChartHover(sampleData, defaultOptions)
      );

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      const mockEvent = {
        clientX: 400,
        clientY: 150,
        currentTarget: mockSvg,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.handleMouseMove(mockEvent);
      });

      act(() => {
        result.current.handleMouseLeave();
      });

      expect(mockCancelRaf).toHaveBeenCalled();
    });
  });

  describe("Touch Handling", () => {
    it("should update hoveredPoint on touch move and prevent default scrolling", () => {
      const { result } = renderHook(() =>
        useChartHover(sampleData, defaultOptions)
      );

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      const preventDefault = vi.fn();
      const touchMoveEvent = {
        touches: [{ clientX: 400, clientY: 150 }],
        changedTouches: [],
        currentTarget: mockSvg,
        cancelable: true,
        preventDefault,
      } as unknown as React.TouchEvent<SVGSVGElement>;

      act(() => {
        result.current.handleTouchMove(touchMoveEvent);
      });

      expect(result.current.hoveredPoint?.date).toBe(sampleData[2].date);
      expect(preventDefault).toHaveBeenCalled();
    });

    it("should clear hoveredPoint on touch end", () => {
      const { result } = renderHook(() =>
        useChartHover(sampleData, defaultOptions)
      );

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      const touchMoveEvent = {
        touches: [{ clientX: 400, clientY: 150 }],
        changedTouches: [],
        currentTarget: mockSvg,
        cancelable: true,
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent<SVGSVGElement>;

      act(() => {
        result.current.handleTouchMove(touchMoveEvent);
      });

      expect(result.current.hoveredPoint).not.toBeNull();

      act(() => {
        result.current.handleTouchEnd();
      });

      expect(result.current.hoveredPoint).toBeNull();
    });
  });

  describe("Y Value Calculation", () => {
    it("should calculate correct Y position based on value", () => {
      const buildHoverDataSpy = vi.fn(defaultOptions.buildHoverData);
      const options = {
        ...defaultOptions,
        buildHoverData: buildHoverDataSpy,
      };

      const { result } = renderHook(() => useChartHover(sampleData, options));

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      const mockEvent = {
        clientX: 0, // First data point
        clientY: 150,
        currentTarget: mockSvg,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.handleMouseMove(mockEvent);
      });

      expect(buildHoverDataSpy).toHaveBeenCalled();
      const [point, _x, y, _index] = buildHoverDataSpy.mock.calls[0];

      // Verify Y calculation for minimum value
      expect(point.value).toBe(10000);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(300);
    });
  });

  describe("Enabled/Disabled State", () => {
    it("should not respond to mouse events when disabled", () => {
      const { result } = renderHook(() =>
        useChartHover(sampleData, {
          ...defaultOptions,
          enabled: false,
        })
      );

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      const mockEvent = {
        clientX: 400,
        clientY: 150,
        currentTarget: mockSvg,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.handleMouseMove(mockEvent);
      });

      expect(result.current.hoveredPoint).toBeNull();
      expect(mockRaf).not.toHaveBeenCalled();
    });
  });

  describe("Empty Data Handling", () => {
    it("should handle empty data array gracefully", () => {
      const { result } = renderHook(() => useChartHover([], defaultOptions));

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      const mockEvent = {
        clientX: 400,
        clientY: 150,
        currentTarget: mockSvg,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.handleMouseMove(mockEvent);
      });

      expect(result.current.hoveredPoint).toBeNull();
    });
  });

  describe("Cleanup", () => {
    it("should cancel RAF on unmount", () => {
      // Use a real RAF implementation for this test
      const realRaf = vi.fn((cb: FrameRequestCallback) => {
        cb(0);
        return 999;
      });
      global.requestAnimationFrame =
        realRaf as unknown as typeof requestAnimationFrame;

      const { result, unmount } = renderHook(() =>
        useChartHover(sampleData, defaultOptions)
      );

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      const mockEvent = {
        clientX: 400,
        clientY: 150,
        currentTarget: mockSvg,
      } as unknown as React.MouseEvent<SVGSVGElement>;

      act(() => {
        result.current.handleMouseMove(mockEvent);
      });

      unmount();

      expect(mockCancelRaf).toHaveBeenCalledWith(999);
    });
  });

  describe("Data Index Calculation", () => {
    it("should calculate correct data index for various mouse positions", () => {
      const buildHoverDataSpy = vi.fn(defaultOptions.buildHoverData);
      const options = {
        ...defaultOptions,
        buildHoverData: buildHoverDataSpy,
      };

      const { result } = renderHook(() => useChartHover(sampleData, options));

      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      mockSvg.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 300,
        right: 800,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      // Test first point (0% position)
      act(() => {
        result.current.handleMouseMove({
          clientX: 0,
          clientY: 150,
          currentTarget: mockSvg,
        } as unknown as React.MouseEvent<SVGSVGElement>);
      });
      expect(buildHoverDataSpy.mock.calls[0][3]).toBe(0);

      // Test middle point (50% position = index 2)
      buildHoverDataSpy.mockClear();
      act(() => {
        result.current.handleMouseMove({
          clientX: 400,
          clientY: 150,
          currentTarget: mockSvg,
        } as unknown as React.MouseEvent<SVGSVGElement>);
      });
      expect(buildHoverDataSpy.mock.calls[0][3]).toBe(2);

      // Test last point (100% position)
      buildHoverDataSpy.mockClear();
      act(() => {
        result.current.handleMouseMove({
          clientX: 800,
          clientY: 150,
          currentTarget: mockSvg,
        } as unknown as React.MouseEvent<SVGSVGElement>);
      });
      expect(buildHoverDataSpy.mock.calls[0][3]).toBe(4);
    });
  });
});
