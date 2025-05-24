
type SupabaseResult<T> = {
  data: T;
  error: any;
};

/**
 * Execute a Supabase query with automatic retry on failure
 * @param queryFn Function that returns a Supabase query or Promise
 * @param options Configuration options for retry behavior
 * @returns Promise with the query result
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<SupabaseResult<T>> | { then(onfulfilled: (value: SupabaseResult<T>) => any): any },
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    context?: string;
  }
): Promise<SupabaseResult<T>> {
  const maxRetries = options?.maxRetries ?? 3;
  const retryDelay = options?.retryDelay ?? 1000;
  const context = options?.context ? ` (${options.context})` : '';
  
  let attempts = 0;
  let lastError: any = null;

  while (attempts < maxRetries) {
    try {
      // Handle both direct Supabase query objects and Promise-wrapped returns
      // by awaiting the result (works for both types since Supabase queries are "thenable")
      const result = await queryFn();
      
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
      
      return result as SupabaseResult<T>;
    } catch (error) {
      console.error(`Error executing Supabase query on attempt ${attempts + 1}${context}:`, error);
      lastError = error;
      
      // If this is not the last attempt, retry after delay
      if (attempts < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
        attempts++;
      } else {
        // On final attempt, return formatted error response
        return { data: null as unknown as T, error: lastError };
      }
    }
  }

  // If we've exhausted all retries, return the last error
  return { data: null as unknown as T, error: lastError };
}
