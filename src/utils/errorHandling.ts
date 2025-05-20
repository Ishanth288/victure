
import * as Sentry from "@sentry/react";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, WifiOff, Database, ServerCrash, UserX, AlertTriangle } from "lucide-react";
import React from "react";

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
export function determineErrorType(error: any): 'connection' | 'database' | 'server' | 'auth' | 'validation' | 'unknown' {
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
  
  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('login') ||
    errorMessage.includes('password') ||
    errorMessage.includes('token') ||
    errorMessage.includes('session') ||
    errorMessage.includes('JWT')
  ) {
    return 'auth';
  }
  
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('required') ||
    errorMessage.includes('invalid')
  ) {
    return 'validation';
  }
  
  return 'unknown';
}

/**
 * Format an error message for user display
 */
export function getUserFriendlyErrorMessage(error: any): string {
  const errorType = determineErrorType(error);
  const baseMessage = error.message || String(error);
  
  switch (errorType) {
    case 'connection':
      return 'Connection error. Please check your internet connection and try again.';
    case 'database':
      return 'Database error. Our team has been notified.';
    case 'server':
      return 'Server error. Please try again in a few minutes.';
    case 'auth':
      return 'Authentication error. Please log in again.';
    case 'validation':
      return baseMessage; // Validation errors are usually user-friendly already
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Get an appropriate icon based on error type
 */
function getErrorIcon(errorType: 'connection' | 'database' | 'server' | 'auth' | 'validation' | 'unknown') {
  const iconProps = { className: "h-4 w-4" };
  
  switch (errorType) {
    case 'connection':
      return React.createElement(WifiOff, iconProps);
    case 'database':
      return React.createElement(Database, iconProps);
    case 'server':
      return React.createElement(ServerCrash, iconProps);
    case 'auth':
      return React.createElement(UserX, iconProps);
    case 'validation':
      return React.createElement(AlertTriangle, iconProps);
    default:
      return React.createElement(AlertCircle, iconProps);
  }
}

/**
 * Display appropriate error message based on error type
 */
export function displayErrorMessage(error: any, context?: string): void {
  const errorType = determineErrorType(error);
  const userMessage = getUserFriendlyErrorMessage(error);
  
  toast({
    title: `Error${context ? ` in ${context}` : ''}`,
    description: userMessage,
    variant: "destructive",
    icon: getErrorIcon(errorType)
  });
}

/**
 * Handle API errors with proper logging and user feedback
 */
export async function safeApiCall<T>(
  apiFunction: () => Promise<T>,
  options?: {
    onError?: (error: any) => void;
    context?: string;
    showToast?: boolean;
    fallbackData?: T;
    retry?: boolean;
    retryCount?: number;
  }
): Promise<{ data: T | null; error: any }> {
  const {
    onError,
    context = 'API Call',
    showToast = true,
    fallbackData = null,
    retry = false,
    retryCount = 1
  } = options || {};

  try {
    const data = await apiFunction();
    return { data, error: null };
  } catch (error: any) {
    // Log the error
    logError(error, context);
    
    // Call custom error handler if provided
    if (onError) {
      onError(error);
    }
    
    // Show toast notification if enabled
    if (showToast) {
      displayErrorMessage(error, context);
    }
    
    // Retry logic if enabled
    if (retry && retryCount > 0) {
      console.log(`Retrying... (${retryCount} attempts left)`);
      return safeApiCall(apiFunction, {
        ...options,
        retryCount: retryCount - 1
      });
    }
    
    return { data: fallbackData, error };
  }
}
