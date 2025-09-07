"use client";

import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from "@/utils/localStorage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface OnboardingState {
  isFirstVisit: boolean;
  completedSteps: string[];
  currentTour?: string;
  showHints: boolean;
  hasConnectedWallet: boolean;
  hasSwitchedChain: boolean;
  hasNavigated: boolean;
  hasEmailSubscription: boolean;
}

interface OnboardingContextType {
  state: OnboardingState;
  markStepCompleted: (step: string) => void;
  startTour: (tourId: string) => void;
  endTour: () => void;
  toggleHints: () => void;
  resetOnboarding: () => void;
  shouldShowHint: (hintId: string) => boolean;
  markEmailSubscribed: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

const ONBOARDING_STORAGE_KEY = "zap_pilot_onboarding";

const defaultState: OnboardingState = {
  isFirstVisit: true,
  completedSteps: [],
  showHints: true,
  hasConnectedWallet: false,
  hasSwitchedChain: false,
  hasNavigated: false,
  hasEmailSubscription: false,
};

export const OnboardingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<OnboardingState>(defaultState);

  // Load onboarding state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = getStorageItem(ONBOARDING_STORAGE_KEY, null);
      if (savedState) {
        setState(prevState => ({
          ...prevState,
          ...(savedState as OnboardingState),
        }));
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      setStorageItem(ONBOARDING_STORAGE_KEY, state);
    }
  }, [state]);

  const markStepCompleted = useCallback((step: string) => {
    setState(prev => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, step])],
      isFirstVisit: false,
      // Update specific flags based on step
      ...(step === "wallet-connected" && { hasConnectedWallet: true }),
      ...(step === "chain-switched" && { hasSwitchedChain: true }),
      ...(step === "navigation-used" && { hasNavigated: true }),
    }));
  }, []);

  const startTour = useCallback((tourId: string) => {
    setState(prev => ({ ...prev, currentTour: tourId }));
  }, []);

  const endTour = useCallback(() => {
    setState(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { currentTour, ...rest } = prev;
      return rest;
    });
  }, []);

  const toggleHints = useCallback(() => {
    setState(prev => ({ ...prev, showHints: !prev.showHints }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(defaultState);
    if (typeof window !== "undefined") {
      removeStorageItem(ONBOARDING_STORAGE_KEY);
    }
  }, []);
  const markEmailSubscribed = useCallback(() => {
    setState(prev => ({ ...prev, hasEmailSubscription: true }));
  }, []);

  const shouldShowHint = useCallback(
    (hintId: string) => {
      if (!state.showHints) return false;
      if (state.completedSteps.includes(hintId)) return false;

      // Logic for when to show specific hints
      switch (hintId) {
        case "welcome-tour":
          return state.isFirstVisit;

        case "wallet-connect-hint":
          return !state.hasConnectedWallet;

        case "chain-switch-hint":
          return state.hasConnectedWallet && !state.hasSwitchedChain;

        case "navigation-hint":
          return !state.hasNavigated;

        case "mobile-navigation-hint":
          return (
            !state.hasNavigated &&
            typeof window !== "undefined" &&
            window.innerWidth < 1024
          );

        case "email-subscription-reminder":
          return state.hasConnectedWallet && !state.hasEmailSubscription;

        default:
          return true;
      }
    },
    [state]
  );

  const value: OnboardingContextType = {
    state,
    markStepCompleted,
    startTour,
    endTour,
    toggleHints,
    resetOnboarding,
    shouldShowHint,
    markEmailSubscribed,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
