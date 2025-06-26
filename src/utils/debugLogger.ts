/**
 * Debug logging utility that respects the VITE_DEBUG_LOGS environment variable
 * This helps reduce console noise in production builds
 */

const isDebugEnabled = () => {
  return import.meta.env.VITE_DEBUG_LOGS === 'true' || import.meta.env.DEV;
};

export const debugLog = {
  log: (...args: any[]) => {
    if (isDebugEnabled()) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDebugEnabled()) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDebugEnabled()) {
      console.error(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDebugEnabled()) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDebugEnabled()) {
      console.debug(...args);
    }
  },
  
  // Performance logging for development
  time: (label: string) => {
    if (isDebugEnabled()) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDebugEnabled()) {
      console.timeEnd(label);
    }
  },
  
  // Group logging for better organization
  group: (label: string) => {
    if (isDebugEnabled()) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (isDebugEnabled()) {
      console.groupEnd();
    }
  },
  
  // Check if debug is enabled
  isEnabled: isDebugEnabled
};

// Default export for convenience
export default debugLog;
