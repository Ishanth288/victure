
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Optimization {
  id: string;
  item: string;
  currentStock: number;
  recommendedStock: number;
  saving: number;
  reason: string;
}

export const InventoryOptimization = () => {
  const [loading, setLoading] = useState(true);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  useEffect(() => {
    // Get data from localStorage or fetch new data if needed
    const fetchOptimizations = async () => {
      setLoading(true);
      
      try {
        // Check if we have cached data and when it was last updated
        const cachedData = localStorage.getItem('inventory-optimizations');
        const lastUpdateTime = localStorage.getItem('inventory-optimizations-last-updated');
        
        let shouldFetchFresh = true;
        
        if (cachedData && lastUpdateTime) {
          const lastUpdate = new Date(lastUpdateTime);
          const now = new Date();
          
          // If last update was less than 24 hours ago, use cached data
          if ((now.getTime() - lastUpdate.getTime()) < 24 * 60 * 60 * 1000) {
            setOptimizations(JSON.parse(cachedData));
            setLastUpdated(lastUpdate);
            setLoading(false);
            shouldFetchFresh = false;
          }
        }
        
        if (shouldFetchFresh) {
          await generateAIOptimizations();
        }
      } catch (error) {
        console.error("Error loading inventory optimizations:", error);
        setLoading(false);
      }
    };
    
    fetchOptimizations();
    
    // Set up a timer to refresh once per day
    const interval = setInterval(() => {
      const lastUpdateTime = localStorage.getItem('inventory-optimizations-last-updated');
      if (lastUpdateTime) {
        const lastUpdate = new Date(lastUpdateTime);
        const now = new Date();
        
        // If last update was more than 24 hours ago, refresh
        if ((now.getTime() - lastUpdate.getTime()) > 24 * 60 * 60 * 1000) {
          generateAIOptimizations();
        }
      }
    }, 3600000); // Check hourly if we need to refresh
    
    return () => clearInterval(interval);
  }, []);
  
  const generateAIOptimizations = async () => {
    setLoading(true);
    
    try {
      // In a real implementation, we would:
      // 1. Fetch user's sales data
      // 2. Fetch inventory data
      // 3. Use AI to generate optimizations
      
      // Fetch bills from Supabase (simulated)
      const { data: { user } } = await supabase.auth.getUser();
      
      // For this demo, we'll use simulated AI optimizations based on historical data
      const sampleOptimizations = [
        {
          id: "opt-1",
          item: "Amoxicillin 500mg",
          currentStock: 120,
          recommendedStock: 80,
          saving: 2400,
          reason: "Seasonal demand decrease according to regional trends"
        },
        {
          id: "opt-2",
          item: "Metformin 1000mg",
          currentStock: 50,
          recommendedStock: 75,
          saving: -1500,
          reason: "Increasing demand pattern in patient prescriptions"
        },
        {
          id: "opt-3",
          item: "Loratadine 10mg",
          currentStock: 100,
          recommendedStock: 150,
          saving: -3000,
          reason: "Seasonal demand increase expected in the next 30 days"
        },
        {
          id: "opt-4",
          item: "Cetirizine 5mg",
          currentStock: 80,
          recommendedStock: 120,
          saving: -2400,
          reason: "Seasonal allergies forecast shows increasing demand"
        },
        {
          id: "opt-5",
          item: "Ibuprofen 400mg",
          currentStock: 200,
          recommendedStock: 150,
          saving: 1250,
          reason: "Over-purchasing detected in last three ordering cycles"
        }
      ];
      
      // Update the state
      const now = new Date();
      setOptimizations(sampleOptimizations);
      setLastUpdated(now);
      
      // Cache in localStorage
      localStorage.setItem('inventory-optimizations', JSON.stringify(sampleOptimizations));
      localStorage.setItem('inventory-optimizations-last-updated', now.toISOString());
    } catch (err) {
      console.error('Failed to generate AI optimizations:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const getTotalSavings = () => {
    return optimizations.reduce((acc, curr) => acc + curr.saving, 0);
  };
  
  const getEfficiencyScore = () => {
    const total = optimizations.length;
    const needAction = optimizations.filter(opt => opt.saving !== 0).length;
    return Math.round(((total - needAction) / total) * 100);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md font-medium flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
            AI Inventory Insights
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Powered by AI
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Inventory Efficiency</span>
                <span className="text-sm">{getEfficiencyScore()}%</span>
              </div>
              <Progress value={getEfficiencyScore()} className="h-2" />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {getTotalSavings() > 0 ? 'Potential Savings' : 'Required Investment'}
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    ${Math.abs(getTotalSavings()).toLocaleString()}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => {}}
                >
                  Take Action
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
              {lastUpdated && (
                <p className="text-xs text-blue-600 mt-2">
                  Last updated: {lastUpdated.toLocaleDateString()} at {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            
            <ul className="space-y-3 max-h-[250px] overflow-y-auto">
              {optimizations.map(opt => (
                <li key={opt.id} className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{opt.item}</h4>
                      <p className="text-xs text-gray-600 mt-1">{opt.reason}</p>
                    </div>
                    <Badge 
                      variant={opt.saving > 0 ? "success" : opt.saving < 0 ? "warning" : "secondary"}
                      className={opt.saving > 0 ? "bg-green-100 text-green-800 border-green-200" : 
                        opt.saving < 0 ? "bg-amber-100 text-amber-800 border-amber-200" : ""}
                    >
                      {opt.saving > 0 ? 'Reduce' : opt.saving < 0 ? 'Increase' : 'Optimal'} by {Math.abs(opt.recommendedStock - opt.currentStock)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
};
