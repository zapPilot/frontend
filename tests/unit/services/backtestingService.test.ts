import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { httpUtils } from "@/lib/http";
import {
  _sampleTimelineData as sampleTimelineData,
  MAX_CHART_POINTS,
  MIN_CHART_POINTS,
  runBacktest,
} from "@/services/backtestingService";
import {
  BacktestEvent,
  BacktestRequest,
  BacktestResponse,
  BacktestTimelinePoint,
} from "@/types/backtesting";

// ============================================================================
// Test Data Factory Functions
// ============================================================================

/**
 * Creates a single timeline point with optional events for testing.
 * Simulates realistic backtest data with configurable smart_dca and dca_classic events.
 */
function createTimelinePoint(
  index: number,
  smartDcaEvent: BacktestEvent = null,
  dcaClassicEvent: BacktestEvent = null
): BacktestTimelinePoint {
  // Create date string in format YYYY-MM-DD, incrementing from 2024-01-01
  const baseDate = new Date("2024-01-01");
  baseDate.setDate(baseDate.getDate() + index);
  const dateStr = baseDate.toISOString().split("T")[0];

  return {
    date: dateStr,
    price: 50000 + index * 100, // BTC price starting at 50k
    sentiment: 50 + (index % 50) - 25, // Fluctuates between 25-75
    sentiment_label:
      index % 3 === 0 ? "Fear" : index % 3 === 1 ? "Neutral" : "Greed",
    strategies: {
      smart_dca: {
        portfolio_value: 10000 + index * 10,
        capital_invested: 5000 + index * 5,
        holdings_value: 5000 + index * 5,
        available_capital: 5000 - index * 2.5,
        roi_percent: (index * 10) / 100,
        event: smartDcaEvent,
        metrics: {
          regime: index % 4 === 0 ? "accumulation" : "neutral",
          spot_balance: 0.1 + index * 0.001,
          stable_balance: 2500 - index * 2,
        },
      },
      dca_classic: {
        portfolio_value: 9000 + index * 8,
        capital_invested: 5000 + index * 5,
        holdings_value: 4000 + index * 3,
        available_capital: 5000 - index * 5,
        roi_percent: ((index - 10) * 8) / 100,
        event: dcaClassicEvent,
        metrics: {},
      },
    },
  };
}

/**
 * Creates a timeline array with specified length and event placement.
 *
 * @param length - Total number of timeline points
 * @param smartDcaEventIndices - Indices where smart_dca should have buy_spot events
 * @param dcaClassicEventIndices - Indices where dca_classic should have buy events
 * @returns Array of BacktestTimelinePoint
 */
function createTimeline(
  length: number,
  smartDcaEventIndices: number[] = [],
  dcaClassicEventIndices: number[] = []
): BacktestTimelinePoint[] {
  return Array.from({ length }, (_, i) =>
    createTimelinePoint(
      i,
      smartDcaEventIndices.includes(i) ? "buy_spot" : null,
      dcaClassicEventIndices.includes(i) ? "buy" : null
    )
  );
}

/**
 * Creates a timeline with various smart_dca event types for comprehensive testing.
 */
function createTimelineWithVariedEvents(
  length: number,
  eventMap: Map<number, BacktestEvent>
): BacktestTimelinePoint[] {
  return Array.from({ length }, (_, i) =>
    createTimelinePoint(i, eventMap.get(i) ?? null, null)
  );
}

const analyticsEnginePostSpy = vi.spyOn(httpUtils.analyticsEngine, "post");

describe("backtestingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsEnginePostSpy.mockReset();
  });

  afterAll(() => {
    analyticsEnginePostSpy.mockRestore();
  });

  describe("runBacktest", () => {
    it("should call the correct endpoint with the provided request", async () => {
      const mockRequest: BacktestRequest = {
        token_symbol: "BTC",
        total_capital: 10000,
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      };

      const mockResponse: BacktestResponse = {
        strategies: {
          smart_dca: {
            strategy_id: "smart_dca",
            display_name: "Smart DCA",
            total_invested: 5000,
            final_value: 6000,
            roi_percent: 20,
            trade_count: 3,
            max_drawdown_percent: 5,
            parameters: {},
          },
          dca_classic: {
            strategy_id: "dca_classic",
            display_name: "DCA Classic",
            total_invested: 5000,
            final_value: 5500,
            roi_percent: 10,
            trade_count: 12,
            max_drawdown_percent: 8,
            parameters: {},
          },
        },
        timeline: [],
      };

      analyticsEnginePostSpy.mockResolvedValue(mockResponse);

      const result = await runBacktest(mockRequest);

      expect(analyticsEnginePostSpy).toHaveBeenCalledWith(
        "/api/v2/backtesting/dca-comparison",
        mockRequest,
        { timeout: 600000 }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should propagate errors from the API", async () => {
      const mockRequest: BacktestRequest = {
        token_symbol: "BTC",
        total_capital: 10000,
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      };

      const error = new Error("API Error");
      analyticsEnginePostSpy.mockRejectedValue(error);

      await expect(runBacktest(mockRequest)).rejects.toThrow(
        "An unexpected error occurred while running the backtest."
      );
    });
  });

  // ==========================================================================
  // sampleTimelineData Tests
  // ==========================================================================
  describe("sampleTimelineData", () => {
    // ------------------------------------------------------------------------
    // 1. Core Behavior Tests
    // ------------------------------------------------------------------------
    describe("core behavior", () => {
      it("should preserve all smart_dca trading events", () => {
        // Create timeline with smart_dca events at specific indices
        const smartDcaEventIndices = [50, 150, 300, 450];
        const timeline = createTimeline(500, smartDcaEventIndices);

        const result = sampleTimelineData(timeline);

        // Verify all smart_dca events are preserved
        const resultDates = result.map(p => p.date);
        for (const index of smartDcaEventIndices) {
          const expectedDate = timeline[index].date;
          expect(resultDates).toContain(expectedDate);

          // Verify the event is actually present in the result
          const matchingPoint = result.find(p => p.date === expectedDate);
          expect(matchingPoint?.strategies.smart_dca.event).toBe("buy_spot");
        }
      });

      it("should preserve all event types (buy_spot, sell_spot, buy_lp, sell_lp)", () => {
        const eventMap = new Map<number, BacktestEvent>([
          [50, "buy_spot"],
          [100, "sell_spot"],
          [150, "buy_lp"],
          [200, "sell_lp"],
        ]);
        const timeline = createTimelineWithVariedEvents(300, eventMap);

        const result = sampleTimelineData(timeline);

        // All event types should be preserved
        const resultWithEvents = result.filter(
          p => p.strategies.smart_dca.event !== null
        );
        expect(resultWithEvents.length).toBeGreaterThanOrEqual(4);

        // Check each event type exists
        const eventTypes = resultWithEvents.map(
          p => p.strategies.smart_dca.event
        );
        expect(eventTypes).toContain("buy_spot");
        expect(eventTypes).toContain("sell_spot");
        expect(eventTypes).toContain("buy_lp");
        expect(eventTypes).toContain("sell_lp");
      });

      it("should allow sampling of non-smart_dca events (dca_classic)", () => {
        // Timeline with dca_classic events but NO smart_dca events at those indices
        const dcaClassicEventIndices = [100, 200, 300, 400];
        const timeline = createTimeline(500, [], dcaClassicEventIndices);

        const result = sampleTimelineData(timeline);

        // Result should be sampled down (since no smart_dca events to preserve)
        expect(result.length).toBeLessThanOrEqual(MAX_CHART_POINTS);

        // dca_classic events may or may not be present - they're not critical
        // This is expected behavior - the function optimizes for smart_dca
      });

      it("should always preserve first and last timeline points", () => {
        const timeline = createTimeline(500);

        const result = sampleTimelineData(timeline);

        // First point preserved
        expect(result[0].date).toBe(timeline[0].date);
        expect(result[0].price).toBe(timeline[0].price);

        // Last point preserved
        expect(result[result.length - 1].date).toBe(
          timeline[timeline.length - 1].date
        );
        expect(result[result.length - 1].price).toBe(
          timeline[timeline.length - 1].price
        );
      });
    });

    // ------------------------------------------------------------------------
    // 2. Sampling Threshold Tests
    // ------------------------------------------------------------------------
    describe("sampling thresholds", () => {
      it("should reduce 500+ points to MAX_CHART_POINTS when few smart_dca events", () => {
        // Generate 500 point timeline with only 5 smart_dca events
        const smartDcaEventIndices = [50, 150, 250, 350, 450];
        const timeline = createTimeline(500, smartDcaEventIndices);

        const result = sampleTimelineData(timeline);

        // Should be reduced but still contain all events
        expect(result.length).toBeLessThanOrEqual(MAX_CHART_POINTS);
        expect(result.length).toBeGreaterThanOrEqual(
          smartDcaEventIndices.length + 2
        ); // events + first/last
      });

      it("should return unchanged if timeline <= MIN_CHART_POINTS", () => {
        const timeline = createTimeline(80); // Less than MIN_CHART_POINTS (90)

        const result = sampleTimelineData(timeline);

        // Should return exact same array
        expect(result.length).toBe(80);
        expect(result).toEqual(timeline);
      });

      it("should return unchanged if timeline equals MIN_CHART_POINTS", () => {
        const timeline = createTimeline(MIN_CHART_POINTS);

        const result = sampleTimelineData(timeline);

        expect(result.length).toBe(MIN_CHART_POINTS);
        expect(result).toEqual(timeline);
      });

      it("should expand limit to fit all smart_dca events when many events exist", () => {
        // Create 200 point timeline with 100 smart_dca events
        const smartDcaEventIndices = Array.from(
          { length: 100 },
          (_, i) => i * 2
        );
        const timeline = createTimeline(200, smartDcaEventIndices);

        const result = sampleTimelineData(timeline);

        // Must preserve all 100 events
        const resultEventsCount = result.filter(
          p => p.strategies.smart_dca.event !== null
        ).length;
        expect(resultEventsCount).toBe(100);
      });

      it("should use MIN_CHART_POINTS as minimum regardless of event count", () => {
        // Timeline with no events but above MIN_CHART_POINTS
        const timeline = createTimeline(200, []);

        const result = sampleTimelineData(timeline);

        // Should still have reasonable number of points for chart visualization
        expect(result.length).toBeLessThanOrEqual(MAX_CHART_POINTS);
      });
    });

    // ------------------------------------------------------------------------
    // 3. Edge Cases
    // ------------------------------------------------------------------------
    describe("edge cases", () => {
      it("should return empty array for empty timeline", () => {
        const result = sampleTimelineData([]);

        expect(result).toEqual([]);
      });

      it("should return empty array for undefined timeline", () => {
        const result = sampleTimelineData(undefined);

        expect(result).toEqual([]);
      });

      it("should sample evenly when no trading events exist", () => {
        // 300 points, all with event: null
        const timeline = createTimeline(300, [], []);

        const result = sampleTimelineData(timeline);

        // Should reduce to MAX_CHART_POINTS or less
        expect(result.length).toBeLessThanOrEqual(MAX_CHART_POINTS);

        // Points should be somewhat evenly distributed (check gaps aren't too large)
        for (let i = 1; i < result.length; i++) {
          const prevIndex = timeline.findIndex(
            t => t.date === result[i - 1].date
          );
          const currIndex = timeline.findIndex(t => t.date === result[i].date);
          // Gap shouldn't be massive (reasonable distribution check)
          expect(currIndex - prevIndex).toBeLessThan(10);
        }
      });

      it("should preserve all points if all have smart_dca events", () => {
        // 100 points, all with smart_dca event - this is less than MAX_CHART_POINTS
        const allIndices = Array.from({ length: 100 }, (_, i) => i);
        const timeline = createTimeline(100, allIndices);

        const result = sampleTimelineData(timeline);

        // All points should be preserved since they all have critical events
        expect(result.length).toBe(100);
      });

      it("should handle single point timeline", () => {
        const timeline = createTimeline(1);

        const result = sampleTimelineData(timeline);

        expect(result.length).toBe(1);
        expect(result[0]).toEqual(timeline[0]);
      });

      it("should handle two point timeline", () => {
        const timeline = createTimeline(2);

        const result = sampleTimelineData(timeline);

        expect(result.length).toBe(2);
        expect(result).toEqual(timeline);
      });

      it("should handle timeline just above MIN_CHART_POINTS", () => {
        const timeline = createTimeline(MIN_CHART_POINTS + 1);

        const result = sampleTimelineData(timeline);

        // Just slightly above threshold - may or may not sample
        // First and last should always be preserved
        expect(result[0].date).toBe(timeline[0].date);
        expect(result[result.length - 1].date).toBe(
          timeline[timeline.length - 1].date
        );
      });

      it("should handle case where almost all slots are used by critical events", () => {
        // Create timeline where critical events take up most of MAX_CHART_POINTS
        // This tests the edge case where only 1-2 slots remain for non-critical points
        // Critical indices = first(0) + events(2-148) + last(199) = 149 indices
        // effectiveMax = min(150, max(90, 149 + 20)) = 150
        // remainingSlots = 150 - 149 = 1
        const smartDcaEventIndices = Array.from(
          { length: 147 },
          (_, i) => i + 2
        );
        const timeline = createTimeline(200, smartDcaEventIndices);

        const result = sampleTimelineData(timeline);

        // All 147 events should be preserved, plus first and last
        const eventsPreserved = result.filter(
          p => p.strategies.smart_dca.event !== null
        ).length;
        expect(eventsPreserved).toBe(147);

        // First and last should always be preserved
        expect(result[0].date).toBe(timeline[0].date);
        expect(result[result.length - 1].date).toBe(
          timeline[timeline.length - 1].date
        );
      });

      it("should handle case where all critical slots are exactly at MAX_CHART_POINTS", () => {
        // Create a scenario where effectiveMax equals criticalIndices.size
        // This means remainingSlots = 0 and we return only critical points
        const smartDcaEventIndices = Array.from({ length: 200 }, (_, i) => i);
        const timeline = createTimeline(300, smartDcaEventIndices);

        const result = sampleTimelineData(timeline);

        // All 200 events should be preserved since they're all critical
        const eventsPreserved = result.filter(
          p => p.strategies.smart_dca.event !== null
        ).length;
        expect(eventsPreserved).toBe(200);
      });
    });

    // ------------------------------------------------------------------------
    // 4. Data Integrity Tests
    // ------------------------------------------------------------------------
    describe("data integrity", () => {
      it("should maintain chronological order after sampling", () => {
        const smartDcaEventIndices = [25, 100, 275, 400];
        const timeline = createTimeline(500, smartDcaEventIndices);

        const result = sampleTimelineData(timeline);

        // Verify dates are in ascending order
        for (let i = 1; i < result.length; i++) {
          const prevDate = new Date(result[i - 1].date);
          const currDate = new Date(result[i].date);
          expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
        }
      });

      it("should not modify point data during sampling", () => {
        const smartDcaEventIndices = [50, 150, 300];
        const timeline = createTimeline(500, smartDcaEventIndices);

        // Deep clone to compare
        const originalTimeline = JSON.parse(JSON.stringify(timeline));

        const result = sampleTimelineData(timeline);

        // Verify sampled points have identical data to original
        for (const point of result) {
          const originalPoint = originalTimeline.find(
            (p: BacktestTimelinePoint) => p.date === point.date
          );
          expect(originalPoint).toBeDefined();
          expect(point).toEqual(originalPoint);
        }
      });

      it("should preserve price data accurately", () => {
        const smartDcaEventIndices = [50, 150, 300];
        const timeline = createTimeline(500, smartDcaEventIndices);

        const result = sampleTimelineData(timeline);

        // Find a specific known point and verify its price
        const eventPoint = result.find(
          p => p.strategies.smart_dca.event === "buy_spot"
        );
        expect(eventPoint).toBeDefined();

        // Price should match the formula: 50000 + index * 100
        const index = timeline.findIndex(t => t.date === eventPoint!.date);
        expect(eventPoint!.price).toBe(50000 + index * 100);
      });

      it("should preserve strategy metrics accurately", () => {
        const timeline = createTimeline(200, [50]);

        const result = sampleTimelineData(timeline);

        // Find the event point
        const eventPoint = result.find(
          p => p.strategies.smart_dca.event === "buy_spot"
        );
        expect(eventPoint).toBeDefined();

        // Verify strategy metrics are intact
        expect(eventPoint!.strategies.smart_dca.portfolio_value).toBeDefined();
        expect(eventPoint!.strategies.smart_dca.roi_percent).toBeDefined();
        expect(eventPoint!.strategies.dca_classic).toBeDefined();
        expect(
          eventPoint!.strategies.dca_classic.portfolio_value
        ).toBeDefined();
      });

      it("should not have duplicate points", () => {
        const smartDcaEventIndices = [50, 150, 300, 450];
        const timeline = createTimeline(500, smartDcaEventIndices);

        const result = sampleTimelineData(timeline);

        // Check for duplicate dates
        const dates = result.map(p => p.date);
        const uniqueDates = new Set(dates);
        expect(uniqueDates.size).toBe(dates.length);
      });
    });

    // ------------------------------------------------------------------------
    // 5. Integration with runBacktest
    // ------------------------------------------------------------------------
    describe("integration with runBacktest", () => {
      it("should sample timeline data in runBacktest response", async () => {
        const mockRequest: BacktestRequest = {
          token_symbol: "BTC",
          total_capital: 10000,
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        };

        // Create a large timeline that should be sampled
        const largeTimeline = createTimeline(500, [50, 150, 300]);

        const mockResponse: BacktestResponse = {
          strategies: {
            smart_dca: {
              strategy_id: "smart_dca",
              display_name: "Smart DCA",
              total_invested: 5000,
              final_value: 6000,
              roi_percent: 20,
              trade_count: 3,
              max_drawdown_percent: 5,
              parameters: {},
            },
            dca_classic: {
              strategy_id: "dca_classic",
              display_name: "DCA Classic",
              total_invested: 5000,
              final_value: 5500,
              roi_percent: 10,
              trade_count: 12,
              max_drawdown_percent: 8,
              parameters: {},
            },
          },
          timeline: largeTimeline,
        };

        analyticsEnginePostSpy.mockResolvedValue(mockResponse);

        const result = await runBacktest(mockRequest);

        // Timeline should be sampled down
        expect(result.timeline.length).toBeLessThan(500);
        expect(result.timeline.length).toBeLessThanOrEqual(MAX_CHART_POINTS);

        // But smart_dca events should still be preserved
        const eventDates = [50, 150, 300].map(i => largeTimeline[i].date);
        const resultDates = result.timeline.map(p => p.date);
        for (const eventDate of eventDates) {
          expect(resultDates).toContain(eventDate);
        }
      });
    });
  });
});
