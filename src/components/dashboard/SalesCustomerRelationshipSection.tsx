import React, { useState, useEffect, useCallback } from 'react';
import { FeatureCard } from '@/components/dashboard/FeatureCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, MessageSquare, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GrowthData {
  refillReminderImpact: string;
  loyaltyProgramInsight: string;
  lastUpdated: string;
}

const SalesCustomerRelationshipSection: React.FC = () => {
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1900)); 
    try {
      // Simulate success
      if (Math.random() > 0.1) { // 90% success rate
        setGrowthData({
          refillReminderImpact: 'Automated refill reminders increased repeat purchases by 12% last quarter.',
          loyaltyProgramInsight: 'Top 10% of loyalty members contribute to 35% of total revenue. Consider exclusive offers.',
          lastUpdated: new Date().toLocaleDateString(),
        });
      } else {
        // Simulate error
        throw new Error('Failed to retrieve sales and customer relationship data. Please try again.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      console.error("Error fetching growth data:", err);
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
        <AlertTitle>Growth Data Error</AlertTitle>
        <AlertDescription>
          {error} <Button variant="link" size="sm" onClick={fetchData} className="ml-2 p-0 h-auto">Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <section id="sales-customer-relationship-optimization" className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Sales & Customer Relationship Growth</h2>
          <p className="text-gray-600 mt-1">Enhance customer loyalty and boost sales through targeted strategies.</p>
        </div>
        {growthData && !isLoading && (
          <p className="text-xs text-gray-500 mt-2 sm:mt-0">Last Updated: {growthData.lastUpdated}</p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderSkeletons(2)}
        </div>
      ) : growthData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard 
            title="Automated Refill Reminders" 
            icon={<MessageSquare className="w-5 h-5 text-teal-500" />}
            description="Automated reminder system to help patients stay on track with their medications"
          >
            <p className="text-gray-700 text-sm">{growthData.refillReminderImpact}</p>
            <p className="text-xs text-gray-500 mt-2">Improve patient adherence and secure recurring revenue.</p>
          </FeatureCard>
          <FeatureCard 
            title="Personalized Promotions & Loyalty Insights" 
            icon={<Users2 className="w-5 h-5 text-indigo-500" />}
            description="Leverage customer data to create targeted promotions and loyalty rewards"
          >
            <p className="text-gray-700 text-sm">{growthData.loyaltyProgramInsight}</p>
            <p className="text-xs text-gray-500 mt-2">Data-driven insights for targeted customer offers and loyalty schemes.</p>
          </FeatureCard>
        </div>
      ) : (
        <p className="text-gray-600 text-center py-4">No growth data available at the moment.</p>
      )}
    </section>
  );
};

export default SalesCustomerRelationshipSection;