/**
 * Security utilities for input sanitization and XSS prevention
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - Raw user input
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitize HTML content while preserving safe tags
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }
  
  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous attributes
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  html = html.replace(/\s*javascript\s*:/gi, '');
  html = html.replace(/\s*vbscript\s*:/gi, '');
  html = html.replace(/\s*data\s*:/gi, '');
  
  return html.trim();
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number format (basic validation)
 * @param phone - Phone number to validate
 * @returns True if valid phone format
 */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') {
    return false;
  }
  
  // Basic phone validation - digits and common separators
  const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{10,}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and requirements
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
} {
  if (typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumbers: false,
        hasSpecialChars: false,
      },
    };
  }

  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const isValid = requirements.minLength && score >= 3;

  return {
    isValid,
    score,
    requirements,
  };
}

/**
 * Generate a secure random token
 * @param length - Length of the token
 * @returns Random token string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Rate limiting helper for preventing brute force attacks
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if an identifier is rate limited
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @returns True if rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return true;
    }
    
    // Record this attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);
    
    return false;
  }

  /**
   * Reset attempts for an identifier
   * @param identifier - Unique identifier to reset
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining attempts for an identifier
   * @param identifier - Unique identifier
   * @returns Number of remaining attempts
   */
  getRemainingAttempts(identifier: string): number {
    const attempts = this.attempts.get(identifier) || [];
    const now = Date.now();
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxAttempts - validAttempts.length);
  }
}

/**
 * Secure string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function secureCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Validate and sanitize URL to prevent open redirects
 * @param url - URL to validate
 * @param allowedDomains - Array of allowed domains
 * @returns Sanitized URL or null if invalid
 */
export function validateUrl(url: string, allowedDomains: string[] = []): string | null {
  if (typeof url !== 'string') {
    return null;
  }
  
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }
    
    // Check against allowed domains if provided
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => {
        return parsedUrl.hostname === domain || 
               parsedUrl.hostname.endsWith('.' + domain);
      });
      
      if (!isAllowed) {
        return null;
      }
    }
    
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

/**
 * Content Security Policy helper
 */
export const CSP_DIRECTIVES = {
  DEFAULT: "default-src 'self'",
  SCRIPT: "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Consider removing unsafe-* in production
  STYLE: "style-src 'self' 'unsafe-inline'",
  IMG: "img-src 'self' data: https:",
  FONT: "font-src 'self' https:",
  CONNECT: "connect-src 'self' https:",
  FRAME: "frame-src 'none'",
  OBJECT: "object-src 'none'",
  BASE: "base-uri 'self'",
  FORM: "form-action 'self'",
};

/**
 * Generate CSP header value
 * @param directives - Custom directives to override defaults
 * @returns CSP header value
 */
export function generateCSP(directives: Partial<typeof CSP_DIRECTIVES> = {}): string {
  const finalDirectives = { ...CSP_DIRECTIVES, ...directives };
  return Object.values(finalDirectives).join('; ');
} 