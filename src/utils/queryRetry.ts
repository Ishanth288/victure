
import * as Sentry from "@sentry/react";

/**
 * Execute a Supabase query with automatic retry on failure
 * @param queryFn Function that returns a Supabase query
 * @param options Configuration options for retry behavior
 * @returns Promise with the query result
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<{ data: T; error: any; }> | { data: T; error: any; },
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    context?: string;
  }
): Promise<{ data: T; error: any; }> {
  const maxRetries = options?.maxRetries ?? 3;
  const retryDelay = options?.retryDelay ?? 1000;
  const context = options?.context ? ` (${options.context})` : '';
  
  let attempts = 0;
  let lastError: any = null;

  while (attempts < maxRetries) {
    try {
      // Convert result to a promise if it isn't already one
      // This ensures we handle both direct Supabase query objects and Promise-wrapped returns
      const result = await Promise.resolve(queryFn());
      
      if (result.error) {
        // Log the error but continue with retry logic
        console.error(`Supabase query error on attempt ${attempts + 1}${context}:`, result.error);
        lastError = result.error;
        
        // If this is not the last attempt, retry after delay
        if (attempts < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
          attempts++;
          continue;
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error executing Supabase query on attempt ${attempts + 1}${context}:`, error);
      lastError = error;
      
      // If this is not the last attempt, retry after delay
      if (attempts < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
        attempts++;
      } else {
        // Capture more serious errors in Sentry
        Sentry.captureException(error, {
          tags: {
            context: options?.context || 'supabase-query'
          }
        });
        
        // On final attempt, return formatted error response
        return { data: null as any, error: lastError };
      }
    }
  }

  // If we've exhausted all retries, return the last error
  return { data: null as any, error: lastError };
}
