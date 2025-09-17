"use client";

import React, { createContext, useContext } from "react";

export interface CategoryFilterContextValue {
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  clearCategoryFilter: () => void;
}

const defaultValue: CategoryFilterContextValue = {
  selectedCategoryId: null,
  setSelectedCategoryId: () => {},
  clearCategoryFilter: () => {},
};

const CategoryFilterContext =
  createContext<CategoryFilterContextValue>(defaultValue);

export function useCategoryFilter() {
  return useContext(CategoryFilterContext);
}

interface ProviderProps {
  value: CategoryFilterContextValue;
  children: React.ReactNode;
}

export function CategoryFilterProvider({ value, children }: ProviderProps) {
  return (
    <CategoryFilterContext.Provider value={value}>
      {children}
    </CategoryFilterContext.Provider>
  );
}
