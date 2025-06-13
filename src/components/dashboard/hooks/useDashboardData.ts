
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  // Simplified data fetching without OptimizedQuery
  const fetchAllDashboardData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setIsLoading(true);
      setLoadingProgress(10);
      
      const user = await getCurrentUser();
      const userId = user.id;
      
      setLoadingProgress(20);

      const startTime = Date.now();
      
      // Execute queries in parallel with basic error handling
      const [revenueResult, inventoryResult, prescriptionsResult] = await Promise.allSettled([
        supabase.from('bills').select('total_amount').eq('user_id', userId),
        supabase.from('inventory').select('quantity, unit_cost, reorder_point').eq('user_id', userId),
        supabase.from('prescriptions').select('id').eq('user_id', userId).gte('date', new Date().toISOString().split('T')[0])
      ]);

      setLoadingProgress(70);

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
        const prescriptionsData = prescriptionsResult.value.data as Array<{ id: number }>;
        totalPrescriptionsToday = prescriptionsData.length;
      }

      setLoadingProgress(90);

      const queryDuration = Date.now() - startTime;

      // Update state
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

        setLoadingProgress(100);
        setIsLoading(false);

        console.log(`📊 Dashboard data loaded in ${queryDuration}ms`);
      }

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      
      if (mountedRef.current) {
        setConnectionStatus('disconnected');
        setIsLoading(false);
        setLoadingProgress(100);
      }
    }
  }, [getCurrentUser]);

  // Initialize dashboard data
  useEffect(() => {
    if (hasInitialized.current) return;

    hasInitialized.current = true;
    
    // Set up loading timeout
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading && mountedRef.current) {
        console.warn('⚠️ Dashboard loading timeout - forcing completion');
        setIsLoading(false);
        setConnectionStatus('slow');
        setLoadingProgress(100);
      }
    }, PARALLEL_LOADING_TIMEOUT);

    fetchAllDashboardData().finally(() => {
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
