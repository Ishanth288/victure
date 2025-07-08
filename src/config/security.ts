/**
 * Security Configuration
 * Priority 2 Security Implementation
 * Centralizes all security settings and policies
 */

// Rate limiting configuration
export const RATE_LIMITS = {
  // Authentication limits
  LOGIN_ATTEMPTS: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  },
  
  // API call limits
  API_CALLS: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000 // 5 minutes
  },
  
  // Data creation limits
  PATIENT_CREATION: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000 // 1 hour
  },
  
  PRESCRIPTION_CREATION: {
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  },
  
  // Admin actions
  ADMIN_ACTIONS: {
    maxAttempts: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000 // 1 hour
  },
  
  // File uploads
  FILE_UPLOAD: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000 // 1 hour
  }
} as const;

// Input validation rules
export const VALIDATION_RULES = {
  // Patient data validation
  PATIENT: {
    name: {
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-\.]+$/,
      required: true
    },
    phone: {
      minLength: 10,
      maxLength: 15,
      pattern: /^[\d\s\-\+\(\)]+$/,
      required: true
    },
    email: {
      maxLength: 255,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      required: false
    },
    age: {
      min: 0,
      max: 150,
      required: true
    },
    address: {
      maxLength: 500,
      required: false
    }
  },
  
  // Medicine data validation
  MEDICINE: {
    name: {
      minLength: 2,
      maxLength: 200,
      required: true
    },
    batchNumber: {
      minLength: 3,
      maxLength: 50,
      pattern: /^[A-Za-z0-9\-_]+$/,
      required: true
    },
    price: {
      min: 0,
      max: 999999.99,
      required: true
    },
    quantity: {
      min: 0,
      max: 999999,
      required: true
    }
  },
  
  // Prescription data validation
  PRESCRIPTION: {
    prescriptionNumber: {
      minLength: 5,
      maxLength: 50,
      pattern: /^[A-Za-z0-9\-_]+$/,
      required: true
    },
    notes: {
      maxLength: 1000,
      required: false
    },
    dosage: {
      maxLength: 100,
      required: true
    },
    frequency: {
      maxLength: 100,
      required: true
    }
  },
  
  // User authentication validation
  AUTH: {
    email: {
      maxLength: 255,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      required: true
    },
    password: {
      minLength: 8,
      maxLength: 128,
      required: true,
      complexity: {
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      }
    }
  }
} as const;

// Security event types and severity levels
export const SECURITY_EVENTS = {
  // Authentication events
  LOGIN_SUCCESS: { severity: 'low', category: 'authentication' },
  LOGIN_FAILURE: { severity: 'medium', category: 'authentication' },
  LOGIN_BLOCKED: { severity: 'high', category: 'authentication' },
  PASSWORD_CHANGE: { severity: 'medium', category: 'authentication' },
  
  // Authorization events
  UNAUTHORIZED_ACCESS: { severity: 'high', category: 'authorization' },
  PRIVILEGE_ESCALATION: { severity: 'critical', category: 'authorization' },
  ADMIN_ACCESS: { severity: 'medium', category: 'authorization' },
  
  // Input validation events
  SUSPICIOUS_INPUT_DETECTED: { severity: 'high', category: 'input_validation' },
  INPUT_SANITIZED: { severity: 'low', category: 'input_validation' },
  INPUT_SANITIZATION_ERROR: { severity: 'medium', category: 'input_validation' },
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED: { severity: 'medium', category: 'rate_limiting' },
  RATE_LIMIT_BLOCKED: { severity: 'high', category: 'rate_limiting' },
  
  // Data access events
  SENSITIVE_DATA_ACCESS: { severity: 'medium', category: 'data_access' },
  BULK_DATA_EXPORT: { severity: 'high', category: 'data_access' },
  UNAUTHORIZED_DATA_MODIFICATION: { severity: 'critical', category: 'data_access' },
  
  // System events
  SECURITY_DASHBOARD_ERROR: { severity: 'medium', category: 'system' },
  SUSPICIOUS_ACTIVITY_REVIEWED: { severity: 'low', category: 'system' },
  SECURITY_POLICY_VIOLATION: { severity: 'high', category: 'system' }
} as const;

// Suspicious activity detection rules
export const SUSPICIOUS_ACTIVITY_RULES = {
  // Multiple failed login attempts
  MULTIPLE_LOGIN_FAILURES: {
    threshold: 3,
    timeWindow: 10 * 60 * 1000, // 10 minutes
    riskScore: 60
  },
  
  // Rapid API calls
  RAPID_API_CALLS: {
    threshold: 50,
    timeWindow: 60 * 1000, // 1 minute
    riskScore: 40
  },
  
  // Unusual access patterns
  UNUSUAL_ACCESS_PATTERN: {
    threshold: 5, // Different endpoints in short time
    timeWindow: 5 * 60 * 1000, // 5 minutes
    riskScore: 30
  },
  
  // Bulk data operations
  BULK_DATA_OPERATIONS: {
    threshold: 100, // Records accessed
    timeWindow: 60 * 60 * 1000, // 1 hour
    riskScore: 70
  },
  
  // Admin actions from unusual locations
  ADMIN_UNUSUAL_LOCATION: {
    riskScore: 80
  },
  
  // Input validation violations
  INPUT_VALIDATION_VIOLATIONS: {
    threshold: 5,
    timeWindow: 30 * 60 * 1000, // 30 minutes
    riskScore: 50
  }
} as const;

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for some React functionality
    'https://cdn.jsdelivr.net',
    'https://unpkg.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:'
  ],
  'connect-src': [
    "'self'",
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co',
    'https://api.stripe.com'
  ],
  'frame-src': [
    "'none'"
  ],
  'object-src': [
    "'none'"
  ],
  'base-uri': [
    "'self'"
  ],
  'form-action': [
    "'self'"
  ]
} as const;

// CORS configuration
export const CORS_CONFIG = {
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://your-production-domain.com' // Replace with actual domain
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
} as const;

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
} as const;

// File upload security configuration
export const FILE_UPLOAD_CONFIG = {
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'text/csv'
  ],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  scanForMalware: true,
  quarantineSuspicious: true
} as const;

// Session security configuration
export const SESSION_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  renewThreshold: 60 * 60 * 1000, // 1 hour before expiry
  maxConcurrentSessions: 3,
  requireReauthForSensitive: true,
  logoutOnSuspiciousActivity: true
} as const;

// Database security configuration
export const DATABASE_SECURITY = {
  enableRLS: true,
  auditLogging: true,
  encryptSensitiveFields: true,
  backupEncryption: true,
  connectionPooling: {
    min: 2,
    max: 10,
    idleTimeoutMs: 30000
  }
} as const;

// Monitoring and alerting configuration
export const MONITORING_CONFIG = {
  realTimeAlerts: {
    criticalEvents: true,
    highRiskActivities: true,
    systemErrors: true
  },
  dashboardRefreshInterval: 30000, // 30 seconds
  logRetentionDays: 90,
  alertChannels: {
    email: true,
    webhook: false,
    sms: false
  },
  thresholds: {
    failedLoginsPerHour: 10,
    suspiciousActivitiesPerHour: 5,
    errorRatePercent: 5
  }
} as const;

// Export utility functions
export const getSecurityEventSeverity = (eventType: keyof typeof SECURITY_EVENTS): string => {
  return SECURITY_EVENTS[eventType]?.severity || 'low';
};

export const getSecurityEventCategory = (eventType: keyof typeof SECURITY_EVENTS): string => {
  return SECURITY_EVENTS[eventType]?.category || 'system';
};

export const isHighRiskEvent = (eventType: keyof typeof SECURITY_EVENTS): boolean => {
  const severity = getSecurityEventSeverity(eventType);
  return severity === 'high' || severity === 'critical';
};

export const generateCSPHeader = (): string => {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

export const isAllowedOrigin = (origin: string): boolean => {
  return CORS_CONFIG.allowedOrigins.includes(origin);
};

export const getRateLimitConfig = (action: keyof typeof RATE_LIMITS) => {
  return RATE_LIMITS[action];
};

export const getValidationRules = (entity: keyof typeof VALIDATION_RULES) => {
  return VALIDATION_RULES[entity];
};

export const getSuspiciousActivityRule = (ruleType: keyof typeof SUSPICIOUS_ACTIVITY_RULES) => {
  return SUSPICIOUS_ACTIVITY_RULES[ruleType];
};