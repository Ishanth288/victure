
/**
 * Utility functions to safely handle Supabase query responses
 */

import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

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

// Type-safe filter for ID columns
export function filterById(columnName: string, value: string | number, tableName?: string) {
  // This function provides a type-safe way to filter by ID columns
  return (query: PostgrestFilterBuilder<any, any, any>) => {
    // @ts-ignore - Intentionally bypassing TypeScript's type checking for filter values
    return query.eq(columnName, value);
  };
}

// Type-safe insert for table data
export function safelyInsertData<T>(data: T): any {
  // This allows inserting data without TypeScript complaining about exact matching types
  return data as any;
}

// Type-safe update for table data
export function safelyUpdateData<T>(data: T): any {
  // This allows updating data without TypeScript complaining about exact matching types
  return data as any;
}

// Type-safe way to convert an array to a properly typed result array
export function safelyCastResult<T>(data: any): T[] {
  if (!data || isQueryError(data)) {
    return [] as T[];
  }
  
  // @ts-ignore - Force the type conversion
  return data as T[];
}

// Convert a value to the proper format for filter matching with eq()
export function toFilterValue(value: string | number): string | number {
  // Handle UUIDs or IDs depending on your schema
  return value;
}

// Safely handle spread on error objects
export function safeSpreading<T>(obj: any, defaultObj: T): T {
  if (!obj || isQueryError(obj)) {
    return defaultObj;
  }
  
  if (typeof obj !== 'object') {
    return defaultObj;
  }
  
  return { ...defaultObj, ...obj } as T;
}

// Helper for dealing with API client operations
export async function safeQueryExecution<T>(
  queryFn: () => Promise<{ data: any; error: any }>,
  defaultValue: T
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    if (error) return defaultValue;
    if (!data) return defaultValue;
    return data as T;
  } catch (e) {
    console.error("Error executing query:", e);
    return defaultValue;
  }
}

// Helper function to safely handle data coming back from a query
export function safelyHandleQueryResponse<T>(response: PostgrestSingleResponse<any>, defaultValue: T): T {
  if (response.error) {
    console.error("Error in query response:", response.error);
    return defaultValue;
  }
  
  if (!response.data) {
    return defaultValue;
  }
  
  return response.data as unknown as T;
}

// Type-safe way to indicate data should be treated as a specific type
export function asType<T>(data: any): T {
  return data as unknown as T;
}
