
import { supabase } from "@/integrations/supabase/client";
import { checkSupabaseConnection } from "./supabaseErrorHandling";
import { toast } from "@/hooks/use-toast";
import { CURRENT_CONFIG } from './performanceConfig';
import { supabaseCircuitBreaker, isCircuitHealthy } from './circuitBreaker';
import { globalMemoryManager } from './memoryManager';
import { globalCache } from './smartCache';

let isMonitoringActive = false;

/**
 * Initialize application monitoring and connection checks
 * This helps ensure stability during preview and deployment
 */
export function initializeAppMonitoring(): void {
  if (isMonitoringActive) {
    if (CURRENT_CONFIG.enableVerboseLogging) {
      if (import.meta.env.VITE_DEBUG_LOGS) console.log('Monitoring already active');
    }
    return;
  }

  isMonitoringActive = true;
  if (CURRENT_CONFIG.enableVerboseLogging) {
    if (import.meta.env.VITE_DEBUG_LOGS) console.log('🔍 Initializing app monitoring...');
  }

  // Start periodic connection checks with optimized interval
  startConnectionMonitoring();

  // Listen for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Register cleanup for event listeners
    globalMemoryManager.register(
      'monitoring-online-listener',
      'listener',
      () => window.removeEventListener('online', handleOnline),
      'Online event listener'
    );
    
    globalMemoryManager.register(
      'monitoring-offline-listener', 
      'listener',
      () => window.removeEventListener('offline', handleOffline),
      'Offline event listener'
    );
  }

  // Initialize real-time subscriptions with error handling
  initializeRealTimeSubscriptions();
}

/**
 * Start connection monitoring with circuit breaker pattern
 */
function startConnectionMonitoring(): void {
  // Enable realtime functionality for needed tables
  enableRealtimeForTables();
  
  // Check connection on app start
  checkSupabaseConnection()
    .then(connected => {
      if (connected) {
        if (CURRENT_CONFIG.enableVerboseLogging) {
          if (import.meta.env.VITE_DEBUG_LOGS) console.log('Supabase connection established successfully');
        }
      } else {
        if (import.meta.env.VITE_DEBUG_LOGS) console.warn('Failed to establish Supabase connection on startup');
        toast({
          title: "Connection warning",
          description: "Connection to database was temporarily lost, trying to reconnect",
          variant: "default"
        });
      }
    });

  // Set up periodic connection checks with circuit breaker
  const checkInterval = setInterval(() => {
    if (!isCircuitHealthy(supabaseCircuitBreaker)) {
      if (CURRENT_CONFIG.enableVerboseLogging) {
        if (import.meta.env.VITE_DEBUG_LOGS) console.log('Circuit breaker open, skipping connection check');
      }
      return;
    }

    supabaseCircuitBreaker.execute(() => checkSupabaseConnection())
      .then(connected => {
        if (!connected && CURRENT_CONFIG.enableVerboseLogging) {
          if (import.meta.env.VITE_DEBUG_LOGS) console.warn('Periodic connection check failed, attempting recovery...');
        }
      })
      .catch(error => {
        if (CURRENT_CONFIG.enableVerboseLogging) {
          if (import.meta.env.VITE_DEBUG_LOGS) console.error('Connection check failed:', error);
        }
      });
  }, CURRENT_CONFIG.healthCheckInterval);

  // Register cleanup for interval
  globalMemoryManager.register(
    'connection-check-interval',
    'interval',
    () => clearInterval(checkInterval),
    'Connection monitoring interval'
  );
}

/**
 * Initialize real-time subscriptions with proper error handling
 */
function initializeRealTimeSubscriptions(): void {
  if (!isCircuitHealthy(supabaseCircuitBreaker)) {
    if (CURRENT_CONFIG.enableVerboseLogging) {
      if (import.meta.env.VITE_DEBUG_LOGS) console.log('Circuit breaker open, skipping realtime initialization');
    }
    return;
  }

  enableRealtimeForTables();
}

/**
 * Handle online event
 */
function handleOnline(): void {
  if (CURRENT_CONFIG.enableVerboseLogging) {
    if (import.meta.env.VITE_DEBUG_LOGS) console.log('🌐 Network connection restored');
  }
  
  // Reset circuit breaker if it was open due to network issues
  if (!isCircuitHealthy(supabaseCircuitBreaker)) {
    supabaseCircuitBreaker.reset();
  }
  
  // Re-check Supabase connection with circuit breaker
  supabaseCircuitBreaker.execute(() => checkSupabaseConnection())
    .then(connected => {
      if (connected && CURRENT_CONFIG.enableVerboseLogging) {
        if (import.meta.env.VITE_DEBUG_LOGS) console.log('✅ Supabase connection restored');
      } else if (!connected) {
        if (import.meta.env.VITE_DEBUG_LOGS) console.warn('❌ Supabase still not accessible despite network being online');
      }
    })
    .catch(error => {
      if (CURRENT_CONFIG.enableVerboseLogging) {
        if (import.meta.env.VITE_DEBUG_LOGS) console.error('Error checking connection after coming online:', error);
      }
    });
}

/**
 * Handle offline event
 */
function handleOffline(): void {
  if (CURRENT_CONFIG.enableVerboseLogging) {
    if (import.meta.env.VITE_DEBUG_LOGS) console.log('📴 Network connection lost');
  }
  
  // Show user notification about offline status
  toast({
    title: "Connection Lost",
    description: "You're currently offline. Some features may not work properly.",
    variant: "destructive"
  });
}

/**
 * Enable realtime for specific tables with optimized monitoring
 */
function enableRealtimeForTables(): void {
  if (CURRENT_CONFIG.enableVerboseLogging) {
    if (import.meta.env.VITE_DEBUG_LOGS) console.log('🔄 Enabling realtime for critical tables...');
  }
  
  // Only subscribe to critical table changes to reduce overhead
  const criticalTables = ['bills', 'inventory'];
  
  criticalTables.forEach(tableName => {
    const channelName = `${tableName}-changes`;
    
    try {
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: tableName,
            // Only listen to INSERT and UPDATE to reduce noise
            filter: 'event=in.(INSERT,UPDATE)'
          },
          (payload) => {
            if (CURRENT_CONFIG.enableVerboseLogging) {
              if (import.meta.env.VITE_DEBUG_LOGS) console.log(`${tableName} table changed:`, payload.eventType);
            }
            
            // Invalidate related cache entries
            if (tableName === 'bills') {
              // Invalidate sales and revenue caches
              globalCache.invalidatePattern('sales-');
              globalCache.invalidatePattern('revenue-');
            } else if (tableName === 'inventory') {
              // Invalidate inventory-related caches
              globalCache.invalidatePattern('inventory-');
              globalCache.invalidatePattern('product-');
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' && CURRENT_CONFIG.enableVerboseLogging) {
            console.log(`✅ ${tableName} realtime subscription active`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ ${tableName} realtime subscription failed`);
          }
        });
      
      // Register cleanup for the channel
      globalMemoryManager.register(
        `realtime-${tableName}`,
        'subscription',
        () => {
          channel.unsubscribe();
          if (CURRENT_CONFIG.enableVerboseLogging) {
            console.log(`🔌 Unsubscribed from ${tableName} realtime`);
          }
        },
        `Realtime subscription for ${tableName}`
      );
      
    } catch (error) {
      console.error(`Failed to setup realtime for ${tableName}:`, error);
    }
  });
}

/**
 * Check if Supabase is available
 * @returns Promise<boolean> - true if available, false otherwise
 */
export async function checkSupabaseAvailability(): Promise<boolean> {
  try {
    if (!isCircuitHealthy(supabaseCircuitBreaker)) {
      return false;
    }
    
    const result = await supabaseCircuitBreaker.execute(async () => {
      const { data, error } = await supabase
        .from('bills')
        .select('count')
        .limit(1);
      
      return !error;
    });
    
    return result;
  } catch (error) {
    if (CURRENT_CONFIG.enableVerboseLogging) {
      console.error('Supabase availability check failed:', error);
    }
    return false;
  }
}

/**
 * Stop monitoring and cleanup all resources
 */
export function stopMonitoring(): void {
  if (!isMonitoringActive) {
    return;
  }
  
  if (CURRENT_CONFIG.enableVerboseLogging) {
    console.log('🛑 Stopping app monitoring...');
  }
  
  isMonitoringActive = false;
  
  // Cleanup all registered resources
  globalMemoryManager.cleanup();
  
  // Remove event listeners if in browser
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }
  
  if (CURRENT_CONFIG.enableVerboseLogging) {
    console.log('✅ App monitoring stopped and resources cleaned up');
  }
}

/**
 * Get monitoring statistics
 */
export function getMonitoringStats(): {
  isActive: boolean;
  circuitStatus: any;
  memoryStats: any;
  cacheStats: any;
} {
  return {
    isActive: isMonitoringActive,
    circuitStatus: supabaseCircuitBreaker.getStats(),
    memoryStats: globalMemoryManager.getStats(),
    cacheStats: globalCache.getStats()
  };
}
