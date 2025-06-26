/**
 * Circuit Breaker Pattern Implementation for Supabase Connections
 * Prevents cascading failures and manages connection state intelligently
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, failing fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening circuit
  recoveryTimeout: number;     // Time to wait before attempting recovery (ms)
  monitoringPeriod: number;    // Time window for failure counting (ms)
  successThreshold: number;    // Successes needed in half-open to close circuit
}

export class ConnectionCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 3,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      successThreshold: 2,
      ...config
    };
  }

  async execute<T>(operation: () => Promise<T>, context: string = 'operation'): Promise<T> {
    // Check if circuit is open and if we should attempt recovery
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker is OPEN for ${context}. Next attempt in ${Math.ceil((this.nextAttemptTime - Date.now()) / 1000)}s`);
      }
      // Move to half-open state to test recovery
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      console.log(`🔄 Circuit breaker moving to HALF_OPEN state for ${context}`);
    }

    try {
      const result = await operation();
      this.onSuccess(context);
      return result;
    } catch (error) {
      this.onFailure(context, error);
      throw error;
    }
  }

  private onSuccess(context: string): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      console.log(`✅ Success in HALF_OPEN state for ${context} (${this.successCount}/${this.config.successThreshold})`);
      
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log(`🟢 Circuit breaker CLOSED for ${context} - service recovered`);
      }
    }
  }

  private onFailure(context: string, error: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    console.warn(`❌ Circuit breaker failure ${this.failureCount}/${this.config.failureThreshold} for ${context}:`, error?.message);

    if (this.state === CircuitState.HALF_OPEN) {
      // If we fail in half-open, go back to open
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
      console.log(`🔴 Circuit breaker back to OPEN state for ${context}`);
    } else if (this.failureCount >= this.config.failureThreshold) {
      // Open the circuit
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
      console.log(`🔴 Circuit breaker OPENED for ${context} - too many failures`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      isHealthy: this.state === CircuitState.CLOSED
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
    console.log('🔄 Circuit breaker reset to CLOSED state');
  }

  // Force open the circuit (useful for maintenance)
  forceOpen(duration: number = 60000): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + duration;
    console.log(`🔴 Circuit breaker forced OPEN for ${duration}ms`);
  }
}

// Global circuit breaker instances for different services
export const supabaseCircuitBreaker = new ConnectionCircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 30000,
  monitoringPeriod: 60000,
  successThreshold: 2
});

export const authCircuitBreaker = new ConnectionCircuitBreaker({
  failureThreshold: 2,
  recoveryTimeout: 15000,
  monitoringPeriod: 30000,
  successThreshold: 1
});

// Utility function to check if circuit breaker is healthy
export function isCircuitHealthy(circuitBreaker: ConnectionCircuitBreaker): boolean {
  return circuitBreaker.getState() === CircuitState.CLOSED;
}

// Utility function to get circuit breaker status for monitoring
export function getCircuitStatus() {
  return {
    supabase: supabaseCircuitBreaker.getStats(),
    auth: authCircuitBreaker.getStats()
  };
}