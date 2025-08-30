/**
 * Safe localStorage utilities with proper error handling and performance optimization
 */

// Check if localStorage is available
function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Cache for parsed values to avoid repeated JSON.parse calls
const parseCache = new Map<string, any>();
const cacheMaxSize = 50;

/**
 * Safely get an item from localStorage with error handling
 * @param key - The localStorage key
 * @param defaultValue - Default value if key doesn't exist or parsing fails
 * @returns The parsed value or default value
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isStorageAvailable()) return defaultValue;

  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;

    // Check cache first
    if (parseCache.has(key)) {
      return parseCache.get(key) as T;
    }

    const parsed = JSON.parse(item) as T;

    // Cache the parsed value (with size limit)
    if (parseCache.size >= cacheMaxSize) {
      const firstKey = parseCache.keys().next().value;
      parseCache.delete(firstKey);
    }
    parseCache.set(key, parsed);

    return parsed;
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely set an item in localStorage with error handling
 * @param key - The localStorage key
 * @param value - The value to store
 * @returns Success status
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (!isStorageAvailable()) return false;

  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);

    // Update cache
    parseCache.set(key, value);

    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);

    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded, attempting to clear old data");
      // Could implement cleanup strategy here
    }

    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * @param key - The localStorage key
 * @returns Success status
 */
export function removeStorageItem(key: string): boolean {
  if (!isStorageAvailable()) return false;

  try {
    localStorage.removeItem(key);
    parseCache.delete(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Clear all localStorage items (with confirmation)
 * @param confirm - Must be true to actually clear
 */
export function clearStorage(confirm: boolean = false): boolean {
  if (!confirm || !isStorageAvailable()) return false;

  try {
    localStorage.clear();
    parseCache.clear();
    return true;
  } catch (error) {
    console.warn("Failed to clear localStorage:", error);
    return false;
  }
}

/**
 * Get localStorage usage information
 */
export function getStorageInfo(): {
  available: boolean;
  approximateSize: number;
  itemCount: number;
} {
  if (!isStorageAvailable()) {
    return { available: false, approximateSize: 0, itemCount: 0 };
  }

  let approximateSize = 0;
  let itemCount = 0;

  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        approximateSize += localStorage[key].length + key.length;
        itemCount++;
      }
    }
  } catch (error) {
    console.warn("Failed to calculate localStorage size:", error);
  }

  return {
    available: true,
    approximateSize,
    itemCount,
  };
}
