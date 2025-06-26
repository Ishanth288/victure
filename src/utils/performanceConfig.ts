/**
 * Performance Configuration for Supabase Connections
 * Environment-specific optimizations for connection timeouts, retries, and monitoring
 */

export interface PerformanceConfig {
  connectionTimeout: number;
  queryTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
  enableVerboseLogging: boolean;
  enableCircuitBreaker: boolean;
  cacheTimeout: number;
  maxConcurrentQueries: number;
  enableProgressiveLoading: boolean;
}

const DEVELOPMENT_CONFIG: PerformanceConfig = {
  connectionTimeout: 1500,      // Faster failure detection in dev
  queryTimeout: 2000,           // Quick feedback during development
  retryAttempts: 1,             // Minimal retries to see issues quickly
  retryDelay: 500,              // Short delay between retries
  healthCheckInterval: 60000,   // Check every minute
  enableVerboseLogging: true,   // Detailed logs for debugging
  enableCircuitBreaker: true,   // Test circuit breaker behavior
  cacheTimeout: 10000,          // Short cache for rapid development
  maxConcurrentQueries: 5,      // Limit concurrent queries
  enableProgressiveLoading: true
};

const PRODUCTION_CONFIG: PerformanceConfig = {
  connectionTimeout: 3000,      // More tolerant of network variations
  queryTimeout: 5000,           // Allow more time for complex queries
  retryAttempts: 2,             // More retries for reliability
  retryDelay: 1000,             // Longer delay to avoid overwhelming server
  healthCheckInterval: 120000,  // Check every 2 minutes
  enableVerboseLogging: false,  // Minimal logging for performance
  enableCircuitBreaker: true,   // Essential for production stability
  cacheTimeout: 30000,          // Longer cache for better performance
  maxConcurrentQueries: 10,     // Higher limit for production load
  enableProgressiveLoading: true
};

const TESTING_CONFIG: PerformanceConfig = {
  connectionTimeout: 1000,      // Very fast timeouts for testing
  queryTimeout: 1500,           // Quick test execution
  retryAttempts: 0,             // No retries to see failures immediately
  retryDelay: 100,              // Minimal delay
  healthCheckInterval: 30000,   // Frequent checks during testing
  enableVerboseLogging: true,   // Full logging for test analysis
  enableCircuitBreaker: false,  // Disable to test actual failures
  cacheTimeout: 5000,           // Short cache for test isolation
  maxConcurrentQueries: 3,      // Limited for controlled testing
  enableProgressiveLoading: false // Disable for predictable test behavior
};

// Detect environment
function getEnvironment(): 'development' | 'production' | 'testing' {
  if (typeof window !== 'undefined') {
    // Browser environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'development';
    }
    if (window.location.hostname.includes('test') || window.location.hostname.includes('staging')) {
      return 'testing';
    }
    return 'production';
  }
  
  // Node environment
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'test') return 'testing';
  if (nodeEnv === 'development') return 'development';
  return 'production';
}

// Get configuration based on environment
export function getPerformanceConfig(): PerformanceConfig {
  const env = getEnvironment();
  
  switch (env) {
    case 'development':
      return { ...DEVELOPMENT_CONFIG };
    case 'testing':
      return { ...TESTING_CONFIG };
    case 'production':
    default:
      return { ...PRODUCTION_CONFIG };
  }
}

// Override specific config values (useful for A/B testing or emergency adjustments)
export function createCustomConfig(overrides: Partial<PerformanceConfig>): PerformanceConfig {
  const baseConfig = getPerformanceConfig();
  return { ...baseConfig, ...overrides };
}

// Validate configuration values
export function validateConfig(config: PerformanceConfig): boolean {
  const errors: string[] = [];
  
  if (config.connectionTimeout < 500 || config.connectionTimeout > 10000) {
    errors.push('connectionTimeout should be between 500ms and 10000ms');
  }
  
  if (config.queryTimeout < config.connectionTimeout) {
    errors.push('queryTimeout should be >= connectionTimeout');
  }
  
  if (config.retryAttempts < 0 || config.retryAttempts > 5) {
    errors.push('retryAttempts should be between 0 and 5');
  }
  
  if (config.retryDelay < 100 || config.retryDelay > 5000) {
    errors.push('retryDelay should be between 100ms and 5000ms');
  }
  
  if (config.healthCheckInterval < 10000 || config.healthCheckInterval > 300000) {
    errors.push('healthCheckInterval should be between 10s and 5min');
  }
  
  if (config.cacheTimeout < 1000 || config.cacheTimeout > 300000) {
    errors.push('cacheTimeout should be between 1s and 5min');
  }
  
  if (config.maxConcurrentQueries < 1 || config.maxConcurrentQueries > 50) {
    errors.push('maxConcurrentQueries should be between 1 and 50');
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation errors:', errors);
    return false;
  }
  
  return true;
}

// Get current environment info
export function getEnvironmentInfo() {
  const env = getEnvironment();
  const config = getPerformanceConfig();
  
  return {
    environment: env,
    config,
    isValid: validateConfig(config),
    timestamp: new Date().toISOString()
  };
}

// Export current configuration
export const CURRENT_CONFIG = getPerformanceConfig();

// Log configuration on import (only in development)
if (getEnvironment() === 'development') {
  console.log('🔧 Performance Configuration Loaded:', getEnvironmentInfo());
}