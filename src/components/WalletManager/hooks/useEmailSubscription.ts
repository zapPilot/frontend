import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import { handleWalletError } from "@/services/userService";
import { WalletService } from "../services/WalletService";
import { validateEmail } from "../utils/validation";
import type { OperationState } from "../types/wallet.types";

interface UseEmailSubscriptionParams {
  viewingUserId: string;
  realUserId: string;
  isOpen: boolean;
  onEmailSubscribed: (() => void) | undefined;
}

export const useEmailSubscription = ({
  viewingUserId,
  realUserId,
  isOpen,
  onEmailSubscribed,
}: UseEmailSubscriptionParams) => {
  const { showToast } = useToast();

  // State
  const [email, setEmail] = useState("");
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);
  const [isEditingSubscription, setIsEditingSubscription] = useState(false);
  const [subscriptionOperation, setSubscriptionOperation] =
    useState<OperationState>({
      isLoading: false,
      error: null,
    });

  // Load user profile to determine existing subscription email
  useEffect(() => {
    const loadProfile = async () => {
      if (!isOpen || !viewingUserId) return;

      try {
        const profile = await WalletService.loadUserProfile(viewingUserId);
        if (profile.email) {
          setSubscribedEmail(profile.email);
          setEmail(profile.email);
          // Notify parent component that user already has email subscription
          if (profile.hasSubscription) {
            onEmailSubscribed?.();
          }
        } else {
          setSubscribedEmail(null);
        }
      } catch {
        // Ignore profile fetch errors in this context
      }
    };

    loadProfile();
  }, [isOpen, viewingUserId, onEmailSubscribed]);

  // Handle email subscription
  const handleSubscribe = useCallback(async () => {
    if (!realUserId) {
      setSubscriptionOperation({
        isLoading: false,
        error: "User not authenticated",
      });
      return;
    }

    // Validate email
    const validation = validateEmail(email);
    if (!validation.isValid) {
      setSubscriptionOperation({
        isLoading: false,
        error: validation.error || "Invalid email address",
      });
      return;
    }

    setSubscriptionOperation({ isLoading: true, error: null });

    try {
      await WalletService.updateUserEmailSubscription(realUserId, email);

      setSubscriptionOperation({ isLoading: false, error: null });
      setSubscribedEmail(email);
      setIsEditingSubscription(false);

      // Notify parent component of successful subscription
      onEmailSubscribed?.();

      showToast({
        type: "success",
        title: "Subscription updated",
        message: `You'll receive weekly PnL reports at ${email}.`,
      });
    } catch (error) {
      const errorMessage = handleWalletError(error);
      setSubscriptionOperation({ isLoading: false, error: errorMessage });
    }
  }, [realUserId, email, onEmailSubscribed, showToast]);

  // Start editing subscription
  const startEditingSubscription = useCallback(() => {
    setIsEditingSubscription(true);
    if (subscribedEmail) {
      setEmail(subscribedEmail);
    }
  }, [subscribedEmail]);

  // Cancel editing subscription
  const cancelEditingSubscription = useCallback(() => {
    setIsEditingSubscription(false);
    if (subscribedEmail) {
      setEmail(subscribedEmail);
    }
    setSubscriptionOperation({ isLoading: false, error: null });
  }, [subscribedEmail]);

  return {
    // State
    email,
    subscribedEmail,
    isEditingSubscription,
    subscriptionOperation,

    // Actions
    setEmail,
    handleSubscribe,
    startEditingSubscription,
    cancelEditingSubscription,
  };
};
