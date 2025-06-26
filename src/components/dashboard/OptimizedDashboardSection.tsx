/**
 * Example of an optimized dashboard section using progressive loading,
 * circuit breaker pattern, and smart caching
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, RefreshCw, TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { ConnectionErrorBoundary } from '../error/ConnectionErrorBoundary';
import { useProgressiveDataLoading, createSupabaseLoader } from '../../utils/progressiveLoader';
import { useMemoryManager } from '../../utils/memoryManager';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { CURRENT_CONFIG } from '../../utils/performanceConfig';
import { isCircuitHealthy, getCircuitStatus, supabaseCircuitBreaker } from '../../utils/circuitBreaker';

interface DashboardData {
  todaysSales: {
    total: number;
    count: number;
    growth: number;
  };
  inventoryAlerts: {
    lowStock: number;
    expiringSoon: number;
    outOfStock: number;
  };
  customerMetrics: {
    totalCustomers: number;
    newToday: number;
    repeatRate: number;
  };
  revenueData: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
  };
}

export function OptimizedDashboardSection() {
  const { state, addLoader, loadAll, getResult, abort } = useProgressiveDataLoading();
  const { register } = useMemoryManager();
  const [dashboardData, setDashboardData] = useState<Partial<DashboardData>>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Setup progressive loaders
  useEffect(() => {
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);
    const yesterday = subDays(today, 1);
    const startYesterday = startOfDay(yesterday);
    const endYesterday = endOfDay(yesterday);

    // Critical data - loads first (priority 0)
    addLoader(createSupabaseLoader(
      'todaysSales',
      async () => {
        const [todayResult, yesterdayResult] = await Promise.all([
          supabase
            .from('bills')
            .select('total_amount')
            .gte('created_at', startToday.toISOString())
            .lte('created_at', endToday.toISOString()),
          supabase
            .from('bills')
            .select('total_amount')
            .gte('created_at', startYesterday.toISOString())
            .lte('created_at', endYesterday.toISOString())
        ]);

        if (todayResult.error) throw todayResult.error;
        if (yesterdayResult.error) throw yesterdayResult.error;

        const todayTotal = todayResult.data?.reduce((sum, bill) => sum + (bill.total_amount || 0), 0) || 0;
        const yesterdayTotal = yesterdayResult.data?.reduce((sum, bill) => sum + (bill.total_amount || 0), 0) || 0;
        const growth = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;

        return {
          total: todayTotal,
          count: todayResult.data?.length || 0,
          growth
        };
      },
      { priority: 0, useCache: true, cacheTTL: 300000 } // 5 minutes cache
    ));

    // High priority data (priority 1)
    addLoader(createSupabaseLoader(
      'inventoryAlerts',
      async () => {
        const { data, error } = await supabase
          .from('inventory')
          .select('quantity, reorder_point, expiry_date')
          .not('expiry_date', 'is', null);

        if (error) throw error;

        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        let lowStock = 0;
        let expiringSoon = 0;
        let outOfStock = 0;

        data?.forEach(item => {
          if (item?.quantity === 0) {
            outOfStock++;
          } else if ((item?.quantity || 0) <= (item?.reorder_point || 0)) {
            lowStock++;
          }

          if (item?.expiry_date && new Date(item.expiry_date) <= thirtyDaysFromNow) {
            expiringSoon++;
          }
        });

        return { lowStock, expiringSoon, outOfStock };
      },
      { priority: 1, useCache: true, cacheTTL: 600000 } // 10 minutes cache
    ));

    // Medium priority data (priority 2)
    addLoader(createSupabaseLoader(
      'customerMetrics',
      async () => {
        const [allCustomers, todayCustomers] = await Promise.all([
          supabase
            .from('prescriptions')
            .select('patient_id, patient:patients(name)')
            .not('patient_id', 'is', null),
          supabase
            .from('prescriptions')
            .select('patient_id, patient:patients(name)')
            .gte('created_at', startToday.toISOString())
            .lte('created_at', endToday.toISOString())
            .not('patient_id', 'is', null)
        ]);

        if (allCustomers.error) throw allCustomers.error;
        if (todayCustomers.error) throw todayCustomers.error;

        const uniqueCustomers = new Set(allCustomers.data?.map((p: any) => p.patient?.name).filter(Boolean));
        const todayUniqueCustomers = new Set(todayCustomers.data?.map((p: any) => p.patient?.name).filter(Boolean));
        
        // Calculate repeat customers (optimized)
        const allCustomerCounts = new Map<string, number>();
        allCustomers.data?.forEach((p: any) => {
          if (p.patient?.name) {
            allCustomerCounts.set(p.patient.name, (allCustomerCounts.get(p.patient.name) || 0) + 1);
          }
        });
        
        const repeatCustomers = todayCustomers.data?.filter((p: any) => 
          p.patient?.name && (allCustomerCounts.get(p.patient.name) || 0) > 1
        ).length || 0;
        
        const repeatRate = todayUniqueCustomers.size > 0 ? 
          (repeatCustomers / todayUniqueCustomers.size) * 100 : 0;

        return {
          totalCustomers: uniqueCustomers.size,
          newToday: todayUniqueCustomers.size,
          repeatRate
        };
      },
      { priority: 2, dependencies: ['todaysSales'], useCache: true, cacheTTL: 900000 } // 15 minutes cache
    ));

    // Low priority data (priority 3)
    addLoader(createSupabaseLoader(
      'revenueData',
      async () => {
        const weekStart = subDays(today, 7);
        const monthStart = subDays(today, 30);

        const [weekResult, monthResult] = await Promise.all([
          supabase
            .from('bills')
            .select('total_amount')
            .gte('created_at', weekStart.toISOString()),
          supabase
            .from('bills')
            .select('total_amount')
            .gte('created_at', monthStart.toISOString())
        ]);

        if (weekResult.error) throw weekResult.error;
        if (monthResult.error) throw monthResult.error;

        const weekTotal = weekResult.data?.reduce((sum, bill) => sum + (bill.total_amount || 0), 0) || 0;
        const monthTotal = monthResult.data?.reduce((sum, bill) => sum + (bill.total_amount || 0), 0) || 0;
        
        // Get today's sales from previous loader result
        const todaysSales = getResult<any>('todaysSales');
        const todayTotal = todaysSales?.total || 0;

        return {
          today: todayTotal,
          thisWeek: weekTotal,
          thisMonth: monthTotal,
          growth: 0 // Simplified for this example
        };
      },
      { priority: 3, dependencies: ['todaysSales'], useCache: true, cacheTTL: 1800000 } // 30 minutes cache
    ));

    // Start loading
    loadAll();

    // Register cleanup
    register('dashboard-abort', 'other', () => abort(), 'Dashboard data loading abort');

    return () => {
      abort();
    };
  }, [addLoader, loadAll, getResult, abort, register]);

  // Update dashboard data when results change
  useEffect(() => {
    const newData: Partial<DashboardData> = {};
    
    const todaysSales = getResult<any>('todaysSales');
    if (todaysSales) newData.todaysSales = todaysSales;
    
    const inventoryAlerts = getResult<any>('inventoryAlerts');
    if (inventoryAlerts) newData.inventoryAlerts = inventoryAlerts;
    
    const customerMetrics = getResult<any>('customerMetrics');
    if (customerMetrics) newData.customerMetrics = customerMetrics;
    
    const revenueData = getResult<any>('revenueData');
    if (revenueData) newData.revenueData = revenueData;
    
    setDashboardData(newData);
  }, [state.completedLoaders, getResult]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAll();
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const circuitStatus = getCircuitStatus();
  const isCircuitHealthyStatus = isCircuitHealthy(supabaseCircuitBreaker);

  return (
    <ConnectionErrorBoundary>
      <div className="space-y-6">
        {/* Header with status indicators */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
            <p className="text-muted-foreground">
              Last updated: {format(lastRefresh, 'HH:mm:ss')}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Circuit breaker status */}
            <Badge variant={isCircuitHealthyStatus ? 'default' : 'destructive'}>
              Circuit: {circuitStatus?.supabase?.state || 'Unknown'}
            </Badge>
            
            {/* Loading progress */}
            {state.isLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{state.progress}%</span>
              </div>
            )}
            
            {/* Refresh button */}
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing || !isCircuitHealthyStatus}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading progress bar */}
        {state.isLoading && (
          <div className="space-y-2">
            <Progress value={state.progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Loading: {state.completedLoaders.length} of {state.completedLoaders.length + (state.isLoading ? 1 : 0)} sections
              {state.failedLoaders.length > 0 && (
                <span className="text-red-600 ml-2">
                  ({state.failedLoaders.length} failed)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Error alerts */}
        {state.hasError && (
          <Alert variant="error">
            <AlertDescription>
              {state.error || 'An error occurred while loading dashboard data'}
            </AlertDescription>
          </Alert>
        )}

        {/* Dashboard cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Today's Sales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {dashboardData.todaysSales ? (
                <>
                  <div className="text-2xl font-bold">
                    ₹{dashboardData.todaysSales.total.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.todaysSales.count} transactions
                  </p>
                  <p className={`text-xs ${
                    dashboardData.todaysSales.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {dashboardData.todaysSales.growth >= 0 ? '+' : ''}
                    {dashboardData.todaysSales.growth.toFixed(1)}% from yesterday
                  </p>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Alerts</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {dashboardData.inventoryAlerts ? (
                <>
                  <div className="text-2xl font-bold">
                    {dashboardData.inventoryAlerts.lowStock + 
                     dashboardData.inventoryAlerts.outOfStock + 
                     dashboardData.inventoryAlerts.expiringSoon}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-red-600">
                      {dashboardData.inventoryAlerts.outOfStock} out of stock
                    </p>
                    <p className="text-xs text-yellow-600">
                      {dashboardData.inventoryAlerts.lowStock} low stock
                    </p>
                    <p className="text-xs text-orange-600">
                      {dashboardData.inventoryAlerts.expiringSoon} expiring soon
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Metrics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {dashboardData.customerMetrics ? (
                <>
                  <div className="text-2xl font-bold">
                    {dashboardData.customerMetrics.totalCustomers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.customerMetrics.newToday} new today
                  </p>
                  <p className="text-xs text-green-600">
                    {dashboardData.customerMetrics.repeatRate.toFixed(1)}% repeat rate
                  </p>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {dashboardData.revenueData ? (
                <>
                  <div className="text-2xl font-bold">
                    ₹{dashboardData.revenueData.thisMonth.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Week: ₹{dashboardData.revenueData.thisWeek.toLocaleString()}
                  </p>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Debug information (only in development) */}
        {CURRENT_CONFIG.enableVerboseLogging && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>Loading State: {state.isLoading ? 'Loading' : 'Complete'}</div>
              <div>Progress: {state.progress}%</div>
              <div>Completed: {state.completedLoaders.join(', ')}</div>
              <div>Failed: {state.failedLoaders.join(', ')}</div>
              <div>Circuit State: {circuitStatus?.supabase?.state}</div>
              <div>Circuit Failures: {circuitStatus?.supabase?.failureCount}/{circuitStatus?.supabase?.isHealthy ? 'Healthy' : 'Unhealthy'}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </ConnectionErrorBoundary>
  );
}