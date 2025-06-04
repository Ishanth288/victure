import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, OptimizedQuery } from '@/integrations/supabase/client';

interface DashboardData {
  totalRevenue: number;
  totalInventoryValue: number;
  totalPrescriptionsToday: number;
  lowStockItems: number;
  isLoading: boolean;
  lastUpdated: Date;
  connectionStatus: 'connected' | 'disconnected' | 'slow';
  loadingProgress: number;
}

const CACHE_TTL = 180000; // 3 minutes
const PARALLEL_LOADING_TIMEOUT = 5000; // 5 seconds

export function useDashboardData(): DashboardData {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'slow'>('connected');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalInventoryValue: 0,
    totalPrescriptionsToday: 0,
    lowStockItems: 0
  });

  const mountedRef = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  // Get current user
  const getCurrentUser = useCallback(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }, []);

  // Parallel data fetching with progress tracking
  const fetchAllDashboardData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setIsLoading(true);
      setLoadingProgress(10);
      
      const user = await getCurrentUser();
      const userId = user.id;
      
      setLoadingProgress(20);

      // Parallel queries with individual caching
      const queries = [
        // Revenue query
        OptimizedQuery.execute(
          () => supabase
            .from('bills')
            .select('total_amount')
            .eq('user_id', userId),
          {
            cacheKey: `revenue_${userId}`,
            cacheTTL: CACHE_TTL,
            timeout: 4000,
            operation: 'Revenue Query'
          }
        ),
        
        // Inventory query  
        OptimizedQuery.execute(
          () => supabase
            .from('inventory')
            .select('quantity, unit_cost, reorder_point')
            .eq('user_id', userId),
          {
            cacheKey: `inventory_stats_${userId}`,
            cacheTTL: CACHE_TTL,
            timeout: 4000,
            operation: 'Inventory Stats Query'
          }
        ),
        
        // Prescriptions query
        OptimizedQuery.execute(
          () => supabase
            .from('prescriptions')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', new Date().toISOString().split('T')[0]),
          {
            cacheKey: `prescriptions_today_${userId}_${new Date().toISOString().split('T')[0]}`,
            cacheTTL: 300000, // 5 minutes for today's data
            timeout: 4000,
            operation: 'Prescriptions Today Query'
          }
        )
      ];

      setLoadingProgress(40);

      // Execute all queries in parallel
      const startTime = Date.now();
      const results = await Promise.allSettled(queries);
      const queryDuration = Date.now() - startTime;

      setLoadingProgress(70);

      // Process results
      const [revenueResult, inventoryResult, prescriptionsResult] = results;
      
      let totalRevenue = 0;
      let totalInventoryValue = 0;
      let lowStockItems = 0;
      let totalPrescriptionsToday = 0;

      // Process revenue data
      if (revenueResult.status === 'fulfilled' && revenueResult.value.data) {
        const billsData = revenueResult.value.data as Array<{ total_amount: number }>;
        totalRevenue = billsData.reduce(
          (sum: number, bill) => sum + (Number(bill.total_amount) || 0),
          0
        );
      }

      // Process inventory data
      if (inventoryResult.status === 'fulfilled' && inventoryResult.value.data) {
        const inventoryItems = inventoryResult.value.data as Array<{ 
          quantity: number; 
          unit_cost: number; 
          reorder_point: number; 
        }>;
        
        totalInventoryValue = inventoryItems.reduce(
          (sum: number, item) => sum + ((Number(item.unit_cost) || 0) * (Number(item.quantity) || 0)),
          0
        );
        
        lowStockItems = inventoryItems.filter(
          (item) => (Number(item.quantity) || 0) <= (Number(item.reorder_point) || 10)
        ).length;
      }

      // Process prescriptions data
      if (prescriptionsResult.status === 'fulfilled' && prescriptionsResult.value.data) {
        const prescriptionsData = prescriptionsResult.value.data as Array<{ id: string }>;
        totalPrescriptionsToday = prescriptionsData.length;
      }

      setLoadingProgress(90);

      // Update state immediately and ensure loading completes
      if (mountedRef.current) {
        setDashboardData({
          totalRevenue,
          totalInventoryValue,
          totalPrescriptionsToday,
          lowStockItems
        });

        setLastUpdated(new Date());
        
        // Determine connection quality
        if (queryDuration < 2000) {
          setConnectionStatus('connected');
        } else if (queryDuration < 5000) {
          setConnectionStatus('slow');
        } else {
          setConnectionStatus('disconnected');
        }

        // Complete loading immediately
        setLoadingProgress(100);
        setIsLoading(false);

        console.log(`📊 Dashboard data loaded in ${queryDuration}ms - Status: ${
          queryDuration < 2000 ? 'connected' : queryDuration < 5000 ? 'slow' : 'disconnected'
        }`, {
          totalRevenue,
          totalInventoryValue,
          totalPrescriptionsToday,
          lowStockItems
        });
      }

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      
      if (mountedRef.current) {
        setConnectionStatus('disconnected');
        
        // Don't show error if we have cached data
        const cacheStats = OptimizedQuery.getCacheStats();
        if (cacheStats.size === 0) {
          console.warn('No cached data available, showing error state');
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setLoadingProgress(100);
      }
    }
  }, [getCurrentUser]);

  // Initialize dashboard data
  useEffect(() => {
    if (hasInitialized.current) return;

    hasInitialized.current = true;
    
    // Set up loading timeout with proper cleanup
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading && mountedRef.current) {
        console.warn('⚠️ Dashboard loading timeout - forcing completion');
        setIsLoading(false);
        setConnectionStatus('slow');
        setLoadingProgress(100);
      }
    }, PARALLEL_LOADING_TIMEOUT);

    // Start fetching data
    fetchAllDashboardData().finally(() => {
      // Clear timeout once data fetching is complete
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    });

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [fetchAllDashboardData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!isLoading && mountedRef.current) {
        console.log('🔄 Auto-refreshing dashboard data');
        
        // Clear cache to get fresh data
        const user = getCurrentUser().then(user => {
          OptimizedQuery.clearCache(`revenue_${user.id}`);
          OptimizedQuery.clearCache(`inventory_stats_${user.id}`);
          OptimizedQuery.clearCache(`prescriptions_today_${user.id}`);
        });
        
        fetchAllDashboardData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [isLoading, fetchAllDashboardData, getCurrentUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...dashboardData,
    isLoading,
    lastUpdated,
    connectionStatus,
    loadingProgress
  };
}

// Utility function to refresh dashboard data
export function refreshAllDashboardData(): void {
  // Clear all dashboard-related cache
  OptimizedQuery.clearCache('revenue_');
  OptimizedQuery.clearCache('inventory_stats_');
  OptimizedQuery.clearCache('prescriptions_today_');
  console.log('🔄 Dashboard cache cleared, data will refresh on next load');
}

// Utility function to get dashboard cache info
export function getDashboardCacheInfo(): { 
  hasCachedData: boolean; 
  cacheSize: number;
  keys: string[];
} {
  const cacheStats = OptimizedQuery.getCacheStats();
  const dashboardKeys = cacheStats.keys.filter(key => 
    key.includes('revenue_') || 
    key.includes('inventory_stats_') || 
    key.includes('prescriptions_today_')
  );
  
  return { 
    hasCachedData: dashboardKeys.length > 0, 
    cacheSize: cacheStats.size,
    keys: dashboardKeys
  };
} 