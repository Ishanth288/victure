
/**
 * Utility functions to safely handle Supabase query responses
 */

// Type guard to check if response is an error
export function isQueryError(data: any): boolean {
  return data && typeof data === 'object' && 'error' in data;
}

// Safely cast Supabase query result to an expected type
export function safelyUnwrapData<T>(data: any, defaultValue: T): T {
  if (!data || isQueryError(data)) {
    return defaultValue;
  }
  return data as T;
}

// Safely access a property from query result, with a fallback value
export function safelyGetProperty<T>(obj: any, property: string, defaultValue: T): T {
  if (!obj || isQueryError(obj) || typeof obj !== 'object' || !(property in obj)) {
    return defaultValue;
  }
  return obj[property] as T;
}

// Safely cast an array of query results
export function safelyCastArray<T>(data: any): T[] {
  if (!data || isQueryError(data)) {
    return [];
  }
  
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data as T[];
}

// Helper to safely spread objects from Supabase response
export function safelySpreadObject<T>(obj: any, defaultValues: T): T {
  if (!obj || isQueryError(obj) || typeof obj !== 'object') {
    return defaultValues;
  }
  
  return { ...defaultValues, ...obj } as T;
}

// Convert a value to the proper format for filter matching with eq()
export function toFilterValue(value: string | number): string | number {
  // Handle UUIDs or IDs depending on your schema
  return value;
}
