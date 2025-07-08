/**
 * Client-side rate limiting utility that integrates with Supabase Edge Function
 * Priority 2 Security Implementation
 */

import { supabase } from '../integrations/supabase/client';
import { logSecurityEvent } from './securityLogger';

interface RateLimitOptions {
  action: string;
  identifier?: string;
  maxAttempts?: number;
  timeWindowMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  warning?: string;
}

/**
 * Check rate limit before performing an action
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  try {
    // Get current user session for identifier
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // Use provided identifier or fallback to user ID or IP-based identifier
    const identifier = options.identifier || userId || await getClientIdentifier();
    
    // Call the rate limiter edge function
    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: {
        action: options.action,
        identifier,
        maxAttempts: options.maxAttempts,
        timeWindowMs: options.timeWindowMs
      }
    });
    
    if (error) {
      console.error('Rate limiter error:', error);
      // In case of error, allow the action but log it
      logSecurityEvent('RATE_LIMITER_ERROR', {
        action: options.action,
        error: error.message
      });
      
      return {
        allowed: true,
        remaining: 99,
        resetTime: Date.now() + 60000,
        warning: 'Rate limiting temporarily unavailable'
      };
    }
    
    return data as RateLimitResult;
    
  } catch (error) {
    console.error('Rate limit check failed:', error);
    
    // Fallback to local rate limiting
    return checkLocalRateLimit(options);
  }
}

/**
 * Fallback local rate limiting using localStorage
 */
function checkLocalRateLimit(options: RateLimitOptions): RateLimitResult {
  const { action, maxAttempts = 10, timeWindowMs = 60000 } = options;
  const now = Date.now();
  const storageKey = `rateLimit_${action}`;
  
  try {
    const storedData = localStorage.getItem(storageKey);
    let attempts: { timestamp: number }[] = storedData ? JSON.parse(storedData) : [];
    
    // Filter out attempts outside the time window
    attempts = attempts.filter(attempt => now - attempt.timestamp < timeWindowMs);
    
    const remaining = Math.max(0, maxAttempts - attempts.length - 1);
    const resetTime = now + timeWindowMs;
    
    if (attempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...attempts.map(a => a.timestamp));
      const retryAfter = Math.max(0, oldestAttempt + timeWindowMs - now);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(retryAfter / 1000)
      };
    }
    
    // Record this attempt
    attempts.push({ timestamp: now });
    localStorage.setItem(storageKey, JSON.stringify(attempts));
    
    return {
      allowed: true,
      remaining,
      resetTime
    };
    
  } catch (error) {
    console.error('Local rate limiting error:', error);
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + timeWindowMs,
      warning: 'Rate limiting unavailable'
    };
  }
}

/**
 * Generate a client identifier for anonymous users
 */
async function getClientIdentifier(): Promise<string> {
  // Try to get a persistent identifier from localStorage
  let clientId = localStorage.getItem('client_id');
  
  if (!clientId) {
    // Generate a new client ID
    clientId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('client_id', clientId);
  }
  
  return clientId;
}

/**
 * Rate limiting decorator for functions
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RateLimitOptions
): T {
  return (async (...args: any[]) => {
    const rateLimitResult = await checkRateLimit(options);
    
    if (!rateLimitResult.allowed) {
      const error = new Error(`Rate limit exceeded for action: ${options.action}`);
      (error as any).rateLimitInfo = rateLimitResult;
      throw error;
    }
    
    return fn(...args);
  }) as T;
}

/**
 * Pre-configured rate limiters for common actions
 */
export const rateLimiters = {
  // Authentication actions
  login: (identifier?: string) => checkRateLimit({ 
    action: 'login', 
    identifier,
    maxAttempts: 5, 
    timeWindowMs: 15 * 60 * 1000 
  }),
  
  adminAccess: (identifier?: string) => checkRateLimit({ 
    action: 'admin_access', 
    identifier,
    maxAttempts: 3, 
    timeWindowMs: 60 * 60 * 1000 
  }),
  
  passwordReset: (identifier?: string) => checkRateLimit({ 
    action: 'password_reset', 
    identifier,
    maxAttempts: 3, 
    timeWindowMs: 60 * 60 * 1000 
  }),
  
  // Data creation actions
  createPatient: () => checkRateLimit({ 
    action: 'patient_create',
    maxAttempts: 10, 
    timeWindowMs: 60 * 1000 
  }),
  
  createPrescription: () => checkRateLimit({ 
    action: 'prescription_create',
    maxAttempts: 20, 
    timeWindowMs: 60 * 1000 
  }),
  
  createBill: () => checkRateLimit({ 
    action: 'bill_create',
    maxAttempts: 30, 
    timeWindowMs: 60 * 1000 
  }),
  
  updateInventory: () => checkRateLimit({ 
    action: 'inventory_update',
    maxAttempts: 50, 
    timeWindowMs: 60 * 1000 
  }),
  
  // Communication actions
  sendEmail: () => checkRateLimit({ 
    action: 'email_send',
    maxAttempts: 10, 
    timeWindowMs: 60 * 60 * 1000 
  }),
  
  // File operations
  uploadFile: () => checkRateLimit({ 
    action: 'file_upload',
    maxAttempts: 20, 
    timeWindowMs: 60 * 1000 
  }),
  
  // Search and export
  search: () => checkRateLimit({ 
    action: 'search',
    maxAttempts: 100, 
    timeWindowMs: 60 * 1000 
  }),
  
  export: () => checkRateLimit({ 
    action: 'export',
    maxAttempts: 5, 
    timeWindowMs: 60 * 1000 
  }),
  
  // System operations
  backup: () => checkRateLimit({ 
    action: 'backup',
    maxAttempts: 2, 
    timeWindowMs: 60 * 60 * 1000 
  }),
  
  bulkOperation: () => checkRateLimit({ 
    action: 'bulk_operation',
    maxAttempts: 3, 
    timeWindowMs: 60 * 1000 
  }),
  
  // General API calls
  apiCall: () => checkRateLimit({ 
    action: 'api_call',
    maxAttempts: 100, 
    timeWindowMs: 60 * 1000 
  })
};

// logSecurityEvent is now imported from './securityLogger'

/**
 * Get client IP address (best effort)
 */
async function getClientIP(): Promise<string | null> {
  try {
    // This is a simplified approach - in production, you might want to use a service
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return null;
  }
}

/**
 * Determine severity level based on event type
 */
function getSeverityLevel(eventType: string): string {
  const severityMap: Record<string, string> = {
    'RATE_LIMIT_EXCEEDED': 'medium',
    'MULTIPLE_FAILED_LOGINS': 'high',
    'ADMIN_ACCESS_ATTEMPT': 'high',
    'SUSPICIOUS_ACTIVITY': 'high',
    'RATE_LIMITER_ERROR': 'low',
    'AUTHENTICATION_FAILURE': 'medium',
    'UNAUTHORIZED_ACCESS': 'high',
    'DATA_BREACH_ATTEMPT': 'critical',
    'SYSTEM_ERROR': 'low'
  };
  
  return severityMap[eventType] || 'info';
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  public rateLimitInfo: RateLimitResult;
  
  constructor(message: string, rateLimitInfo: RateLimitResult) {
    super(message);
    this.name = 'RateLimitError';
    this.rateLimitInfo = rateLimitInfo;
  }
}

/**
 * Hook for React components to handle rate limiting
 */
export function useRateLimit() {
  const checkLimit = async (options: RateLimitOptions): Promise<boolean> => {
    try {
      const result = await checkRateLimit(options);
      
      if (!result.allowed) {
        const retryAfter = result.retryAfter || 60;
        throw new RateLimitError(
          `Too many requests. Please try again in ${retryAfter} seconds.`,
          result
        );
      }
      
      return true;
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      
      // Log unexpected errors
      logSecurityEvent('RATE_LIMIT_CHECK_ERROR', {
        action: options.action,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Allow the action in case of unexpected errors
      return true;
    }
  };
  
  return { checkLimit, rateLimiters };
}