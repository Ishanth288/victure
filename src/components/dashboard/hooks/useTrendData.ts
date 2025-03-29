
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface TrendDataPoint {
  name: string;
  value: number;
}

export function useTrendData() {
  const [isLoading, setIsLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([
    { name: 'Jan', value: 5000 },
    { name: 'Feb', value: 7000 },
    { name: 'Mar', value: 6000 },
    { name: 'Apr', value: 8000 },
    { name: 'May', value: 9500 },
    { name: 'Jun', value: 11000 },
    { name: 'Jul', value: 10000 },
  ]);

  useEffect(() => {
    // This is where we could fetch real trend data from an API
    // For now we're using static data
    setIsLoading(false);
  }, []);

  return { 
    trendData,
    isLoading 
  };
}
