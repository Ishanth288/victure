import React, { useState, useEffect, useCallback } from 'react';
import { FeatureCard } from '@/components/dashboard/FeatureCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ForecastData {
  demandPrediction: string;
  seasonalTrends: string;
  accuracyLevel: number;
  lastUpdated: string;
}

const AdvancedSalesForecastingSection: React.FC = () => {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecastData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1800));
    try {
      // Simulate success
      if (Math.random() > 0.1) { // 90% success rate
        setForecastData({
          demandPrediction: 'Increased demand for cold & flu medication expected next month.',
          seasonalTrends: 'Allergy medication sales peak in Spring; Vitamin D supplements rise in Winter.',
          accuracyLevel: Math.floor(Math.random() * 15) + 80, // 80-95%
          lastUpdated: new Date().toLocaleDateString(),
        });
      } else {
        // Simulate error
        throw new Error('Failed to retrieve sales forecasting data. Please try again.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      console.error("Error fetching forecast data:", err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchForecastData();
  }, [fetchForecastData]);

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
        <AlertTitle>Forecasting Error</AlertTitle>
        <AlertDescription>
          {error} <Button variant="link" size="sm" onClick={fetchForecastData} className="ml-2 p-0 h-auto">Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <section id="sales-forecasting" className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Advanced Sales Forecasting</h2>
          <p className="text-gray-600 mt-1">Predict future demand with greater accuracy.</p>
        </div>
        {forecastData && !isLoading && (
          <p className="text-xs text-gray-500 mt-2 sm:mt-0">Last Updated: {forecastData.lastUpdated} | Accuracy: {forecastData.accuracyLevel}%</p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderSkeletons(2)}
        </div>
      ) : forecastData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard 
            title="Demand Prediction Engine" 
            icon={<AlertTriangle className="w-5 h-5 text-blue-500" />}
            description="Real-time demand forecasting powered by advanced analytics"
          >
            <p className="text-gray-700 text-sm">{forecastData.demandPrediction}</p>
            <p className="text-xs text-gray-500 mt-2">Utilizes historical data, current trends, and local health advisories.</p>
          </FeatureCard>
          <FeatureCard 
            title="Seasonal Trend Analysis" 
            icon={<AlertTriangle className="w-5 h-5 text-green-500" />}
            description="Track and analyze seasonal sales patterns and trends"
          >
            <p className="text-gray-700 text-sm">{forecastData.seasonalTrends}</p>
            <p className="text-xs text-gray-500 mt-2">Prepare for seasonal fluctuations and optimize stock levels accordingly.</p>
          </FeatureCard>
        </div>
      ) : (
        <p className="text-gray-600 text-center py-4">No forecasting data available at the moment.</p>
      )}
    </section>
  );
};

export default AdvancedSalesForecastingSection;