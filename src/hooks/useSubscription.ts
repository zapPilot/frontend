/**
 * Subscription management hook
 */

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "./useWallet"; // Assume this exists for wallet connection
import {
  SubscriptionStatus,
  SubscriptionTier,
  PaymentMethod,
  PaymentTransaction,
  SUBSCRIPTION_TIERS,
} from "../types/subscription";

interface UseSubscriptionReturn {
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  canAccessFeature: (feature: string) => boolean;
  upgrade: (tier: string, paymentMethod: PaymentMethod) => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  paymentHistory: PaymentTransaction[];
  currentTier: SubscriptionTier;
}

export function useSubscription(): UseSubscriptionReturn {
  const { address, isConnected } = useWallet();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>(
    []
  );

  // Get current tier based on subscription status
  const currentTier = subscriptionStatus?.isActive
    ? SUBSCRIPTION_TIERS.find(t => t.id === subscriptionStatus.tier) ||
      SUBSCRIPTION_TIERS[0]
    : SUBSCRIPTION_TIERS[0]; // Default to free tier

  // Check if user can access a specific feature
  const canAccessFeature = useCallback(
    (feature: string): boolean => {
      if (!subscriptionStatus || !subscriptionStatus.isActive) {
        // Free tier access
        const freeTier = SUBSCRIPTION_TIERS[0];
        return freeTier.features.includes(feature);
      }

      const tier = SUBSCRIPTION_TIERS.find(
        t => t.id === subscriptionStatus.tier
      );
      return tier ? tier.features.includes(feature) : false;
    },
    [subscriptionStatus]
  );

  // Check subscription status from backend/blockchain
  const checkSubscriptionStatus = useCallback(async () => {
    if (!address || !isConnected) {
      setSubscriptionStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would check:
      // 1. Local storage for cached status
      // 2. Backend API for subscription record
      // 3. Blockchain for recent payments

      // Mock implementation for POC
      const mockStatus: SubscriptionStatus = {
        isActive: false,
        tier: "free",
        expiresAt: null,
        walletAddress: address,
      };

      setSubscriptionStatus(mockStatus);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check subscription"
      );
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Handle subscription upgrade
  const upgrade = useCallback(
    async (tierId: string, paymentMethod: PaymentMethod): Promise<void> => {
      if (!address || !isConnected) {
        throw new Error("Wallet not connected");
      }

      const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId);
      if (!tier) {
        throw new Error("Invalid subscription tier");
      }

      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Calculate payment amount in crypto
        const cryptoPrice = await getCryptoPrice(paymentMethod.symbol);
        const paymentAmount = (tier.price / cryptoPrice.price).toFixed(
          paymentMethod.decimals
        );

        // Step 2: Initiate blockchain transaction
        const txHash = await sendPayment(paymentMethod, paymentAmount);

        // Step 3: Create payment record
        const payment: PaymentTransaction = {
          id: Date.now().toString(),
          walletAddress: address,
          amount: paymentAmount,
          token: paymentMethod.symbol,
          chainId: paymentMethod.chainId,
          txHash,
          status: "pending",
          tier: tierId,
          createdAt: new Date(),
        };

        setPaymentHistory(prev => [...prev, payment]);

        // Step 4: Monitor transaction and update subscription status
        await monitorTransaction(payment);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Payment failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected]
  );

  // Helper function to get crypto price (mock implementation)
  const getCryptoPrice = async (symbol: string) => {
    // In real implementation, would call CoinGecko or similar API
    const mockPrices: Record<string, number> = {
      USDC: 1.0,
      USDT: 1.0,
      ETH: 3500,
      BTC: 65000,
    };

    return {
      symbol,
      price: mockPrices[symbol] || 1,
      change24h: 0,
    };
  };

  // Helper function to send payment (mock implementation)
  const sendPayment = async (
    paymentMethod: PaymentMethod,
    amount: string
  ): Promise<string> => {
    // In real implementation, would use web3 library to send transaction
    // This would integrate with ThirdWeb SDK or similar

    // Mock transaction hash
    return `0x${Math.random().toString(16).substring(2)}`;
  };

  // Helper function to monitor transaction
  const monitorTransaction = async (payment: PaymentTransaction) => {
    // In real implementation, would:
    // 1. Monitor blockchain for transaction confirmation
    // 2. Update backend with payment confirmation
    // 3. Activate subscription

    // Mock confirmation after 3 seconds
    setTimeout(() => {
      setPaymentHistory(prev =>
        prev.map(p =>
          p.id === payment.id
            ? { ...p, status: "confirmed" as const, confirmedAt: new Date() }
            : p
        )
      );

      // Update subscription status
      setSubscriptionStatus({
        isActive: true,
        tier: payment.tier,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        walletAddress: payment.walletAddress,
        paymentTxHash: payment.txHash,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }, 3000);
  };

  // Load subscription status when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      checkSubscriptionStatus();
    }
  }, [isConnected, address, checkSubscriptionStatus]);

  return {
    subscriptionStatus,
    isLoading,
    error,
    canAccessFeature,
    upgrade,
    checkSubscriptionStatus,
    paymentHistory,
    currentTier,
  };
}

// Helper hook for wallet connection (simplified mock)
function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Mock wallet connection
  useEffect(() => {
    // In real implementation, would integrate with ThirdWeb SDK
    const mockAddress = "0x742f35Cc6B8B6D0E73cF426A70F8B1D7A8E8C8A9";
    setAddress(mockAddress);
    setIsConnected(true);
  }, []);

  return { address, isConnected };
}
