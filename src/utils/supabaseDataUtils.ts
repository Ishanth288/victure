
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Safely check for data before accessing properties
 * This function helps prevent null property access errors
 */
export function safeDataAccess<T, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: T[K]): T[K] {
  if (!obj) return defaultValue;
  return obj[key] !== undefined ? obj[key] : defaultValue;
}

/**
 * Type guard to check if a response has an error
 */
export function hasError(response: any): response is { error: PostgrestError } {
  return response && response.error !== null && response.error !== undefined;
}

/**
 * Handle Supabase queries with proper error checking to prevent TypeScript errors
 * @param response The response from a Supabase query
 * @param fallback A fallback value to return if the response has an error
 * @returns The data from the response or the fallback value
 */
export function handleQueryData<T>(response: any, fallback: T): T {
  if (hasError(response) || !response.data) {
    return fallback;
  }
  return response.data as T;
}

/**
 * Safe cast function to handle unknown types from Supabase
 * @param data Data of unknown type
 * @param defaultValue Default value to return if data is invalid
 * @returns The data cast to type T or the default value
 */
export function safeCast<T>(data: unknown, defaultValue: T): T {
  if (data === null || data === undefined) {
    return defaultValue;
  }
  return data as T;
}
