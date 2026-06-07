import { useState } from 'react';

/**
 * useLocalStorage
 *
 * Typed React hook that syncs state with localStorage.
 * Falls back gracefully if localStorage is unavailable (private browsing, SSR).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)): void => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (valueToStore === null || valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch {
      // localStorage write failures are non-fatal — state still updates in memory
      setStoredValue(value instanceof Function ? value(storedValue) : value);
    }
  };

  return [storedValue, setValue];
}
