/**
 * LogViewer - Unit Tests
 *
 * Tests the LogViewer component rendering and functionality.
 * Note: The LogViewer component only renders in development mode or when
 * NEXT_PUBLIC_ENABLE_DEBUG_LOGGING is set.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Import after mocking
import { LogViewer } from "@/components/debug/LogViewer";
import { logger, LogLevel } from "@/utils/logger";

// Mock the logger module before importing the component
vi.mock("@/utils/logger", () => ({
  LogLevel: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  },
  logger: {
    getLogs: vi.fn(() => []),
    clearLogs: vi.fn(),
  },
}));

describe("LogViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Force development mode to render the component
    vi.stubEnv("NODE_ENV", "development");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("should render toggle button with log count", () => {
    vi.mocked(logger.getLogs).mockReturnValue([]);
    render(<LogViewer />);

    expect(screen.getByText(/🐛 Logs/)).toBeInTheDocument();
  });

  it("should toggle visibility when clicking the button", async () => {
    vi.mocked(logger.getLogs).mockReturnValue([]);
    render(<LogViewer />);

    // Initially the log panel should not be visible
    expect(screen.queryByText("Development Logs")).not.toBeInTheDocument();

    // Click to show
    fireEvent.click(screen.getByText(/🐛 Logs/));
    expect(screen.getByText("Development Logs")).toBeInTheDocument();

    // Click to hide
    fireEvent.click(screen.getByText(/🐛 Logs/));
    expect(screen.queryByText("Development Logs")).not.toBeInTheDocument();
  });

  it("should render logs from logger service", async () => {
    const mockLogs = [
      {
        timestamp: Date.now(),
        level: LogLevel.INFO,
        message: "App started",
        context: "main",
      },
      {
        timestamp: Date.now(),
        level: LogLevel.WARN,
        message: "Connection slow",
      },
      {
        timestamp: Date.now(),
        level: LogLevel.ERROR,
        message: "Request failed",
      },
    ];
    vi.mocked(logger.getLogs).mockReturnValue(mockLogs);

    const { rerender } = render(<LogViewer />);

    // Click to show panel
    fireEvent.click(screen.getByText(/🐛 Logs/));

    // Advance timer by 1 second to trigger the interval callback
    await vi.advanceTimersByTimeAsync(1000);

    // Re-render to pick up state change
    rerender(<LogViewer />);

    expect(screen.getByText("App started")).toBeInTheDocument();
  });

  it("should clear logs when clicking Clear button", async () => {
    vi.mocked(logger.getLogs).mockReturnValue([]);
    render(<LogViewer />);

    // Open the panel
    fireEvent.click(screen.getByText(/🐛 Logs/));

    // Click clear button
    fireEvent.click(screen.getByText("Clear"));

    expect(logger.clearLogs).toHaveBeenCalled();
  });

  it("should have filter level dropdown", () => {
    vi.mocked(logger.getLogs).mockReturnValue([]);
    render(<LogViewer />);

    // Open the panel
    fireEvent.click(screen.getByText(/🐛 Logs/));

    // Should have filter options
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("DEBUG+")).toBeInTheDocument();
  });

  it("should render with debug logging flag enabled in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEBUG_LOGGING", "true");
    vi.mocked(logger.getLogs).mockReturnValue([]);

    render(<LogViewer />);
    expect(screen.getByText(/🐛 Logs/)).toBeInTheDocument();
  });
});
