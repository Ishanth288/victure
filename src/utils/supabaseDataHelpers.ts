
/**
 * Additional helpers for data operations with Supabase
 */

import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isQueryError, safelyGetProperty } from './supabaseHelpers';

/**
 * Safely handle any Supabase operation result
 */
export function handleResult<T>(data: T | null, error: PostgrestError | null, defaultValue: T): T {
  if (error || !data) {
    console.error('Supabase operation error:', error);
    return defaultValue;
  }
  return data;
}

/**
 * Safely extract data or return null
 */
export function extractData<T>(result: { data: T | null, error: PostgrestError | null }): T | null {
  if (result.error || !result.data) {
    console.error('Error extracting data:', result.error);
    return null;
  }
  return result.data;
}

/**
 * Safely wrap any async Supabase operation
 */
export async function safeOperation<T>(
  operation: () => Promise<{ data: T | null, error: PostgrestError | null }>,
  defaultValue: T
): Promise<T> {
  try {
    const { data, error } = await operation();
    if (error) {
      console.error('Operation error:', error);
      return defaultValue;
    }
    return data || defaultValue;
  } catch (e) {
    console.error('Exception in operation:', e);
    return defaultValue;
  }
}

/**
 * Type-safe way to query by ID with error handling
 */
export async function safeQueryById<T>(
  table: string,
  id: string | number,
  defaultValue: T,
  idColumn: string = 'id'
): Promise<T> {
  return safeOperation(
    () => supabase.from(table).select('*').eq(idColumn, id).single(),
    defaultValue
  );
}

/**
 * Type-safe way to insert a record
 */
export async function safeInsert<T>(
  table: string,
  data: Record<string, any>,
  defaultValue: T
): Promise<T> {
  return safeOperation(
    () => supabase.from(table).insert([data as any]).select().single(),
    defaultValue
  );
}

/**
 * Type-safe way to update a record
 */
export async function safeUpdate<T>(
  table: string,
  id: string | number,
  data: Record<string, any>,
  defaultValue: T,
  idColumn: string = 'id'
): Promise<T> {
  return safeOperation(
    () => supabase.from(table).update(data as any).eq(idColumn, id).select().single(),
    defaultValue
  );
}

/**
 * Safe check for data or error existence
 */
export function hasData<T>(result: { data: T | null, error: PostgrestError | null }): boolean {
  return !result.error && !!result.data;
}

/**
 * Safe property access with type casting
 */
export function getProperty<T>(data: any, property: string, defaultValue: T): T {
  if (isQueryError(data)) return defaultValue;
  return safelyGetProperty(data, property, defaultValue);
}

/**
 * Type-safe casting with null check
 */
export function castAs<T>(data: any): T | null {
  if (!data || isQueryError(data)) return null;
  return data as T;
}

/**
 * Type-safe array casting with empty fallback
 */
export function castArray<T>(data: any): T[] {
  if (!data || isQueryError(data)) return [];
  if (!Array.isArray(data)) return [];
  return data as T[];
}
