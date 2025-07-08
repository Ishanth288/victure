import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FeatureCard } from '@/components/dashboard/FeatureCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ShoppingCart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths } from 'date-fns';
import { displayErrorMessage } from '@/utils/errorHandling';

interface OptimizationData {
  supplierSuggestion: string;
  bulkOrderSavings: string;
  lastAnalyzed: string;
}

const SupplierPurchaseOptimizationSection: React.FC = () => {
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current || !isMountedRef.current) {
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Validate user ID
      if (!user.id) {
        throw new Error('Invalid user authentication');
      }
      
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const threeMonthsAgo = subMonths(today, 3);
      threeMonthsAgo.setHours(0, 0, 0, 0);
      
      const fromDateTime = threeMonthsAgo.toISOString();
      const toDateTime = today.toISOString();
      
      // Validate date range
      if (isNaN(Date.parse(fromDateTime)) || isNaN(Date.parse(toDateTime))) {
        throw new Error('Invalid date range');
      }
      
      // Fetch purchase orders data with correct schema
      const { data: purchaseOrders, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          supplier_name,
          total_amount,
          status,
          order_date,
          purchase_order_items (
            id,
            item_name,
            quantity_ordered,
            unit_cost,
            total_cost
          )
        `)
        .eq('user_id', user.id)
        .gte('order_date', fromDateTime)
        .lte('order_date', toDateTime);
      
      if (poError) throw poError;
      
      // Analyze supplier performance and costs
      const supplierAnalysis = new Map();
      const categorySpending = new Map();
      let totalSpending = 0;
      
      purchaseOrders?.forEach(order => {
        const supplier = order.supplier_name || 'Unknown Supplier';
        const supplierData = supplierAnalysis.get(supplier) || {
          totalAmount: 0,
          orderCount: 0,
          avgOrderValue: 0,
          completedOrders: 0
        };
        
        const orderAmount = parseFloat(String(order.total_amount)) || 0;
        supplierData.totalAmount += orderAmount;
        supplierData.orderCount += 1;
        if (order.status === 'completed') {
          supplierData.completedOrders += 1;
        }
        supplierData.avgOrderValue = supplierData.totalAmount / supplierData.orderCount;
        supplierAnalysis.set(supplier, supplierData);
        
        totalSpending += orderAmount;
        
        // Analyze category spending using item names
        order.purchase_order_items?.forEach((item: any) => {
          if (!item.item_name) return;
          
          // Extract category from item name or use a simple categorization
          const itemName = item.item_name.toLowerCase();
          let category = 'General';
          
          // Simple categorization based on common medical terms
          if (itemName.includes('tablet') || itemName.includes('capsule') || itemName.includes('medicine')) {
            category = 'Medicines';
          } else if (itemName.includes('syrup') || itemName.includes('liquid')) {
            category = 'Syrups';
          } else if (itemName.includes('injection') || itemName.includes('vial')) {
            category = 'Injections';
          } else if (itemName.includes('cream') || itemName.includes('ointment')) {
            category = 'Topical';
          }

          const itemCost = (parseFloat(String(item.unit_cost)) || 0) * (parseInt(String(item.quantity_ordered)) || 0);
          const prevCategoryData = categorySpending.get(category);
          const updatedCategoryData = {
            total: (prevCategoryData?.total || 0) + itemCost,
            items: (prevCategoryData?.items || 0) + (parseInt(String(item.quantity_ordered)) || 0)
          };
          categorySpending.set(category, updatedCategoryData);
        });
      });
      
      // Generate supplier suggestions
      const topSuppliers = Array.from(supplierAnalysis.entries())
        .sort(([,a], [,b]) => b.totalAmount - a.totalAmount)
        .slice(0, 3);
      
      let supplierSuggestion = 'No recent purchase data available for analysis.';
      if (topSuppliers.length > 0) {
        const [topSupplier, data] = topSuppliers[0];
        const reliability = data.orderCount > 0 ? (data.completedOrders / data.orderCount * 100).toFixed(0) : '0';
        supplierSuggestion = `${topSupplier} shows ${reliability}% order completion rate. Consider negotiating bulk discounts for orders over ₹${Math.round(data.avgOrderValue * 1.5).toLocaleString()}.`;
      }
      
      // Generate bulk order savings suggestions
      const topCategories = Array.from(categorySpending.entries())
        .sort(([,a], [,b]) => b.total - a.total)
        .slice(0, 2);
      
      let bulkOrderSavings = 'Analyze purchase patterns to identify bulk order opportunities.';
      if (topCategories.length > 0) {
        const [topCategory, data] = topCategories[0];
        const avgItemCost = data.items > 0 ? data.total / data.items : 0;
        const potentialSavings = Math.round(data.total * 0.08); // Assume 8% savings
        bulkOrderSavings = `Consolidating ${topCategory.toLowerCase()} orders (avg cost: ₹${avgItemCost.toFixed(2)}/unit) could save up to ₹${potentialSavings.toLocaleString()} through bulk purchasing.`;
      }
      
      setOptimizationData({
        supplierSuggestion,
        bulkOrderSavings,
        lastAnalyzed: new Date().toLocaleDateString(),
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        displayErrorMessage(err, 'Supplier Optimization');
      } else {
        setError('An unknown error occurred.');
      }
      console.error("Error fetching optimization data:", err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, []); // Empty dependency array to prevent recreation

  // Add debouncing to prevent infinite loops and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        fetchData();
      }
    }, 300); // 300ms debounce
    
    return () => {
      clearTimeout(timeoutId);
      isMountedRef.current = false;
    };
  }, []); // Remove fetchData dependency to prevent infinite loop

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
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600 text-sm">Analyzing purchase data...</p>
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