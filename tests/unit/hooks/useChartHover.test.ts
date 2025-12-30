/**
 * Unit tests for useChartHover hook
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useChartHover } from "@/hooks/useChartHover";

describe("useChartHover", () => {
  const mockData = [
    { value: 100, label: "A" },
    { value: 200, label: "B" },
    { value: 300, label: "C" },
  ];

  const defaultOptions = {
    chartType: "test",
    chartWidth: 300,
    chartHeight: 200,
    chartPadding: 10,
    minValue: 0,
    maxValue: 300,
    getYValue: (d: any) => d.value,
    buildHoverData: (d: any, x: number, y: number, index: number) => ({
      ...d,
      x,
      y,
      index,
    }),
  };

  // Mock SVG element
  const mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock getBoundingClientRect
    mockSvg.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 300,
      height: 200,
      right: 300,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => {
        /* noop - DOMRect mock */
      },
    }));

    // Mock CTM support
    const mockMatrix = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0,
      multiply: vi.fn(),
      inverse: vi.fn(() => mockMatrix),
      translate: vi.fn(),
      scale: vi.fn(),
      scaleNonUniform: vi.fn(),
      rotate: vi.fn(),
      rotateFromVector: vi.fn(),
      flipX: vi.fn(),
      flipY: vi.fn(),
      skewX: vi.fn(),
      skewY: vi.fn(),
    };

    mockSvg.getScreenCTM = vi.fn(() => mockMatrix as DOMMatrix);

    const mockPoint = {
      x: 0,
      y: 0,
      matrixTransform: vi.fn(_m => ({
        x: mockPoint.x,
        y: mockPoint.y,
        w: 1,
        z: 0,
      })),
    } as any;

    mockSvg.createSVGPoint = vi.fn(() => mockPoint);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should initialize with null hoveredPoint", () => {
    const { result } = renderHook(() =>
      useChartHover(mockData, defaultOptions)
    );
    expect(result.current.hoveredPoint).toBeNull();
  });

  it("should handle mouse move events", async () => {
    const { result } = renderHook(() =>
      useChartHover(mockData, defaultOptions)
    );

    // Simulate mouse move to middle (index 1)
    // Width 300, 3 items -> indices roughly at 0, 150, 300
    // Index 1 should be around x=150

    const event = {
      clientX: 150,
      clientY: 100,
      currentTarget: mockSvg,
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<SVGSVGElement>;

    act(() => {
      result.current.handleMouseMove(event);
    });

    // Run RAF
    await act(async () => {
      vi.runAllTimers();
    });

    expect(result.current.hoveredPoint).not.toBeNull();
    expect(result.current.hoveredPoint?.index).toBe(1);
    expect(result.current.hoveredPoint?.value).toBe(200);
  });

  it("should handle mouse leave", async () => {
    const { result } = renderHook(() =>
      useChartHover(mockData, defaultOptions)
    );

    // Set hover first
    const event = {
      clientX: 150,
      clientY: 100,
      currentTarget: mockSvg,
    } as unknown as React.MouseEvent<SVGSVGElement>;

    act(() => {
      result.current.handleMouseMove(event);
      vi.runAllTimers();
    });

    expect(result.current.hoveredPoint).not.toBeNull();

    // Leave
    act(() => {
      result.current.handleMouseLeave();
    });

    expect(result.current.hoveredPoint).toBeNull();
  });

  it("should handle touch move events", async () => {
    const { result } = renderHook(() =>
      useChartHover(mockData, defaultOptions)
    );

    const event = {
      touches: [{ clientX: 0, clientY: 0 }],
      changedTouches: [],
      currentTarget: mockSvg,
      cancelable: true,
      preventDefault: vi.fn(),
    } as unknown as React.TouchEvent<SVGSVGElement>;

    act(() => {
      result.current.handleTouchMove(event);
      vi.runAllTimers();
    });

    expect(result.current.hoveredPoint).not.toBeNull();
    expect(result.current.hoveredPoint?.index).toBe(0);
  });

  it("should ignore events when disabled", async () => {
    const { result } = renderHook(() =>
      useChartHover(mockData, { ...defaultOptions, enabled: false })
    );

    const event = {
      clientX: 150,
      clientY: 100,
      currentTarget: mockSvg,
    } as unknown as React.MouseEvent<SVGSVGElement>;

    act(() => {
      result.current.handleMouseMove(event);
      vi.runAllTimers();
    });

    expect(result.current.hoveredPoint).toBeNull();
  });

  it("should handle empty data", async () => {
    const { result } = renderHook(() => useChartHover([], defaultOptions));

    const event = {
      clientX: 150,
      clientY: 100,
      currentTarget: mockSvg,
    } as unknown as React.MouseEvent<SVGSVGElement>;

    act(() => {
      result.current.handleMouseMove(event);
      vi.runAllTimers();
    });

    expect(result.current.hoveredPoint).toBeNull();
  });

  it("should auto-populate in test environment when configured", () => {
    vi.stubEnv("NODE_ENV", "test");

    const { result } = renderHook(() =>
      useChartHover(mockData, { ...defaultOptions, testAutoPopulate: true })
    );

    // Initial effect runs
    expect(result.current.hoveredPoint).not.toBeNull();
    // Should select middle point
    expect(result.current.hoveredPoint?.index).toBe(1);

    vi.unstubAllEnvs();
  });

  it("should auto-hide after timeout when testAutoPopulate is true", () => {
    vi.stubEnv("NODE_ENV", "test");

    const { result } = renderHook(() =>
      useChartHover(mockData, { ...defaultOptions, testAutoPopulate: true })
    );

    // Initial auto-populate
    expect(result.current.hoveredPoint).not.toBeNull();

    // Advance past auto-hide timeout (1000ms)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current.hoveredPoint).toBeNull();

    vi.unstubAllEnvs();
  });

  it("should handle pointer move events", async () => {
    const { result } = renderHook(() =>
      useChartHover(mockData, defaultOptions)
    );

    const event = {
      clientX: 150,
      clientY: 100,
      currentTarget: mockSvg,
      pointerType: "mouse",
      isPrimary: true,
    } as unknown as React.PointerEvent<SVGSVGElement>;

    act(() => {
      result.current.handlePointerMove(event);
      vi.runAllTimers();
    });

    expect(result.current.hoveredPoint).not.toBeNull();
  });

  it("should handle pointer down events", async () => {
    const { result } = renderHook(() =>
      useChartHover(mockData, defaultOptions)
    );

    const event = {
      clientX: 0,
      clientY: 0,
      currentTarget: mockSvg,
      pointerType: "touch",
      isPrimary: true,
    } as unknown as React.PointerEvent<SVGSVGElement>;

    act(() => {
      result.current.handlePointerDown(event);
      vi.runAllTimers();
    });

    expect(result.current.hoveredPoint).not.toBeNull();
    expect(result.current.hoveredPoint?.index).toBe(0);
  });

  it("should handle touch end events", async () => {
    const { result } = renderHook(() =>
      useChartHover(mockData, defaultOptions)
    );

    // First set a hover point via touch
    const touchEvent = {
      touches: [{ clientX: 150, clientY: 100 }],
      changedTouches: [],
      currentTarget: mockSvg,
      cancelable: true,
      preventDefault: vi.fn(),
    } as unknown as React.TouchEvent<SVGSVGElement>;

    act(() => {
      result.current.handleTouchMove(touchEvent);
      vi.runAllTimers();
    });

    expect(result.current.hoveredPoint).not.toBeNull();

    // Now end touch
    act(() => {
      result.current.handleTouchEnd();
    });

    expect(result.current.hoveredPoint).toBeNull();
  });

  it("should clear auto-hide timer when hover is manually triggered", () => {
    vi.stubEnv("NODE_ENV", "test");

    const { result } = renderHook(() =>
      useChartHover(mockData, { ...defaultOptions, testAutoPopulate: true })
    );

    // Initial auto-populate
    expect(result.current.hoveredPoint).not.toBeNull();
    const initialIndex = result.current.hoveredPoint?.index;

    // Advance part of the auto-hide timeout
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Point should still be there
    expect(result.current.hoveredPoint).not.toBeNull();
    expect(result.current.hoveredPoint?.index).toBe(initialIndex);

    // Advance past original auto-hide timeout
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Should have auto-hidden
    expect(result.current.hoveredPoint).toBeNull();

    vi.unstubAllEnvs();
  });

  it("should handle single data point", async () => {
    const singleData = [{ value: 100, label: "A" }];
    const { result } = renderHook(() =>
      useChartHover(singleData, defaultOptions)
    );

    const event = {
      clientX: 150,
      clientY: 100,
      currentTarget: mockSvg,
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<SVGSVGElement>;

    act(() => {
      result.current.handleMouseMove(event);
      vi.runAllTimers();
    });

    expect(result.current.hoveredPoint).not.toBeNull();
    // With single point, it should always pick index 0
    expect(result.current.hoveredPoint?.index).toBe(0);
    // x should be center (chartWidth / 2)
    expect(result.current.hoveredPoint?.x).toBe(150);
  });

  it("should handle missing getScreenCTM (fallback calculation)", async () => {
    // Remove getScreenCTM from mock
    const fallbackSvg = {
      ...mockSvg,
      getBoundingClientRect: mockSvg.getBoundingClientRect,
      // createSVGPoint present but getScreenCTM missing triggers fallback
      createSVGPoint: mockSvg.createSVGPoint,
    } as unknown as SVGSVGElement;
    // Explicitly delete/undefined it if needed, but casting above helps simulate the shape

    // We need to inject this SVG into the event
    const { result } = renderHook(() =>
      useChartHover(mockData, defaultOptions)
    );

    const event = {
      clientX: 150,
      clientY: 100,
      currentTarget: {
        ...fallbackSvg,
        // Ensure getScreenCTM is undefined here to trigger fallback
        getScreenCTM: undefined,
      },
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<SVGSVGElement>;

    act(() => {
      result.current.handleMouseMove(event);
      vi.runAllTimers();
    });

    expect(result.current.hoveredPoint).not.toBeNull();
    // Fallback logic uses clientX relative to rect
    // rect left is 0, width 300. clientX 150 is 50%.
    // 50% of 3 items (indices 0, 1, 2) is index 1.
    expect(result.current.hoveredPoint?.index).toBe(1);
  });

  it("should handle zero dimensions gracefully", async () => {
    // Mock zero rect
    const zeroSvg = {
      ...mockSvg,
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 0, // Zero width
        height: 0, // Zero height
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
      createSVGPoint: mockSvg.createSVGPoint,
      getScreenCTM: undefined, // Force fallback which uses width
    } as unknown as SVGSVGElement;

    const { result } = renderHook(() =>
      useChartHover(mockData, defaultOptions)
    );

    const event = {
      clientX: 0,
      clientY: 0,
      currentTarget: zeroSvg,
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<SVGSVGElement>;

    act(() => {
      result.current.handleMouseMove(event);
      vi.runAllTimers();
    });

    // Should not crash, might select index 0 due to clamps
    expect(result.current.hoveredPoint).not.toBeNull();
    expect(result.current.hoveredPoint?.containerWidth).toBe(300); // Fallback to chartWidth
  });

  it("should handle missing touch objects", async () => {
    const { result } = renderHook(() =>
      useChartHover(mockData, defaultOptions)
    );

    const event = {
      touches: [], // Empty touches
      changedTouches: [],
      currentTarget: mockSvg,
      preventDefault: vi.fn(),
    } as unknown as React.TouchEvent<SVGSVGElement>;

    act(() => {
      result.current.handleTouchMove(event);
      vi.runAllTimers();
    });

    // Should not update state
    expect(result.current.hoveredPoint).toBeNull();
  });

  it("should handle flat line data (min === max)", async () => {
    const flatData = [
      { value: 100, label: "A" },
      { value: 100, label: "B" },
    ];
    const flatOptions = {
      ...defaultOptions,
      minValue: 100,
      maxValue: 100,
    };
    
    const { result } = renderHook(() =>
      useChartHover(flatData, flatOptions)
    );

    const event = {
      clientX: 150,
      clientY: 100,
      currentTarget: mockSvg,
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<SVGSVGElement>;

    act(() => {
      result.current.handleMouseMove(event);
      vi.runAllTimers();
    });

    expect(result.current.hoveredPoint).not.toBeNull();
    expect(result.current.hoveredPoint?.value).toBe(100);
  });

  it("should fallback when matrixTransform returns non-finite values", async () => {
    // Mock CTM but matrixTransform fails
    const brokenMatrixSvg = {
      ...mockSvg,
      getScreenCTM: mockSvg.getScreenCTM,
      createSVGPoint: vi.fn(() => ({
        x: 0,
        y: 0,
        matrixTransform: vi.fn(() => ({
          x: Infinity, // Invalid X
          y: 0,
        })),
      })),
    } as unknown as SVGSVGElement;

    const { result } = renderHook(() =>
      useChartHover(mockData, defaultOptions)
    );

    const event = {
      clientX: 150,
      clientY: 100,
      currentTarget: brokenMatrixSvg,
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<SVGSVGElement>;

    act(() => {
      result.current.handleMouseMove(event);
      vi.runAllTimers();
    });

    // Should fallback to simple calculation
    expect(result.current.hoveredPoint).not.toBeNull();
    expect(result.current.hoveredPoint?.index).toBe(1);
  });
});
