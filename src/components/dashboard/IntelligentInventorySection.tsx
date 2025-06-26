import React, { useEffect } from 'react';
import { FeatureCard } from './FeatureCard';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, PackageSearch, CalendarClock, Filter } from 'lucide-react';
import { useInventoryInsights } from '@/hooks/useInventoryInsights';
import { useInventoryPerformance } from '@/utils/inventoryPerformanceMonitor';
import InventoryErrorBoundary from '@/components/error/InventoryErrorBoundary';
import InventoryLoadingState from './InventoryLoadingState';
import InventoryErrorState from './InventoryErrorState';
import type {
  PrescriptionDrivenSuggestion,
  SalesVelocityItem,
  ExpiryAlert,
  FastMover,
  SlowMover
} from '@/types/inventoryInsights';

/**
 * Intelligent Inventory Management Component
 * 
 * Features:
 * - Prescription-driven stock suggestions
 * - Sales velocity analysis
 * - Expiry date management
 * - Fast/slow mover analysis
 * - Performance monitoring
 * - Comprehensive error handling
 */

const IntelligentInventoryContent: React.FC = () => {
  const { insights, isLoading, error, refetch } = useInventoryInsights();
  const { getStats } = useInventoryPerformance();

  // Initialize data fetching on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && insights) {
      const stats = getStats();
      if (stats.slowQueriesCount > 0) {
        console.warn('Performance Alert: Slow queries detected in inventory insights');
      }
    }
  }, [insights, getStats]);

  // Show loading state
  if (isLoading) {
    return <InventoryLoadingState message="Analyzing inventory data and generating insights..." />;
  }

  // Show error state
  if (error) {
    return <InventoryErrorState error={error} onRetry={refetch} isRetrying={isLoading} />;
  }

  // Show empty state if no insights
  if (!insights) {
    return <InventoryLoadingState message="No inventory data available. Please check your inventory setup." />;
  }

  return (
    <section id="intelligent-inventory-management" className="bg-white p-6 md:p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
            <PackageSearch className="mr-3 h-7 w-7 text-indigo-600" />
            Intelligent Inventory Management
          </h2>
          <p className="text-gray-600 mt-1">Optimize stock levels, reduce waste, and ensure product availability.</p>
        </div>
        <Button onClick={refetch} disabled={isLoading} className="mt-4 sm:mt-0">
          {isLoading ? 'Refreshing...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Filters - can be expanded */}
      {/* <div className="mb-6 flex space-x-2">
        <Button variant={activeFilter === 'all' ? 'default' : 'outline'} onClick={() => setActiveFilter('all')}>All</Button>
        <Button variant={activeFilter === 'suggestions' ? 'default' : 'outline'} onClick={() => setActiveFilter('suggestions')}>Suggestions</Button>
        <Button variant={activeFilter === 'alerts' ? 'default' : 'outline'} onClick={() => setActiveFilter('alerts')}>Alerts</Button>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prescription-Driven Suggestions */}
        <FeatureCard 
          title="Prescription-Driven Suggestions"
          description="Insights based on current and trending prescriptions."
          icon={<Lightbulb className="h-6 w-6 text-blue-500" />}
        >
          {insights.prescriptionDrivenSuggestions.length > 0 ? (
            insights.prescriptionDrivenSuggestions.map((item: PrescriptionDrivenSuggestion) => (
              <div key={item.id} className="p-3 bg-blue-50 rounded-md mb-2 text-sm">
                <strong>{item.name}:</strong> {item.suggestion}
              </div>
            ))
          ) : (
            <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
              No prescription-driven suggestions available at this time.
            </div>
          )}
        </FeatureCard>

        {/* Sales Velocity & Seasonality */}
        <FeatureCard 
          title="Sales Velocity & Seasonality"
          description="Track sales speed and seasonal demand patterns."
          icon={<TrendingUp className="h-6 w-6 text-green-500" />}
        >
          {insights.salesVelocity.length > 0 ? (
            insights.salesVelocity.map((item: SalesVelocityItem) => (
              <div key={item.id} className="p-3 bg-green-50 rounded-md mb-2 text-sm">
                <strong>{item.name}:</strong> Velocity: {item.velocity}, Trend: {item.trend}
              </div>
            ))
          ) : (
            <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
              No sales velocity data available.
            </div>
          )}
        </FeatureCard>

        {/* Expiry Date Management */}
        <FeatureCard 
          title="Expiry Date Management"
          description="Proactive alerts for near-expiry products to minimize loss."
          icon={<CalendarClock className="h-6 w-6 text-red-500" />}
        >
          {insights.expiryAlerts.length > 0 ? (
            insights.expiryAlerts.map((item: ExpiryAlert) => (
              <div key={item.id} className="p-3 bg-red-50 rounded-md mb-2 text-sm">
                <strong>{item.name}</strong> (Expires: {item.expiryDate} - {item.daysLeft} days left): {item.action}
              </div>
            ))
          ) : (
            <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
              No expiry alerts at this time.
            </div>
          )}
        </FeatureCard>

        {/* Fast/Slow Mover Analysis */}
        <FeatureCard 
          title="Fast/Slow Mover Analysis"
          description="Identify top-performing and underperforming products."
          icon={<Filter className="h-6 w-6 text-purple-500" />}
        >
          <div className="text-sm">
            <h4 className="font-semibold mb-1 text-purple-700">Fast Movers:</h4>
            {insights.moversAnalysis.fastMovers.length > 0 ? (
              insights.moversAnalysis.fastMovers.map((item: FastMover) => (
                <p key={item.id} className="ml-2">- {item.name} ({item.sales} units sold)</p>
              ))
            ) : (
              <p className="ml-2 text-gray-600">No fast movers identified.</p>
            )}
            
            <h4 className="font-semibold mt-3 mb-1 text-purple-700">Slow Movers:</h4>
            {insights.moversAnalysis.slowMovers.length > 0 ? (
              insights.moversAnalysis.slowMovers.map((item: SlowMover) => (
                <p key={item.id} className="ml-2">- {item.name} (Last sale: {item.lastSale})</p>
              ))
            ) : (
              <p className="ml-2 text-gray-600">No slow movers identified.</p>
            )}
          </div>
        </FeatureCard>
      </div>
    </section>
  );
};

const IntelligentInventorySection: React.FC = () => {
  return (
    <InventoryErrorBoundary>
      <IntelligentInventoryContent />
    </InventoryErrorBoundary>
  );
};

export default IntelligentInventorySection;