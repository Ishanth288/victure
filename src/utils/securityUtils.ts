
/**
 * Security utility functions for enhancing web application security
 */

/**
 * Sanitizes user input to prevent XSS attacks
 * This is a basic implementation - consider using a library like DOMPurify for production
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format with a strong regex pattern
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Check if a password meets strong security requirements
 */
export function isStrongPassword(password: string): { 
  isValid: boolean; 
  requirements: {
    minLength: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    hasUppercase: boolean;
  }
} {
  const minLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  
  return {
    isValid: minLength && hasNumber && hasSpecialChar && hasUppercase,
    requirements: {
      minLength,
      hasNumber,
      hasSpecialChar,
      hasUppercase
    }
  };
}

/**
 * Implements a basic rate limiting function based on localStorage
 * For production, use a server-side rate limiting solution
 */
export function checkRateLimit(
  action: string, 
  maxAttempts: number = 5, 
  timeWindowMs: number = 60000
): boolean {
  const now = Date.now();
  const storageKey = `rateLimit_${action}`;
  
  try {
    const storedData = localStorage.getItem(storageKey);
    let attempts: { timestamp: number }[] = storedData ? JSON.parse(storedData) : [];
    
    // Filter out attempts outside the time window
    attempts = attempts.filter(attempt => now - attempt.timestamp < timeWindowMs);
    
    // If under the limit, add the new attempt
    if (attempts.length < maxAttempts) {
      attempts.push({ timestamp: now });
      localStorage.setItem(storageKey, JSON.stringify(attempts));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Rate limiting error:", error);
    return true; // Allow the action in case of an error
  }
}

/**
 * Generate a secure random token (for CSRF protection, etc.)
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
