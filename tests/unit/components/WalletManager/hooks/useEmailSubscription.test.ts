import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEmailSubscription } from "@/components/WalletManager/hooks/useEmailSubscription";
import {
  unsubscribeUserEmail,
  updateUserEmailSubscription,
} from "@/components/WalletManager/services/WalletService";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/useToast";

// Mock dependencies
vi.mock("@/contexts/UserContext", () => ({
  useUser: vi.fn(),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/components/WalletManager/services/WalletService", () => ({
  updateUserEmailSubscription: vi.fn(),
  unsubscribeUserEmail: vi.fn(),
}));

// Mock useOperationStateHandlers
vi.mock("@/hooks/useOperationState", () => ({
  useOperationStateHandlers: () => ({
    setLoading: vi.fn(),
    setSuccess: vi.fn(),
    setError: vi.fn(),
  }),
}));

describe("useEmailSubscription", () => {
  const mockShowToast = vi.fn();
  const mockOnEmailSubscribed = vi.fn();

  const defaultParams = {
    viewingUserId: "user-123",
    realUserId: "user-123",
    isOpen: true,
    onEmailSubscribed: mockOnEmailSubscribed,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUser).mockReturnValue({
      userInfo: { email: "" },
    } as any);
    vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast } as any);
  });

  it("initializes with empty state", () => {
    const { result } = renderHook(() => useEmailSubscription(defaultParams));

    expect(result.current.email).toBe("");
    expect(result.current.subscribedEmail).toBeNull();
    expect(result.current.isEditingSubscription).toBe(false);
  });

  it("initializes email from user context when modal opens", () => {
    vi.mocked(useUser).mockReturnValue({
      userInfo: { email: "existing@example.com" },
    } as any);

    const { result } = renderHook(() => useEmailSubscription(defaultParams));

    expect(result.current.subscribedEmail).toBe("existing@example.com");
    expect(result.current.email).toBe("existing@example.com");
    expect(mockOnEmailSubscribed).toHaveBeenCalled();
  });

  it("handleSubscribe fails with invalid email", async () => {
    const { result } = renderHook(() => useEmailSubscription(defaultParams));

    act(() => {
      result.current.setEmail("invalid");
    });

    await act(async () => {
      await result.current.handleSubscribe();
    });

    // Should not call API with invalid email
    expect(updateUserEmailSubscription).not.toHaveBeenCalled();
  });

  it("handleSubscribe succeeds with valid email", async () => {
    vi.mocked(updateUserEmailSubscription).mockResolvedValue(undefined);

    const { result } = renderHook(() => useEmailSubscription(defaultParams));

    act(() => {
      result.current.setEmail("valid@example.com");
    });

    await act(async () => {
      await result.current.handleSubscribe();
    });

    expect(updateUserEmailSubscription).toHaveBeenCalledWith(
      "user-123",
      "valid@example.com"
    );
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success" })
    );
  });

  it("handleUnsubscribe calls API and clears email", async () => {
    vi.mocked(unsubscribeUserEmail).mockResolvedValue(undefined);

    const { result } = renderHook(() => useEmailSubscription(defaultParams));

    await act(async () => {
      await result.current.handleUnsubscribe();
    });

    expect(unsubscribeUserEmail).toHaveBeenCalledWith("user-123");
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "Unsubscribed" })
    );
  });

  it("startEditingSubscription sets editing state", () => {
    vi.mocked(useUser).mockReturnValue({
      userInfo: { email: "test@example.com" },
    } as any);

    const { result } = renderHook(() => useEmailSubscription(defaultParams));

    act(() => {
      result.current.startEditingSubscription();
    });

    expect(result.current.isEditingSubscription).toBe(true);
    expect(result.current.email).toBe("test@example.com");
  });

  it("cancelEditingSubscription resets state", () => {
    vi.mocked(useUser).mockReturnValue({
      userInfo: { email: "test@example.com" },
    } as any);

    const { result } = renderHook(() => useEmailSubscription(defaultParams));

    act(() => {
      result.current.startEditingSubscription();
      result.current.setEmail("changed@example.com");
    });

    act(() => {
      result.current.cancelEditingSubscription();
    });

    expect(result.current.isEditingSubscription).toBe(false);
    expect(result.current.email).toBe("test@example.com");
  });
});
