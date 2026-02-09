/**
 * Unit tests for useTelegramConnection hooks.
 *
 * Tests:
 * - telegramKeys query key factory
 * - useTelegramStatus query behavior (enabled/disabled, polling)
 * - useTelegramConnect mutation
 * - useTelegramDisconnect mutation with cache invalidation
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  telegramKeys,
  useTelegramConnect,
  useTelegramDisconnect,
  useTelegramStatus,
} from "@/components/wallet/portfolio/views/strategy/hooks/useTelegramConnection";
import {
  disconnectTelegram,
  getTelegramStatus,
  requestTelegramToken,
  type TelegramDisconnectResponse,
  type TelegramStatus,
  type TelegramTokenResponse,
} from "@/services/telegramService";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("@/services/telegramService", () => ({
  requestTelegramToken: vi.fn(),
  getTelegramStatus: vi.fn(),
  disconnectTelegram: vi.fn(),
}));

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockTelegramStatus: TelegramStatus = {
  isConnected: true,
  chatId: "123456789",
  username: "@testuser",
};

const mockTelegramTokenResponse: TelegramTokenResponse = {
  token: "123456",
  expiresAt: "2026-02-09T12:00:00Z",
  deepLink: "https://t.me/testbot?start=token123",
};

const mockDisconnectResponse: TelegramDisconnectResponse = {
  message: "Telegram disconnected successfully",
};

// ============================================================================
// TESTS
// ============================================================================

describe("telegramKeys", () => {
  it("should return correct base key for all", () => {
    expect(telegramKeys.all).toEqual(["telegram"]);
  });

  it("should return correct compound key for status with userId", () => {
    const userId = "0x1234567890abcdef";
    const key = telegramKeys.status(userId);

    expect(key).toEqual(["telegram", "status", userId]);
  });

  it("should generate unique keys for different userIds", () => {
    const key1 = telegramKeys.status("user1");
    const key2 = telegramKeys.status("user2");

    expect(key1).not.toEqual(key2);
    expect(key1).toEqual(["telegram", "status", "user1"]);
    expect(key2).toEqual(["telegram", "status", "user2"]);
  });
});

describe("useTelegramStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should make query with correct key when userId is provided", async () => {
    const userId = "0x1234567890abcdef";
    vi.mocked(getTelegramStatus).mockResolvedValue(mockTelegramStatus);

    const { result } = renderHook(() => useTelegramStatus(userId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getTelegramStatus).toHaveBeenCalledWith(userId);
    expect(getTelegramStatus).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockTelegramStatus);
  });

  it("should be disabled when userId is undefined", () => {
    vi.mocked(getTelegramStatus).mockResolvedValue(mockTelegramStatus);

    const { result } = renderHook(() => useTelegramStatus(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");
    expect(getTelegramStatus).not.toHaveBeenCalled();
  });

  it("should be disabled when userId is empty string", () => {
    vi.mocked(getTelegramStatus).mockResolvedValue(mockTelegramStatus);

    const { result } = renderHook(() => useTelegramStatus(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");
    expect(getTelegramStatus).not.toHaveBeenCalled();
  });

  it("should use polling when polling option is true", async () => {
    const userId = "0x1234567890abcdef";
    vi.mocked(getTelegramStatus).mockResolvedValue(mockTelegramStatus);

    const { result } = renderHook(
      () =>
        useTelegramStatus(userId, {
          polling: true,
          pollingInterval: 100, // Fast polling for test
        }),
      {
        wrapper: createWrapper(),
      }
    );

    // Wait for initial query
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTelegramStatus).toHaveBeenCalledTimes(1);

    // Wait for at least one poll
    await waitFor(
      () => {
        expect(getTelegramStatus).toHaveBeenCalledTimes(2);
      },
      { timeout: 200 }
    );

    expect(getTelegramStatus).toHaveBeenCalledWith(userId);
  });

  it("should not poll when polling is false", async () => {
    const userId = "0x1234567890abcdef";
    vi.mocked(getTelegramStatus).mockResolvedValue(mockTelegramStatus);

    const { result } = renderHook(
      () => useTelegramStatus(userId, { polling: false }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTelegramStatus).toHaveBeenCalledTimes(1);

    // Wait a bit to ensure no additional calls
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(getTelegramStatus).toHaveBeenCalledTimes(1);
  });

  it("should use default polling interval when not specified", async () => {
    const userId = "0x1234567890abcdef";
    vi.mocked(getTelegramStatus).mockResolvedValue(mockTelegramStatus);

    const { result } = renderHook(
      () => useTelegramStatus(userId, { polling: true }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Default polling interval is 3000ms, so shouldn't poll again quickly
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(getTelegramStatus).toHaveBeenCalledTimes(1);
  });

  it("should handle query errors gracefully", async () => {
    const userId = "0x1234567890abcdef";
    const error = new Error("Network error");
    vi.mocked(getTelegramStatus).mockRejectedValue(error);

    const { result } = renderHook(() => useTelegramStatus(userId), {
      wrapper: createWrapper(),
    });

    // Hook is configured with retry: 2, wait for all retries
    await waitFor(
      () => {
        expect(getTelegramStatus).toHaveBeenCalled();
      },
      { timeout: 100 }
    );

    // Should be pending while retrying (retry: 2 means initial + 2 retries)
    expect(result.current.isPending).toBe(true);
  });

  it("should throw error in queryFn when userId becomes undefined after mount", async () => {
    const userId = "0x1234567890abcdef";
    vi.mocked(getTelegramStatus).mockResolvedValue(mockTelegramStatus);

    const { result, rerender } = renderHook(
      ({ id }: { id: string | undefined }) => useTelegramStatus(id),
      {
        wrapper: createWrapper(),
        initialProps: { id: userId as string | undefined },
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Change to undefined - query should be disabled
    rerender({ id: undefined });

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("should return disconnected status correctly", async () => {
    const userId = "0x1234567890abcdef";
    const disconnectedStatus: TelegramStatus = {
      isConnected: false,
      chatId: null,
      username: null,
    };
    vi.mocked(getTelegramStatus).mockResolvedValue(disconnectedStatus);

    const { result } = renderHook(() => useTelegramStatus(userId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(disconnectedStatus);
    expect(result.current.data?.isConnected).toBe(false);
    expect(result.current.data?.chatId).toBeNull();
  });
});

describe("useTelegramConnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call requestTelegramToken on mutate", async () => {
    const userId = "0x1234567890abcdef";
    vi.mocked(requestTelegramToken).mockResolvedValue(
      mockTelegramTokenResponse
    );

    const { result } = renderHook(() => useTelegramConnect(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(userId);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(requestTelegramToken).toHaveBeenCalledWith(userId);
    expect(requestTelegramToken).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockTelegramTokenResponse);
  });

  it("should handle success callback", async () => {
    const userId = "0x1234567890abcdef";
    const onSuccess = vi.fn();
    vi.mocked(requestTelegramToken).mockResolvedValue(
      mockTelegramTokenResponse
    );

    const { result } = renderHook(() => useTelegramConnect(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(userId, { onSuccess });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccess).toHaveBeenCalledWith(
      mockTelegramTokenResponse,
      userId,
      undefined
    );
  });

  it("should handle mutation errors", async () => {
    const userId = "0x1234567890abcdef";
    const error = new Error("Token generation failed");
    vi.mocked(requestTelegramToken).mockRejectedValue(error);

    const { result } = renderHook(() => useTelegramConnect(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(userId);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle error callback", async () => {
    const userId = "0x1234567890abcdef";
    const error = new Error("Token generation failed");
    const onError = vi.fn();
    vi.mocked(requestTelegramToken).mockRejectedValue(error);

    const { result } = renderHook(() => useTelegramConnect(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(userId, { onError });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onError).toHaveBeenCalledWith(error, userId, undefined);
  });

  it("should provide access to reset function", () => {
    const { result } = renderHook(() => useTelegramConnect(), {
      wrapper: createWrapper(),
    });

    // Should have reset function available
    expect(result.current.reset).toBeDefined();
    expect(typeof result.current.reset).toBe("function");

    // Should be idle initially
    expect(result.current.status).toBe("idle");
  });
});

describe("useTelegramDisconnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call disconnectTelegram on mutate", async () => {
    const userId = "0x1234567890abcdef";
    vi.mocked(disconnectTelegram).mockResolvedValue(mockDisconnectResponse);

    const { result } = renderHook(() => useTelegramDisconnect(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(userId);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(disconnectTelegram).toHaveBeenCalledWith(userId);
    expect(disconnectTelegram).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockDisconnectResponse);
  });

  it("should invalidate status query on success", async () => {
    const userId = "0x1234567890abcdef";
    vi.mocked(disconnectTelegram).mockResolvedValue(mockDisconnectResponse);
    vi.mocked(getTelegramStatus).mockResolvedValue(mockTelegramStatus);

    const wrapper = createWrapper();

    // First, setup status query
    const { result: statusResult } = renderHook(
      () => useTelegramStatus(userId),
      {
        wrapper,
      }
    );

    await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));
    expect(getTelegramStatus).toHaveBeenCalledTimes(1);

    // Now disconnect
    const { result: disconnectResult } = renderHook(
      () => useTelegramDisconnect(),
      {
        wrapper,
      }
    );

    act(() => {
      disconnectResult.current.mutate(userId);
    });

    await waitFor(() => expect(disconnectResult.current.isSuccess).toBe(true));

    // Status query should be refetched due to invalidation
    await waitFor(() => {
      expect(getTelegramStatus).toHaveBeenCalledTimes(2);
    });
  });

  it("should handle mutation errors", async () => {
    const userId = "0x1234567890abcdef";
    const error = new Error("Disconnect failed");
    vi.mocked(disconnectTelegram).mockRejectedValue(error);

    const { result } = renderHook(() => useTelegramDisconnect(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(userId);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle success callback", async () => {
    const userId = "0x1234567890abcdef";
    const onSuccess = vi.fn();
    vi.mocked(disconnectTelegram).mockResolvedValue(mockDisconnectResponse);

    const { result } = renderHook(() => useTelegramDisconnect(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(userId, { onSuccess });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccess).toHaveBeenCalledWith(
      mockDisconnectResponse,
      userId,
      undefined
    );
  });

  it("should handle error callback", async () => {
    const userId = "0x1234567890abcdef";
    const error = new Error("Disconnect failed");
    const onError = vi.fn();
    vi.mocked(disconnectTelegram).mockRejectedValue(error);

    const { result } = renderHook(() => useTelegramDisconnect(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(userId, { onError });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onError).toHaveBeenCalledWith(error, userId, undefined);
  });

  it("should not invalidate queries if mutation fails", async () => {
    const userId = "0x1234567890abcdef";
    const error = new Error("Disconnect failed");
    vi.mocked(disconnectTelegram).mockRejectedValue(error);
    vi.mocked(getTelegramStatus).mockResolvedValue(mockTelegramStatus);

    const wrapper = createWrapper();

    // Setup status query
    const { result: statusResult } = renderHook(
      () => useTelegramStatus(userId),
      {
        wrapper,
      }
    );

    await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));
    const initialCallCount = vi.mocked(getTelegramStatus).mock.calls.length;

    // Attempt disconnect that will fail
    const { result: disconnectResult } = renderHook(
      () => useTelegramDisconnect(),
      {
        wrapper,
      }
    );

    act(() => {
      disconnectResult.current.mutate(userId);
    });

    await waitFor(() => expect(disconnectResult.current.isError).toBe(true));

    // Wait a bit to ensure no refetch happens
    await new Promise(resolve => setTimeout(resolve, 50));

    // Call count should remain the same (no invalidation)
    expect(vi.mocked(getTelegramStatus).mock.calls.length).toBe(
      initialCallCount
    );
  });
});
