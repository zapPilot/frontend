/**
 * Logger Unit Tests
 *
 * Tests for the centralized logging utility
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger, LogLevel, walletLogger } from "@/utils/logger";

describe("Logger", () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleDebugSpy = vi
      .spyOn(console, "debug")
      .mockImplementation((_msg: unknown) => undefined);
    consoleInfoSpy = vi
      .spyOn(console, "info")
      .mockImplementation((_msg: unknown) => undefined);
    consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation((_msg: unknown) => undefined);
    consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation((_msg: unknown) => undefined);

    // Clear logs before each test
    logger.clearLogs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("singleton instance", () => {
    it("should export a logger singleton", () => {
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
    });

    it("should export walletLogger context logger", () => {
      expect(walletLogger).toBeDefined();
      expect(typeof walletLogger.debug).toBe("function");
    });
  });

  describe("log methods", () => {
    it("should log debug messages when level allows", () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.setConsoleLogging(true);
      logger.debug("Debug message", { key: "value" });

      expect(consoleDebugSpy).toHaveBeenCalled();
      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].message).toBe("Debug message");
    });

    it("should log info messages", () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.setConsoleLogging(true);
      logger.info("Info message");

      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it("should log warn messages", () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.setConsoleLogging(true);
      logger.warn("Warn message");

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should log error messages with Error object", () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.setConsoleLogging(true);
      const err = new Error("Test error");
      logger.error("Error message", err, "TestContext");

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logs = logger.getLogs();
      const lastLog = logs[logs.length - 1];
      expect(lastLog.error).toBe(err);
    });

    it("should log error messages with non-Error data", () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.setConsoleLogging(true);
      logger.error("Error message", { code: 500 });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logs = logger.getLogs();
      const lastLog = logs[logs.length - 1];
      expect(lastLog.data).toEqual({ code: 500 });
    });
  });

  describe("log level filtering", () => {
    it("should not log when level is below threshold", () => {
      logger.setLevel(LogLevel.ERROR);
      logger.setConsoleLogging(true);
      const initialLogCount = logger.getLogs().length;

      logger.debug("Should not log");
      logger.info("Should not log");
      logger.warn("Should not log");

      expect(logger.getLogs().length).toBe(initialLogCount);
    });

    it("should log when level meets threshold", () => {
      logger.setLevel(LogLevel.WARN);
      logger.setConsoleLogging(true);
      const initialLogCount = logger.getLogs().length;

      logger.warn("Should log");
      logger.error("Should log");

      expect(logger.getLogs().length).toBe(initialLogCount + 2);
    });
  });

  describe("log entry storage", () => {
    it("should store log entries", () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.clearLogs();
      logger.debug("Test message", { data: "value" }, "Context");

      const logs = logger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe("Test message");
      expect(logs[0].data).toEqual({ data: "value" });
      expect(logs[0].context).toBe("Context");
      expect(logs[0].timestamp).toBeTruthy();
    });

    it("should clear logs", () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.debug("Test");
      logger.clearLogs();

      expect(logger.getLogs().length).toBe(0);
    });

    it("should return copy of logs array", () => {
      const logs1 = logger.getLogs();
      const logs2 = logger.getLogs();

      expect(logs1).not.toBe(logs2);
    });
  });

  describe("configuration", () => {
    it("should get current level", () => {
      logger.setLevel(LogLevel.WARN);
      expect(logger.getLevel()).toBe(LogLevel.WARN);
    });

    it("should get current config", () => {
      const config = logger.getConfig();

      expect(config).toHaveProperty("level");
      expect(config).toHaveProperty("enableConsole");
      expect(config).toHaveProperty("enableRemote");
      expect(config).toHaveProperty("maxLocalLogs");
    });

    it("should enable/disable console logging", () => {
      logger.setConsoleLogging(false);
      expect(logger.getConfig().enableConsole).toBe(false);

      logger.setConsoleLogging(true);
      expect(logger.getConfig().enableConsole).toBe(true);
    });

    it("should enable/disable remote logging with endpoint", () => {
      logger.setRemoteLogging(true, "https://api.example.com/logs");
      const config = logger.getConfig();

      expect(config.enableRemote).toBe(true);
      expect(config.remoteEndpoint).toBe("https://api.example.com/logs");
    });
  });

  describe("context logger", () => {
    it("should create context logger", () => {
      const contextLogger = logger.createContextLogger("TestModule");

      expect(contextLogger).toBeDefined();
      expect(typeof contextLogger.debug).toBe("function");
      expect(typeof contextLogger.info).toBe("function");
      expect(typeof contextLogger.warn).toBe("function");
      expect(typeof contextLogger.error).toBe("function");
    });

    it("should log with context", () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.setConsoleLogging(true);
      const contextLogger = logger.createContextLogger("TestModule");
      contextLogger.debug("Test message");

      const logs = logger.getLogs();
      const lastLog = logs[logs.length - 1];
      expect(lastLog.context).toBe("TestModule");
    });

    it("should log all levels through context logger", () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.setConsoleLogging(true);
      logger.clearLogs();
      const contextLogger = logger.createContextLogger("Ctx");

      contextLogger.debug("Debug", { d: 1 });
      contextLogger.info("Info", { i: 2 });
      contextLogger.warn("Warn", { w: 3 });
      contextLogger.error("Error", new Error("Test"));

      const logs = logger.getLogs();
      expect(logs.length).toBe(4);
      expect(logs.every(l => l.context === "Ctx")).toBe(true);
    });
  });

  describe("LogLevel enum", () => {
    it("should have correct ordering", () => {
      expect(LogLevel.DEBUG).toBeLessThan(LogLevel.INFO);
      expect(LogLevel.INFO).toBeLessThan(LogLevel.WARN);
      expect(LogLevel.WARN).toBeLessThan(LogLevel.ERROR);
    });
  });
});
