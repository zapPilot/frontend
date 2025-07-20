"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { ExcludedCategoriesContextType } from "./types";

const ExcludedCategoriesContext = createContext<
  ExcludedCategoriesContextType | undefined
>(undefined);

interface ExcludedCategoriesProviderProps {
  children: ReactNode;
  initialExcluded?: string[];
}

export const ExcludedCategoriesProvider: React.FC<
  ExcludedCategoriesProviderProps
> = ({ children, initialExcluded = [] }) => {
  const [excludedCategoryIds, setExcludedCategoryIds] =
    useState<string[]>(initialExcluded);

  const toggleCategoryExclusion = useCallback((categoryId: string) => {
    setExcludedCategoryIds(prevIds =>
      prevIds.includes(categoryId)
        ? prevIds.filter(id => id !== categoryId)
        : [...prevIds, categoryId]
    );
  }, []);

  const addCategoryExclusion = useCallback((categoryId: string) => {
    setExcludedCategoryIds(prevIds =>
      prevIds.includes(categoryId) ? prevIds : [...prevIds, categoryId]
    );
  }, []);

  const removeCategoryExclusion = useCallback((categoryId: string) => {
    setExcludedCategoryIds(prevIds => prevIds.filter(id => id !== categoryId));
  }, []);

  const isExcluded = useCallback(
    (categoryId: string) => {
      return excludedCategoryIds.includes(categoryId);
    },
    [excludedCategoryIds]
  );

  const value = {
    excludedCategoryIds,
    toggleCategoryExclusion,
    addCategoryExclusion,
    removeCategoryExclusion,
    isExcluded,
  };

  return (
    <ExcludedCategoriesContext.Provider value={value}>
      {children}
    </ExcludedCategoriesContext.Provider>
  );
};

export const useExcludedCategories = () => {
  const context = useContext(ExcludedCategoriesContext);
  if (context === undefined) {
    throw new Error(
      "useExcludedCategories must be used within an ExcludedCategoriesProvider"
    );
  }
  return context;
};
