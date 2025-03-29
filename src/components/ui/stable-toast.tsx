
import { toast as originalToast } from "@/hooks/use-toast";
import * as Sentry from "@sentry/react";

// Create a wrapper for the toast function that adds stability
// and prevents multiple similar toasts from appearing rapidly
const toastTimeouts = new Map<string, number>();
const visibleToasts = new Set<string>();

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
  
  // If we already have this toast visible or waiting to be cleared, don't show it again
  if (visibleToasts.has(key) || toastTimeouts.has(key)) {
    return;
  }
  
  // Log toast event to Sentry for debugging
  Sentry.addBreadcrumb({
    category: 'ui.toast',
    message: `Toast: ${options.title} - ${options.description}`,
    level: 'info',
  });
  
  // Mark this toast as visible
  visibleToasts.add(key);
  
  // Show the toast - ensure all toasts have a duration of 4 seconds (4000ms)
  originalToast({
    ...options,
    duration: 4000, // Force 4 seconds for all toasts
    onOpenChange: (open) => {
      if (!open) {
        visibleToasts.delete(key);
      }
    }
  });
  
  // Set a timeout to prevent duplicate toasts for a longer period
  const timeoutId = window.setTimeout(() => {
    toastTimeouts.delete(key);
  }, 4000);
  
  toastTimeouts.set(key, timeoutId);
};

// Clean up all timeouts when needed (e.g., on page navigation)
export const clearToastTimeouts = () => {
  toastTimeouts.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  toastTimeouts.clear();
  visibleToasts.clear();
};
