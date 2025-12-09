// src/hooks/usePersistedSearch.ts
import { useState, useEffect } from 'react';

/**
 * Custom hook to persist search state in sessionStorage
 * @param key - Unique key for this search (e.g., 'moldSearch', 'productSearch')
 * @param defaultValue - Default value if no persisted value exists
 * @returns [searchValue, setSearchValue, clearSearch]
 */
export const usePersistedSearch = (
  key: string,
  defaultValue: string = ''
): [string, (value: string) => void, () => void] => {
  // Initialize state from sessionStorage or default
  const [search, setSearch] = useState<string>(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item !== null ? item : defaultValue;
    } catch (error) {
      console.warn(`Failed to load search from sessionStorage:`, error);
      return defaultValue;
    }
  });

  // Update sessionStorage whenever search changes
  useEffect(() => {
    try {
      sessionStorage.setItem(key, search);
    } catch (error) {
      console.warn(`Failed to save search to sessionStorage:`, error);
    }
  }, [key, search]);

  // Clear function
  const clearSearch = () => {
    setSearch(defaultValue);
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to clear search from sessionStorage:`, error);
    }
  };

  return [search, setSearch, clearSearch];
};

/**
 * Custom hook for multiple persisted filters
 * @param baseKey - Base key for the filters (e.g., 'productFilters')
 * @param filters - Object with filter names and default values
 * @returns Object with filter values and setters
 */
export const usePersistedFilters = <T extends Record<string, string>>(
  baseKey: string,
  filters: T
): [T, (key: keyof T, value: string) => void, () => void] => {
  const [filterValues, setFilterValues] = useState<T>(() => {
    const initial = { ...filters };
    try {
      Object.keys(filters).forEach((filterKey) => {
        const item = sessionStorage.getItem(`${baseKey}_${filterKey}`);
        if (item !== null) {
          (initial as any)[filterKey] = item;
        }
      });
    } catch (error) {
      console.warn(`Failed to load filters from sessionStorage:`, error);
    }
    return initial;
  });

  const setFilter = (key: keyof T, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    try {
      sessionStorage.setItem(`${baseKey}_${String(key)}`, value);
    } catch (error) {
      console.warn(`Failed to save filter to sessionStorage:`, error);
    }
  };

  const clearFilters = () => {
    setFilterValues(filters);
    try {
      Object.keys(filters).forEach((filterKey) => {
        sessionStorage.removeItem(`${baseKey}_${filterKey}`);
      });
    } catch (error) {
      console.warn(`Failed to clear filters from sessionStorage:`, error);
    }
  };

  return [filterValues, setFilter, clearFilters];
};
