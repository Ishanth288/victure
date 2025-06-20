import React, { useState, useEffect, useCallback } from 'react';
import { FeatureCard } from './FeatureCard';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component
import { Skeleton } from '@/components/ui/skeleton'; // Assuming you have a Skeleton component
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, AlertTriangle, TrendingUp, PackageSearch, CalendarClock, Filter } from 'lucide-react';

// Mock data fetching function - replace with actual API call
const fetchInventoryInsights = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        prescriptionDrivenSuggestions: [
          { id: 'pds1', name: 'Amoxicillin 250mg', suggestion: 'Increase stock by 20 units based on recent prescriptions.' },
          { id: 'pds2', name: 'Metformin 500mg', suggestion: 'Current stock sufficient, monitor closely.' },
        ],
        salesVelocity: [
          { id: 'sv1', name: 'Vitamin C 1000mg', velocity: 'High', trend: 'Increasing' },
          { id: 'sv2', name: 'Paracetamol 500mg', velocity: 'Medium', trend: 'Stable' },
        ],
        expiryAlerts: [
          { id: 'ea1', name: 'Salbutamol Inhaler', expiryDate: '2024-08-15', daysLeft: 45, action: 'Prioritize for sale or return.' },
          { id: 'ea2', name: 'Insulin Glargine', expiryDate: '2024-09-01', daysLeft: 62, action: 'Monitor stock.' },
        ],
        moversAnalysis: {
          fastMovers: [
            { id: 'fm1', name: 'Atorvastatin 20mg', sales: 150 },
            { id: 'fm2', name: 'Losartan 50mg', sales: 120 },
          ],
          slowMovers: [
            { id: 'sm1', name: 'Product X', sales: 5, lastSale: '90 days ago' },
            { id: 'sm2', name: 'Product Y', sales: 2, lastSale: '120 days ago' },
          ],
        },
      });
    }, 1500);
  });
};

const IntelligentInventorySection: React.FC = () => {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const loadInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInventoryInsights();
      setInsights(data);
    } catch (err) {
      setError('Failed to load inventory insights. Please try again.');
      console.error(err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const renderSkeletons = (count: number) => (
    Array(count).fill(0).map((_, index) => (
      <div key={index} className="bg-gray-100 p-4 rounded-lg animate-pulse">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))
  );

  if (error) {
    return (
      <Alert variant="error">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error} <Button variant="link" onClick={loadInsights}>Retry</Button></AlertDescription>
      </Alert>
    );
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
        <Button onClick={loadInsights} disabled={isLoading} className="mt-4 sm:mt-0">
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
          {isLoading ? renderSkeletons(2) : (
            insights?.prescriptionDrivenSuggestions.map((item: any) => (
              <div key={item.id} className="p-3 bg-blue-50 rounded-md mb-2 text-sm">
                <strong>{item.name}:</strong> {item.suggestion}
              </div>
            ))
          )}
        </FeatureCard>

        {/* Sales Velocity & Seasonality */}
        <FeatureCard 
          title="Sales Velocity & Seasonality"
          description="Track sales speed and seasonal demand patterns."
          icon={<TrendingUp className="h-6 w-6 text-green-500" />}
        >
          {isLoading ? renderSkeletons(2) : (
            insights?.salesVelocity.map((item: any) => (
              <div key={item.id} className="p-3 bg-green-50 rounded-md mb-2 text-sm">
                <strong>{item.name}:</strong> Velocity: {item.velocity}, Trend: {item.trend}
              </div>
            ))
          )}
        </FeatureCard>

        {/* Expiry Date Management */}
        <FeatureCard 
          title="Expiry Date Management"
          description="Proactive alerts for near-expiry products to minimize loss."
          icon={<CalendarClock className="h-6 w-6 text-red-500" />}
        >
          {isLoading ? renderSkeletons(2) : (
            insights?.expiryAlerts.map((item: any) => (
              <div key={item.id} className="p-3 bg-red-50 rounded-md mb-2 text-sm">
                <strong>{item.name}</strong> (Expires: {item.expiryDate} - {item.daysLeft} days left): {item.action}
              </div>
            ))
          )}
        </FeatureCard>

        {/* Fast/Slow Mover Analysis */}
        <FeatureCard 
          title="Fast/Slow Mover Analysis"
          description="Identify top-performing and underperforming products."
          icon={<Filter className="h-6 w-6 text-purple-500" />}
        >
          {isLoading ? renderSkeletons(1) : (
            <div className="text-sm">
              <h4 className="font-semibold mb-1 text-purple-700">Fast Movers:</h4>
              {insights?.moversAnalysis.fastMovers.map((item: any) => (
                <p key={item.id} className="ml-2">- {item.name} ({item.sales} units sold)</p>
              ))}
              <h4 className="font-semibold mt-3 mb-1 text-purple-700">Slow Movers:</h4>
              {insights?.moversAnalysis.slowMovers.map((item: any) => (
                <p key={item.id} className="ml-2">- {item.name} (Last sale: {item.lastSale})</p>
              ))}
            </div>
          )}
        </FeatureCard>
      </div>
    </section>
  );
};

export default IntelligentInventorySection;