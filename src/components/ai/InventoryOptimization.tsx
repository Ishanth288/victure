
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const InventoryOptimization = () => {
  const [loading, setLoading] = useState(false);
  const [optimizations, setOptimizations] = useState([
    {
      id: "opt-1",
      item: "Amoxicillin 500mg",
      currentStock: 120,
      recommendedStock: 80,
      saving: 2400,
      reason: "Historical demand patterns show consistent overstocking"
    },
    {
      id: "opt-2",
      item: "Metformin 1000mg",
      currentStock: 50,
      recommendedStock: 75,
      saving: -1500,
      reason: "Out-of-stock occurrences in the last 3 months"
    },
    {
      id: "opt-3",
      item: "Loratadine 10mg",
      currentStock: 100,
      recommendedStock: 150,
      saving: -3000,
      reason: "Seasonal demand increase expected in the next 30 days"
    }
  ]);
  
  const handleRefresh = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update with new "AI" recommendations
    setOptimizations([
      ...optimizations,
      {
        id: "opt-4",
        item: "Cetirizine 5mg",
        currentStock: 80,
        recommendedStock: 120,
        saving: -2400,
        reason: "Seasonal allergies forecast shows increasing demand"
      }
    ]);
    
    setLoading(false);
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
        
        <div className="mt-4 text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="text-gray-600"
          >
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Refresh Insights'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
