
import { stableToast } from '@/components/ui/stable-toast';

const recentErrors = new Set<string>();

/**
 * Display standardized error messages throughout the application
 * @param error The error object or message
 * @param context Additional context about where the error occurred
 */
export const displayErrorMessage = (error: any, context?: string) => {
  const errorMessage = error?.message || error?.error?.message || String(error);
  const contextPrefix = context ? `${context}: ` : '';
  const fullMessage = `${contextPrefix}${errorMessage}`;

  if (recentErrors.has(fullMessage)) {
    return;
  }

  recentErrors.add(fullMessage);
  setTimeout(() => recentErrors.delete(fullMessage), 3000); // Clear after 3 seconds

  stableToast({
    title: "Error",
    description: fullMessage,
    variant: "destructive",
  });
  
  console.error(`Error in ${context || 'application'}:`, error);
};

/**
 * Check if an object is an error
 * @param obj The object to check
 */
export const isErrorObject = (obj: any): boolean => {
  return (
    obj instanceof Error || 
    (typeof obj === 'object' && 
     obj !== null && 
     ('message' in obj || 'error' in obj))
  );
};

/**
 * Safely extract error message from various error object formats
 * @param error The error object
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  if (error?.details) return error.details;
  if (error?.statusText) return error.statusText;
  
  return `An unknown error occurred: ${JSON.stringify(error)}`;
};

/**
 * Log an error to the console and potentially to a monitoring service
 * @param error The error to log
 * @param info Additional information about the error
 */
export const logError = (error: any, info?: string): void => {
  console.error(`Application error ${info ? `in ${info}` : ''}:`, error);
  // This would be a good place to add Sentry or other error logging service
};

/**
 * Handles API response errors, specifically 406 (Not Acceptable) and 409 (Conflict).
 * @param response The fetch API Response object.
 * @returns The response if successful, null for 406, or throws an error for 409.
 */
export const handleApiError = async (response: Response): Promise<Response | null> => {
  if (response.status === 406) {
    // Not Acceptable - wrong content type or other client-side issue
    console.warn('API expects different content type or request is not acceptable:', response.url);
    displayErrorMessage(new Error('API request not acceptable. Please check your input.'), 'API Error');
    return null;
  }

  if (response.status === 409) {
    // Conflict - resource already exists or version mismatch
    console.warn('Resource conflict detected, will handle gracefully:', response.url);
    // Don't throw error for conflicts, let the caller handle it
    return response;
  }

  if (response.status === 401) {
    console.warn('Authentication error:', response.url);
    displayErrorMessage(new Error('Please log in to continue'), 'Authentication Error');
    return null;
  }

  if (!response.ok) {
    console.error('API error:', response.status, response.statusText, response.url);
    displayErrorMessage(new Error(`API error: ${response.status} ${response.statusText}`), 'API Error');
    return null;
  }

  return response;
};

/**
 * Retries an asynchronous API call a specified number of times, especially for 'CONFLICT' errors.
 * @param apiCall The asynchronous function to call.
 * @param maxRetries The maximum number of retries (default: 2).
 * @returns The result of the successful API call.
 * @throws The original error if retries are exhausted or a non-retryable error occurs.
 */
export const apiCallWithRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 2): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      if ((error.message === 'CONFLICT' || error?.status === 409) && i < maxRetries - 1) {
        console.warn(`Retry attempt ${i + 1}/${maxRetries} after conflict.`);
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1))); // Shorter backoff
        continue;
      }
      throw error; // Re-throw if not a conflict or max retries reached
    }
  }
  throw new Error('API call failed after multiple retries.'); // Should ideally not be reached
};
