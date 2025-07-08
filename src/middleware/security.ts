/**
 * Security Middleware
 * Priority 2 Security Implementation
 * Comprehensive security layer for the application
 */

import {
  SECURITY_HEADERS,
  CORS_CONFIG,
  generateCSPHeader,
  isAllowedOrigin,
  RATE_LIMITS,
  SECURITY_EVENTS,
  getSecurityEventSeverity,
  isHighRiskEvent
} from '../config/security';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked?: boolean; blockUntil?: number }>();

// Security event logging
interface SecurityEvent {
  type: keyof typeof SECURITY_EVENTS;
  severity: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  details?: any;
}

const securityEventLog: SecurityEvent[] = [];

// Utility functions
const getClientIP = (headers?: Record<string, string>): string => {
  if (!headers) return 'unknown';
  
  const forwarded = headers['x-forwarded-for'];
  const realIP = headers['x-real-ip'];
  const remoteAddr = headers['x-vercel-forwarded-for'];
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (remoteAddr) {
    return remoteAddr;
  }
  return 'unknown';
};

const logSecurityEvent = (type: keyof typeof SECURITY_EVENTS, context?: { headers?: Record<string, string>; url?: string; userAgent?: string }, details?: any) => {
  const event: SecurityEvent = {
    type,
    severity: getSecurityEventSeverity(type),
    timestamp: new Date().toISOString(),
    ip: getClientIP(context?.headers),
    userAgent: context?.userAgent || context?.headers?.['user-agent'] || 'unknown',
    url: context?.url || 'unknown',
    details
  };
  
  securityEventLog.push(event);
  
  // Keep only last 1000 events in memory
  if (securityEventLog.length > 1000) {
    securityEventLog.shift();
  }
  
  // Log high-risk events to console for immediate attention
  if (isHighRiskEvent(type)) {
    console.warn('HIGH RISK SECURITY EVENT:', event);
  }
};

// Rate limiting implementation
const checkRateLimit = (key: string, limit: { maxAttempts: number; windowMs: number; blockDurationMs: number }): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // Check if currently blocked
  if (entry?.blocked && entry.blockUntil && now < entry.blockUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockUntil
    };
  }
  
  // Reset if window has passed
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.windowMs,
      blocked: false
    });
    return {
      allowed: true,
      remaining: limit.maxAttempts - 1,
      resetTime: now + limit.windowMs
    };
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > limit.maxAttempts) {
    entry.blocked = true;
    entry.blockUntil = now + limit.blockDurationMs;
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockUntil
    };
  }
  
  return {
    allowed: true,
    remaining: limit.maxAttempts - entry.count,
    resetTime: entry.resetTime
  };
};

// CORS handling utility
const getCORSHeaders = (origin?: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  headers['Access-Control-Allow-Methods'] = CORS_CONFIG.allowedMethods.join(', ');
  headers['Access-Control-Allow-Headers'] = CORS_CONFIG.allowedHeaders.join(', ');
  headers['Access-Control-Max-Age'] = CORS_CONFIG.maxAge.toString();
  
  if (CORS_CONFIG.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return headers;
};

// Check if origin is allowed
const validateOrigin = (origin?: string): boolean => {
  if (!origin) return true; // Allow requests without origin (same-origin)
  return isAllowedOrigin(origin);
};

// Security headers utility
const getSecurityHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  // Apply all security headers
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    headers[header] = value;
  });
  
  // Apply CSP header
  headers['Content-Security-Policy'] = generateCSPHeader();
  
  return headers;
};

// Suspicious request detection
const detectSuspiciousRequest = (url: string, headers?: Record<string, string>): boolean => {
  const urlLower = url.toLowerCase();
  const userAgent = headers?.['user-agent']?.toLowerCase() || '';
  const referer = headers?.['referer']?.toLowerCase() || '';
  
  // Check for common attack patterns
  const suspiciousPatterns = [
    // SQL injection patterns
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    
    // XSS patterns
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    
    // Path traversal
    /\.\.\/|\.\.\\/,
    /etc\/passwd/i,
    /windows\/system32/i,
    
    // Command injection
    /;\s*(cat|ls|pwd|whoami|id)/i,
    /\|\s*(cat|ls|pwd|whoami|id)/i,
    
    // Common attack tools
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burp/i
  ];
  
  // Check URL and headers for suspicious patterns
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(urlLower) || pattern.test(userAgent) || pattern.test(referer)
  );
  
  // Check for unusual request characteristics
  const hasUnusualHeaders = [
    'x-forwarded-host',
    'x-originating-ip',
    'x-remote-ip',
    'x-cluster-client-ip'
  ].some(header => headers?.[header]);
  
  // Check for missing common headers
  const missingCommonHeaders = !headers?.['accept'] || !headers?.['user-agent'];
  
  return isSuspicious || hasUnusualHeaders || missingCommonHeaders;
};

// Security validation utilities for React/Vite app
export const validateRequest = (url: string, headers?: Record<string, string>, method?: string) => {
  const clientIP = getClientIP(headers);
  const pathname = new URL(url, 'http://localhost').pathname;
  
  // Check for suspicious requests
  const isSuspicious = detectSuspiciousRequest(url, headers);
  if (isSuspicious) {
    logSecurityEvent('SUSPICIOUS_INPUT_DETECTED', { headers, url }, {
      reason: 'Suspicious request pattern detected',
      pathname
    });
    return { allowed: false, reason: 'Suspicious request detected' };
  }
  
  // Check rate limits
  let rateLimitKey = `${clientIP}:general`;
  let rateLimitConfig = RATE_LIMITS.API_CALLS;
  
  if (pathname.includes('/auth/login')) {
    rateLimitKey = `${clientIP}:login`;
    rateLimitConfig = { ...RATE_LIMITS.LOGIN_ATTEMPTS, maxAttempts: 100 };
  } else if (pathname.includes('/admin')) {
    rateLimitKey = `${clientIP}:admin`;
    rateLimitConfig = { ...RATE_LIMITS.ADMIN_ACTIONS, maxAttempts: 100 };
  } else if (pathname.includes('/api/patients') && method === 'POST') {
    rateLimitKey = `${clientIP}:patient_creation`;
    rateLimitConfig = { ...RATE_LIMITS.PATIENT_CREATION, maxAttempts: 100 };
  } else if (pathname.includes('/api/prescriptions') && method === 'POST') {
    rateLimitKey = `${clientIP}:prescription_creation`;
    rateLimitConfig = { ...RATE_LIMITS.PRESCRIPTION_CREATION, maxAttempts: 100 };
  } else if (pathname.includes('/upload')) {
    rateLimitKey = `${clientIP}:file_upload`;
    rateLimitConfig = { ...RATE_LIMITS.FILE_UPLOAD, maxAttempts: 100 };
  }
  
  const rateLimit = checkRateLimit(rateLimitKey, rateLimitConfig);
  
  if (!rateLimit.allowed) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', { headers, url }, {
      key: rateLimitKey,
      resetTime: rateLimit.resetTime,
      pathname
    });
    return { 
      allowed: false, 
      reason: 'Rate limit exceeded',
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    };
  }
  
  return { allowed: true, rateLimit };
};

// Export utility functions for use in other parts of the application
export { logSecurityEvent, getClientIP, detectSuspiciousRequest, validateOrigin, getCORSHeaders, getSecurityHeaders, checkRateLimit };

export const getSecurityEventLog = (): SecurityEvent[] => {
  return [...securityEventLog]; // Return a copy
};

export const clearSecurityEventLog = (): void => {
  securityEventLog.length = 0;
};

export const getRateLimitStatus = (key: string) => {
  return rateLimitStore.get(key);
};

export const clearRateLimitStore = (): void => {
  rateLimitStore.clear();
};

// Cleanup function to remove old entries
export const cleanupSecurityStore = (): void => {
  const now = Date.now();
  
  // Clean up rate limit store
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime && (!entry.blockUntil || now > entry.blockUntil)) {
      rateLimitStore.delete(key);
    }
  }
  
  // Keep only recent security events (last 24 hours)
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const recentEvents = securityEventLog.filter(event => event.timestamp > oneDayAgo);
  securityEventLog.length = 0;
  securityEventLog.push(...recentEvents);
};

// Run cleanup every hour
if (typeof window === 'undefined') { // Only run on server
  setInterval(cleanupSecurityStore, 60 * 60 * 1000);
}