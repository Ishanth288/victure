
import { checkSupabaseConnection } from "./supabaseConnection";
import { logError, displayErrorMessage } from "./errorHandling";

/**
 * Determine if an error should trigger a retry attempt
 */
function shouldRetryError(error: any): boolean {
  if (!error) return false;
  
  // Retry on network errors and certain HTTP status codes
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  
  const errorMessage = error.message || String(error);
  const statusCode = error.status || error.statusCode || error.code;
  
  return (
    retryableStatusCodes.includes(statusCode) ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('Failed to fetch')
  );
}

/**
 * A wrapper for Supabase queries with built-in error handling and retries
 * @param queryFn A function that returns a Supabase query promise
 * @param options Configuration options for retries and error handling
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    retries?: number;
    retryDelay?: number;
    onError?: (error: any) => void;
    context?: string;
  } = {}
): Promise<{ data: T | null; error: any; recovered?: boolean }> {
  const { retries = 3, retryDelay = 1000, onError, context } = options;
  let attemptCount = 0;
  let lastError: any = null;
  let recovered = false;

  while (attemptCount < retries) {
    try {
      // Check connection first if we've already had an error
      if (attemptCount > 0) {
        const isConnected = await checkSupabaseConnection();
        if (isConnected) {
          recovered = true;
          console.log(`Connection recovered on attempt ${attemptCount + 1}`);
        }
      }

      const result = await queryFn();
      
      if (result.error) {
        lastError = result.error;
        console.error(`Query error on attempt ${attemptCount + 1}:`, result.error);
        
        // Only retry on certain error types
        if (!shouldRetryError(result.error)) {
          break;
        }
      } else {
        // Success! Return the data
        return { ...result, recovered };
      }
    } catch (error) {
      lastError = error;
      console.error(`Exception on attempt ${attemptCount + 1}:`, error);
    }

    // Increment attempt count and wait before retrying
    attemptCount++;
    
    if (attemptCount < retries) {
      const delay = retryDelay * Math.pow(2, attemptCount - 1); // Exponential backoff
      console.log(`Retrying in ${delay}ms (attempt ${attemptCount + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries failed
  if (onError) {
    onError(lastError);
  } else {
    displayErrorMessage(lastError, context);
  }

  // Log the final error
  logError(lastError, context);
  
  return { data: null, error: lastError, recovered };
}
