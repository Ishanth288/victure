// Performance monitoring utilities for inventory insights

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface QueryPerformanceData {
  queryName: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
  recordCount?: number;
  timestamp: number;
}

class InventoryPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private queryMetrics: QueryPerformanceData[] = [];
  private readonly maxMetrics = 100; // Keep last 100 metrics
  private readonly slowQueryThreshold = 2000; // 2 seconds

  // Start timing a performance metric
  startTiming(name: string): () => void {
    const startTime = performance.now();
    
    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.addMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata
      });
      
      // Log slow operations in development
      if (process.env.NODE_ENV === 'development' && duration > this.slowQueryThreshold) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata);
      }
    };
  }

  // Track database query performance
  async trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    let success = false;
    let errorMessage: string | undefined;
    let result: T;
    
    try {
      result = await queryFn();
      success = true;
      return result;
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      
      this.addQueryMetric({
        queryName,
        duration,
        success,
        errorMessage,
        recordCount: Array.isArray(result) ? result.length : undefined,
        timestamp: Date.now()
      });
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        const status = success ? '✅' : '❌';
        console.log(`${status} Query: ${queryName} (${duration.toFixed(2)}ms)`, metadata);
        
        if (duration > this.slowQueryThreshold) {
          console.warn(`🐌 Slow query detected: ${queryName}`);
        }
      }
    }
  }

  // Add a performance metric
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Add a query performance metric
  private addQueryMetric(metric: QueryPerformanceData): void {
    this.queryMetrics.push(metric);
    
    // Keep only the last N metrics
    if (this.queryMetrics.length > this.maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetrics);
    }
  }

  // Get performance statistics
  getPerformanceStats() {
    const recentMetrics = this.metrics.slice(-20); // Last 20 metrics
    const recentQueries = this.queryMetrics.slice(-20);
    
    const avgDuration = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : 0;
    
    const slowQueries = recentQueries.filter(q => q.duration > this.slowQueryThreshold);
    const failedQueries = recentQueries.filter(q => !q.success);
    
    return {
      averageDuration: Math.round(avgDuration),
      slowQueriesCount: slowQueries.length,
      failedQueriesCount: failedQueries.length,
      totalQueries: recentQueries.length,
      successRate: recentQueries.length > 0 
        ? Math.round((recentQueries.filter(q => q.success).length / recentQueries.length) * 100)
        : 100
    };
  }

  // Get detailed query metrics
  getQueryMetrics() {
    return this.queryMetrics.slice(-20).map(metric => ({
      ...metric,
      formattedDuration: `${metric.duration.toFixed(2)}ms`,
      isSlow: metric.duration > this.slowQueryThreshold
    }));
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    this.queryMetrics = [];
  }

  // Export metrics for external monitoring
  exportMetrics() {
    return {
      performanceMetrics: this.metrics,
      queryMetrics: this.queryMetrics,
      stats: this.getPerformanceStats(),
      timestamp: Date.now()
    };
  }
}

// Singleton instance
export const inventoryPerformanceMonitor = new InventoryPerformanceMonitor();

// React hook for accessing performance data
export const useInventoryPerformance = () => {
  return {
    trackQuery: inventoryPerformanceMonitor.trackQuery.bind(inventoryPerformanceMonitor),
    startTiming: inventoryPerformanceMonitor.startTiming.bind(inventoryPerformanceMonitor),
    getStats: inventoryPerformanceMonitor.getPerformanceStats.bind(inventoryPerformanceMonitor),
    getMetrics: inventoryPerformanceMonitor.getQueryMetrics.bind(inventoryPerformanceMonitor),
    clearMetrics: inventoryPerformanceMonitor.clearMetrics.bind(inventoryPerformanceMonitor)
  };
};