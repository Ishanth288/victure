
import * as Sentry from "@sentry/react";
import { toast } from "@/hooks/use-toast";

/**
 * Error boundary component that catches errors and logs them
 */
export function logError(error: any, info?: string): void {
  console.error(`Application error ${info ? `in ${info}` : ''}:`, error);
  Sentry.captureException(error);
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
 * Display appropriate error message based on error type
 */
export function displayErrorMessage(error: any, context?: string): void {
  const errorType = determineErrorType(error);
  
  switch (errorType) {
    case 'connection':
      toast({
        title: "Connection error",
        description: "Please check your internet connection and try again",
        variant: "destructive"
      });
      break;
    case 'database':
      toast({
        title: "Database error",
        description: "There was an issue processing your data. Please try again later",
        variant: "destructive"
      });
      break;
    case 'server':
      toast({
        title: "Server error",
        description: "Our servers are currently experiencing issues. Please try again later",
        variant: "destructive"
      });
      break;
    default:
      toast({
        title: "Error",
        description: context ? `Error in ${context}` : "An unexpected error occurred",
        variant: "destructive"
      });
  }
}
