
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Error boundary component that catches errors and logs them
 */
export function logError(error: any, info?: string): void {
  console.error(`Application error ${info ? `in ${info}` : ''}:`, error);
  Sentry.captureException(error);
}

/**
 * Check Supabase connection and attempt to reconnect if necessary
 * This can help recover from connection issues during preview loads
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log("Testing Supabase connection...");
    // Try a simple, lightweight query to test connection
    const { error } = await (supabase as any).from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection check failed:', error);
      Sentry.captureMessage('Supabase connection failed', {
        level: 'error',
        extra: { error }
      });
      
      // Try to recover connection
      await recoverConnection();
      return false;
    }
    
    console.log("Supabase connection test successful");
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    Sentry.captureException(error);
    
    // Try to recover connection
    await recoverConnection();
    return false;
  }
}

/**
 * Attempt to recover a failed Supabase connection
 * This helps especially with preview and initial load issues
 */
async function recoverConnection(): Promise<void> {
  try {
    console.log("Attempting to recover Supabase connection...");
    
    // Force a refresh of the auth session which can help re-establish connection
    const { error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Session refresh failed during recovery attempt:", error);
      return;
    }
    
    console.log('Attempted connection recovery via session refresh');
    
    // Intentionally adding a small delay to allow for recovery
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Recovery attempt failed:', error);
  }
}

/**
 * Determine the type of error from a Supabase error or general error
 * This helps provide more specific error messages to users
 */
export function determineErrorType(error: any): 'connection' | 'database' | 'server' | 'unknown' {
  if (!error) return 'unknown';
  
  const errorMessage = error.message || String(error);
  const errorDetails = error.details || '';
  
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('Network Error')
  ) {
    return 'connection';
  }
  
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('db error') ||
    errorMessage.includes('query') ||
    errorMessage.includes('column') ||
    errorMessage.includes('relation') ||
    errorDetails.includes('database')
  ) {
    return 'database';
  }
  
  if (
    errorMessage.includes('server') ||
    errorMessage.includes('500') ||
    errorMessage.includes('503') ||
    errorMessage.includes('unavailable') ||
    errorMessage.includes('internal')
  ) {
    return 'server';
  }
  
  return 'unknown';
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
  }

  // Log the final error
  const errorType = determineErrorType(lastError);
  const errorContext = context ? ` in ${context}` : '';
  console.error(`All retry attempts failed${errorContext}. Error type: ${errorType}`, lastError);
  
  if (errorType === 'connection') {
    toast({
      title: "Connection error",
      description: "Please check your internet connection and try again",
      variant: "destructive"
    });
  }

  return { data: null, error: lastError, recovered };
}

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
