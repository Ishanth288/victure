/**
 * Password utility functions for password strength validation
 */

export interface PasswordStrengthResult {
  score: number;
  feedback: string[];
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
}

/**
 * Check password strength and provide feedback
 * @param password - The password to check
 * @returns PasswordStrengthResult with score, feedback, and requirements
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  if (typeof password !== 'string') {
    return {
      score: 0,
      feedback: ['Password must be a valid string'],
      isValid: false,
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

  const feedback: string[] = [];
  let score = 0;

  // Check each requirement and provide feedback
  if (!requirements.minLength) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!requirements.hasUppercase) {
    feedback.push('Add at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!requirements.hasLowercase) {
    feedback.push('Add at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!requirements.hasNumbers) {
    feedback.push('Add at least one number');
  } else {
    score += 1;
  }

  if (!requirements.hasSpecialChars) {
    feedback.push('Add at least one special character (!@#$%^&*(),.?":{}|<>)');
  } else {
    score += 1;
  }

  // Additional checks for very weak passwords
  if (password.length < 6) {
    feedback.push('Password is too short');
    score = Math.min(score, 1);
  }

  // Check for common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /(.)\1{2,}/, // Repeated characters
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    feedback.push('Avoid common patterns and repeated characters');
    score = Math.max(0, score - 1);
  }

  // Determine if password is valid (score >= 3 means at least 3 requirements met)
  const isValid = score >= 3 && requirements.minLength;

  // Provide positive feedback for strong passwords
  if (score >= 4 && feedback.length === 0) {
    feedback.push('Strong password!');
  } else if (score >= 3 && feedback.length <= 1) {
    feedback.push('Good password strength');
  }

  return {
    score,
    feedback,
    isValid,
    requirements,
  };
}

/**
 * Generate a secure password with specified criteria
 * @param length - Password length (minimum 8)
 * @param includeSymbols - Whether to include special characters
 * @returns Generated secure password
 */
export function generateSecurePassword(length: number = 12, includeSymbols: boolean = true): string {
  const minLength = Math.max(8, length);
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*(),.?":{}|<>';
  
  let charset = lowercase + uppercase + numbers;
  if (includeSymbols) {
    charset += symbols;
  }
  
  let password = '';
  
  // Ensure at least one character from each required set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }
  
  // Fill the rest randomly
  for (let i = password.length; i < minLength; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}