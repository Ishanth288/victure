
import { supabase } from '@/integrations/supabase/client';

/**
 * Retry wrapper for Supabase queries with exponential backoff
 */
export async function retryQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<{ data: T | null; error: any }> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await queryFn();
      
      // If successful or it's a non-retryable error, return immediately
      if (!result.error || isNonRetryableError(result.error)) {
        return result;
      }
      
      lastError = result.error;
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Query failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error;
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Query threw error (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return { data: null, error: lastError };
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code || '';
  
  // Don't retry auth errors, permission errors, or invalid queries
  return (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('invalid') ||
    message.includes('malformed') ||
    code === 'PGRST301' || // Row Level Security
    code === 'PGRST116' || // Invalid query
    code === '401' ||
    code === '403'
  );
}

/**
 * Enhanced query wrapper with built-in auth handling
 */
export async function queryWithAuth<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  context: string = 'query'
): Promise<{ data: T | null; error: any }> {
  // First check if we have a valid session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error(`Session error in ${context}:`, sessionError);
    return { data: null, error: sessionError };
  }
  
  if (!session) {
    console.error(`No session found for ${context}`);
    return { data: null, error: { message: 'Authentication required' } };
  }
  
  // Execute the query with retry logic
  return retryQuery(queryFn, 2, 500);
}

/**
 * Generic retry function for any operation
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
