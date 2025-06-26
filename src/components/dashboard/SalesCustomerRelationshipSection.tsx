import React, { useState, useEffect, useCallback } from 'react';
import { FeatureCard } from '@/components/dashboard/FeatureCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, MessageSquare, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, subDays } from 'date-fns';
import { displayErrorMessage } from '@/utils/errorHandling';

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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const today = new Date();
      const threeMonthsAgo = subMonths(today, 3);
      const sixMonthsAgo = subMonths(today, 6);
      const fromDate = format(threeMonthsAgo, 'yyyy-MM-dd');
      const toDate = format(today, 'yyyy-MM-dd');
      const previousPeriodFrom = format(sixMonthsAgo, 'yyyy-MM-dd');
      const previousPeriodTo = format(threeMonthsAgo, 'yyyy-MM-dd');
      
      // Fetch current period customer data
      const { data: currentCustomers, error: currentError } = await supabase
        .from('bills')
        .select(`
          id,
          total_amount,
          date,
          prescription:prescriptions (
            patient:patients (
              id,
              name,
              phone_number
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('date', fromDate)
        .lte('date', toDate);
      
      if (currentError) throw currentError;
      
      // Fetch previous period customer data for comparison
      const { data: previousCustomers, error: previousError } = await supabase
        .from('bills')
        .select(`
          id,
          total_amount,
          date,
          prescription:prescriptions (
            patient:patients (
              id,
              name,
              phone_number
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('date', previousPeriodFrom)
        .lte('date', previousPeriodTo);
      
      if (previousError) throw previousError;
      
      // Analyze customer patterns
      const currentCustomerMap = new Map();
      const previousCustomerMap = new Map();
      
      // Process current period data
      currentCustomers?.forEach(bill => {
        const patientId = bill.prescription?.patient?.id;
        if (patientId) {
          const customerData = currentCustomerMap.get(patientId) || {
            name: bill.prescription.patient.name,
            totalSpent: 0,
            visitCount: 0,
            lastVisit: bill.date
          };
          customerData.totalSpent += bill.total_amount;
          customerData.visitCount += 1;
          if (new Date(bill.date) > new Date(customerData.lastVisit)) {
            customerData.lastVisit = bill.date;
          }
          currentCustomerMap.set(patientId, customerData);
        }
      });
      
      // Process previous period data
      previousCustomers?.forEach(bill => {
        const patientId = bill.prescription?.patient?.id;
        if (patientId) {
          const customerData = previousCustomerMap.get(patientId) || {
            totalSpent: 0,
            visitCount: 0
          };
          customerData.totalSpent += bill.total_amount;
          customerData.visitCount += 1;
          previousCustomerMap.set(patientId, customerData);
        }
      });
      
      // Calculate repeat customers
      const repeatCustomers = Array.from(currentCustomerMap.keys())
        .filter(patientId => previousCustomerMap.has(patientId));
      
      const repeatCustomerRate = currentCustomerMap.size > 0 
        ? (repeatCustomers.length / currentCustomerMap.size * 100).toFixed(1)
        : '0';
      
      // Analyze top customers (top 10% by spending)
      const sortedCustomers = Array.from(currentCustomerMap.entries())
        .sort(([,a], [,b]) => b.totalSpent - a.totalSpent);
      
      const topCustomersCount = Math.max(1, Math.ceil(sortedCustomers.length * 0.1));
      const topCustomers = sortedCustomers.slice(0, topCustomersCount);
      const topCustomersRevenue = topCustomers.reduce((sum, [,data]) => sum + data.totalSpent, 0);
      const totalRevenue = Array.from(currentCustomerMap.values())
        .reduce((sum, data) => sum + data.totalSpent, 0);
      
      const topCustomersContribution = totalRevenue > 0 
        ? (topCustomersRevenue / totalRevenue * 100).toFixed(0)
        : '0';
      
      // Generate insights
      const refillReminderImpact = `Customer retention analysis shows ${repeatCustomerRate}% of customers are returning. ${repeatCustomers.length > 0 ? 'Implement refill reminders to boost repeat visits.' : 'Focus on customer retention strategies.'}`;
      
      const loyaltyProgramInsight = `Top ${topCustomersCount} customers (${(topCustomersCount/sortedCustomers.length*100).toFixed(0)}%) contribute ${topCustomersContribution}% of total revenue. ${topCustomersContribution > 30 ? 'Consider exclusive offers for high-value customers.' : 'Develop loyalty programs to increase customer value.'}`;
      
      setGrowthData({
        refillReminderImpact,
        loyaltyProgramInsight,
        lastUpdated: new Date().toLocaleDateString(),
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        displayErrorMessage(err, 'Customer Relationship Analysis');
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