import { useCallback, useState } from "react";

interface UIState {
  showDetails: boolean;
  showTechnicalDetails: boolean;
}

interface UseUIStateReturn {
  // State values
  showDetails: boolean;
  showTechnicalDetails: boolean;

  // Actions
  toggleDetails: () => void;
  toggleTechnicalDetails: () => void;
  setShowDetails: (show: boolean) => void;
  setShowTechnicalDetails: (show: boolean) => void;
  reset: () => void;
}

const initialState: UIState = {
  showDetails: false,
  showTechnicalDetails: false,
};

export function useUIState(): UseUIStateReturn {
  const [state, setState] = useState<UIState>(initialState);

  const toggleDetails = useCallback(() => {
    setState(prev => ({ ...prev, showDetails: !prev.showDetails }));
  }, []);

  const toggleTechnicalDetails = useCallback(() => {
    setState(prev => ({
      ...prev,
      showTechnicalDetails: !prev.showTechnicalDetails,
    }));
  }, []);

  const setShowDetails = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showDetails: show }));
  }, []);

  const setShowTechnicalDetails = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showTechnicalDetails: show }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    // State values
    showDetails: state.showDetails,
    showTechnicalDetails: state.showTechnicalDetails,

    // Actions
    toggleDetails,
    toggleTechnicalDetails,
    setShowDetails,
    setShowTechnicalDetails,
    reset,
  };
}
