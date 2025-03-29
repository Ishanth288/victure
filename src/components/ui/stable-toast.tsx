
import { toast as originalToast } from "@/hooks/use-toast";
import * as Sentry from "@sentry/react";

// Create a wrapper for the toast function that adds stability
// and prevents multiple similar toasts from appearing rapidly
const toastTimeouts = new Map<string, number>();

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

// Generate a key for the toast to track duplicates
const generateToastKey = (options: ToastOptions): string => {
  return `${options.title || ''}-${options.description || ''}-${options.variant || 'default'}`;
};

export const stableToast = (options: ToastOptions) => {
  const key = generateToastKey(options);
  
  // Log toast event to Sentry for debugging
  Sentry.addBreadcrumb({
    category: 'ui.toast',
    message: `Toast: ${options.title} - ${options.description}`,
    level: 'info',
  });

  // Prevent duplicate toasts within a short time period
  if (toastTimeouts.has(key)) {
    return;
  }
  
  // Show the toast
  originalToast({
    ...options,
    duration: options.duration || 3000,
  });
  
  // Set a timeout to prevent duplicate toasts
  const timeoutId = window.setTimeout(() => {
    toastTimeouts.delete(key);
  }, 1000);
  
  toastTimeouts.set(key, timeoutId);
};

// Clean up all timeouts when needed (e.g., on page navigation)
export const clearToastTimeouts = () => {
  toastTimeouts.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  toastTimeouts.clear();
};
