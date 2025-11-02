import { useCallback, useEffect, useState } from "react";

import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/useToast";
import { handleWalletError } from "@/services/userService";

import {
  unsubscribeUserEmail,
  updateUserEmailSubscription,
} from "../services/WalletService";
import type { OperationState } from "../types/wallet.types";
import { validateEmail } from "../utils/validation";
interface UseEmailSubscriptionParams {
  viewingUserId: string;
  realUserId: string;
  isOpen: boolean;
  onEmailSubscribed: (() => void) | undefined;
}

export const useEmailSubscription = ({
  realUserId,
  isOpen,
  onEmailSubscribed,
}: UseEmailSubscriptionParams) => {
  const { showToast } = useToast();
  const { userInfo } = useUser();

  // State
  const [email, setEmail] = useState("");
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);
  const [isEditingSubscription, setIsEditingSubscription] = useState(false);
  const [subscriptionOperation, setSubscriptionOperation] =
    useState<OperationState>({
      isLoading: false,
      error: null,
    });

  // Initialize subscription email from UserContext to avoid duplicate API calls
  useEffect(() => {
    if (!isOpen) return;
    const emailFromContext = userInfo?.email || null;
    if (emailFromContext) {
      setSubscribedEmail(emailFromContext);
      setEmail(emailFromContext);
      onEmailSubscribed?.();
    } else {
      setSubscribedEmail(null);
    }
  }, [isOpen, userInfo?.email, onEmailSubscribed]);

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
      await updateUserEmailSubscription(realUserId, email);

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

  // Unsubscribe (clear email)
  const handleUnsubscribe = useCallback(async () => {
    if (!realUserId) {
      setSubscriptionOperation({
        isLoading: false,
        error: "User not authenticated",
      });
      return;
    }

    setSubscriptionOperation({ isLoading: true, error: null });

    try {
      // Use dedicated endpoint to remove email
      await unsubscribeUserEmail(realUserId);

      setSubscriptionOperation({ isLoading: false, error: null });
      setSubscribedEmail(null);
      setEmail("");
      setIsEditingSubscription(false);

      showToast({
        type: "success",
        title: "Unsubscribed",
        message: "You will no longer receive weekly PnL reports.",
      });
    } catch (error) {
      const errorMessage = handleWalletError(error);
      setSubscriptionOperation({ isLoading: false, error: errorMessage });
    }
  }, [realUserId, showToast]);

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
    handleUnsubscribe,
    startEditingSubscription,
    cancelEditingSubscription,
  };
};
