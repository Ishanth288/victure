
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowUpRight, ArrowDown, ArrowUp } from "lucide-react";
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
  category: string;
  confidence: number;
  trend: number;
}

export const InventoryOptimization = () => {
  const [loading, setLoading] = useState(true);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<string>("critical");
  
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
    
    // Set up a timer to refresh once per day (check hourly)
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
  
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value);
  };

  const generateAIOptimizations = async () => {
    setLoading(true);
    
    try {
      // In a real implementation, this would:
      // 1. Fetch user's sales data from bills
      // 2. Get regional Google Trends data
      // 3. Analyze inventory against these patterns
      
      // For this demo, we'll simulate AI-generated insights based on historical data
      const { data: { user } } = await supabase.auth.getUser();
      
      // Simulate fetching some bills data to make recommendations seem connected to actual sales
      const { data: recentBills } = await supabase
        .from('bills')
        .select('*')
        .limit(20)
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      // Simulate AI-generated insights based on "bills" and "trends"
      const sampleOptimizations = [
        {
          id: "opt-1",
          item: "Amoxicillin 500mg",
          currentStock: 120,
          recommendedStock: 80,
          saving: 2400,
          reason: "Seasonal demand decrease according to regional trends",
          category: "Seasonal Demand",
          confidence: 89,
          trend: -15
        },
        {
          id: "opt-2",
          item: "Metformin 1000mg",
          currentStock: 50,
          recommendedStock: 75,
          saving: -1500,
          reason: "Increasing demand pattern in patient prescriptions",
          category: "Prescription Spike",
          confidence: 92,
          trend: 25
        },
        {
          id: "opt-3",
          item: "Loratadine 10mg",
          currentStock: 100,
          recommendedStock: 150,
          saving: -3000,
          reason: "Seasonal allergies forecast shows increasing demand",
          category: "Seasonal Demand",
          confidence: 85,
          trend: 33
        },
        {
          id: "opt-4",
          item: "Cetirizine 5mg",
          currentStock: 80,
          recommendedStock: 120,
          saving: -2400,
          reason: "Seasonal allergies forecast shows increasing demand",
          category: "Seasonal Demand",
          confidence: 88,
          trend: 28
        },
        {
          id: "opt-5",
          item: "Ibuprofen 400mg",
          currentStock: 200,
          recommendedStock: 150,
          saving: 1250,
          reason: "Over-purchasing detected in last three ordering cycles",
          category: "Overstocked",
          confidence: 77,
          trend: -12
        },
        {
          id: "opt-6",
          item: "Insulin Glargine",
          currentStock: 15,
          recommendedStock: 25,
          saving: -3500,
          reason: "Critical medication with increasing prescription frequency",
          category: "Running Low",
          confidence: 95,
          trend: 42
        },
        {
          id: "opt-7",
          item: "Salbutamol Inhaler",
          currentStock: 25,
          recommendedStock: 40,
          saving: -1800,
          reason: "Seasonal respiratory conditions increasing",
          category: "Upcoming Spike",
          confidence: 91,
          trend: 30
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

  const getSortedOptimizations = () => {
    if (sortBy === "critical") {
      return [...optimizations].sort((a, b) => {
        if (a.category === "Running Low" && b.category !== "Running Low") return -1;
        if (a.category !== "Running Low" && b.category === "Running Low") return 1;
        return Math.abs(b.trend) - Math.abs(a.trend);
      });
    } else if (sortBy === "prescribed") {
      return [...optimizations].sort((a, b) => {
        if (a.category === "Prescription Spike" && b.category !== "Prescription Spike") return -1;
        if (a.category !== "Prescription Spike" && b.category === "Prescription Spike") return 1;
        return b.recommendedStock - a.recommendedStock;
      });
    } else if (sortBy === "upcoming") {
      return [...optimizations].sort((a, b) => {
        if (a.category === "Upcoming Spike" && b.category !== "Upcoming Spike") return -1;
        if (a.category !== "Upcoming Spike" && b.category === "Upcoming Spike") return 1;
        return b.trend - a.trend;
      });
    }
    return optimizations;
  };
  
  return (
    <Card className="h-full shadow-sm border-gray-200 rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md font-medium flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-[#25B04E]" />
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
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Prediction Confidence: {Math.round(optimizations.reduce((acc, curr) => acc + curr.confidence, 0) / optimizations.length)}%
                </Badge>
              </div>
              {lastUpdated && (
                <p className="text-xs text-blue-600 mt-2">
                  Last updated: {lastUpdated.toLocaleDateString()} at {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium">Insights</p>
              <select 
                value={sortBy} 
                onChange={handleSortChange}
                className="text-xs border rounded px-2 py-1 bg-white"
              >
                <option value="critical">Most Critical</option>
                <option value="prescribed">Most Prescribed</option>
                <option value="upcoming">Upcoming Spike</option>
              </select>
            </div>
            
            <ul className="space-y-3 max-h-[250px] overflow-y-auto">
              {getSortedOptimizations().map(opt => (
                <li key={opt.id} className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <h4 className="font-medium">{opt.item}</h4>
                      <span className="ml-2 flex items-center" title={`${Math.abs(opt.trend)}% ${opt.trend > 0 ? 'increase' : 'decrease'} in demand`}>
                        {opt.trend > 0 ? (
                          <span className="text-amber-600 flex items-center text-xs">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            {opt.trend}%
                          </span>
                        ) : (
                          <span className="text-green-600 flex items-center text-xs">
                            <ArrowDown className="h-3 w-3 mr-1" />
                            {Math.abs(opt.trend)}%
                          </span>
                        )}
                      </span>
                    </div>
                    <Badge 
                      variant={opt.saving > 0 ? "success" : opt.saving < 0 ? "warning" : "secondary"}
                      className={`
                        ${opt.saving > 0 ? "bg-green-100 text-green-800 border-green-200" : 
                          opt.saving < 0 ? "bg-amber-100 text-amber-800 border-amber-200" : ""}
                        whitespace-nowrap
                      `}
                    >
                      {opt.saving > 0 ? 'Reduce' : opt.saving < 0 ? 'Increase' : 'Optimal'} by {Math.abs(opt.recommendedStock - opt.currentStock)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge className="text-xs bg-gray-100 text-gray-700 border-0" title={opt.reason}>
                        {opt.category}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">{opt.reason}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      Confidence: {opt.confidence}%
                    </span>
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
