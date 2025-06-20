import React, { useState, useEffect, useCallback } from 'react';
import { FeatureCard } from '@/components/dashboard/FeatureCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ShoppingCart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OptimizationData {
  supplierSuggestion: string;
  bulkOrderSavings: string;
  lastAnalyzed: string;
}

const SupplierPurchaseOptimizationSection: React.FC = () => {
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1700));
    try {
      // Simulate success
      if (Math.random() > 0.1) { // 90% success rate
        setOptimizationData({
          supplierSuggestion: 'PharmaDist Ltd. offers a 5% discount on orders over ₹50,000 this month.',
          bulkOrderSavings: 'Consolidating orders for common OTC drugs can save up to 8% on procurement costs.',
          lastAnalyzed: new Date().toLocaleDateString(),
        });
      } else {
        // Simulate error
        throw new Error('Failed to retrieve supplier and purchase optimization data. Please try again.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      console.error("Error fetching optimization data:", err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderSkeletons = (count: number) => (
    Array(count).fill(0).map((_, index) => (
      <div key={index} className="bg-gray-100 p-4 rounded-lg animate-pulse">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    ))
  );

  if (error) {
    return (
      <Alert variant="error" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Optimization Error</AlertTitle>
        <AlertDescription>
          {error} <Button variant="link" size="sm" onClick={fetchData} className="ml-2 p-0 h-auto">Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <section id="supplier-purchase-optimization" className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Supplier & Purchase Optimization</h2>
          <p className="text-gray-600 mt-1">Make smarter purchasing decisions and manage suppliers effectively.</p>
        </div>
        {optimizationData && !isLoading && (
          <p className="text-xs text-gray-500 mt-2 sm:mt-0">Last Analyzed: {optimizationData.lastAnalyzed}</p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderSkeletons(2)}
        </div>
      ) : optimizationData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard 
            title="Optimal Supplier Suggestions" 
            icon={<Users className="w-5 h-5 text-purple-500" />}
            description="View and analyze supplier recommendations based on performance metrics"
          >
            <p className="text-gray-700 text-sm">{optimizationData.supplierSuggestion}</p>
            <p className="text-xs text-gray-500 mt-2">Based on price, reliability, and current promotions.</p>
          </FeatureCard>
          <FeatureCard 
            title="Bulk Order & Discount Analysis" 
            icon={<ShoppingCart className="w-5 h-5 text-orange-500" />}
            description="Analyze bulk purchasing opportunities and available discounts"
          >
            <p className="text-gray-700 text-sm">{optimizationData.bulkOrderSavings}</p>
            <p className="text-xs text-gray-500 mt-2">Identify cost-saving opportunities through strategic purchasing.</p>
          </FeatureCard>
        </div>
      ) : (
        <p className="text-gray-600 text-center py-4">No optimization data available at the moment.</p>
      )}
    </section>
  );
};

export default SupplierPurchaseOptimizationSection;