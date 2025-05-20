
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Recommendation {
  id: string;
  medicine: string;
  reason: string;
  confidence: number;
}

export const PrescriptionRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simulated AI recommendations based on patient data and recent prescriptions
  const generateRecommendations = () => {
    // In a real implementation, this would call an actual ML model
    // This is a simulation for demonstration purposes
    const sampleRecommendations = [
      {
        id: "rec-1",
        medicine: "Amlodipine 5mg",
        reason: "Patient's blood pressure readings show consistent elevation",
        confidence: 0.89
      },
      {
        id: "rec-2",
        medicine: "Metformin 500mg",
        reason: "Blood glucose levels indicate pre-diabetic condition",
        confidence: 0.78
      },
      {
        id: "rec-3",
        medicine: "Vitamin D3 1000IU",
        reason: "Lab results show deficiency; common in your region",
        confidence: 0.92
      }
    ];
    
    return sampleRecommendations;
  };
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In a production environment, this would be an actual API call
        const data = generateRecommendations();
        setRecommendations(data);
        setError(null);
      } catch (err) {
        console.error("Failed to get AI recommendations:", err);
        setError("Could not load recommendations at this time");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, []);
  
  const handleFeedback = (id: string, positive: boolean) => {
    // In a real app, this would send feedback to improve the model
    console.log(`Feedback for recommendation ${id}: ${positive ? 'positive' : 'negative'}`);
    
    // Remove the recommendation after feedback
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md font-medium flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
            AI Prescription Insights
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            Powered by AI
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center p-3 bg-red-50 text-red-700 rounded-md">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-3">
            No new recommendations at this time
          </p>
        ) : (
          <ul className="space-y-3">
            {recommendations.map(rec => (
              <li key={rec.id} className="p-3 bg-purple-50 border border-purple-100 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">{rec.medicine}</h4>
                    <p className="text-xs text-gray-600 mt-1">{rec.reason}</p>
                    <div className="mt-1">
                      <span className="text-xs text-purple-700 bg-purple-100 rounded-full px-2 py-0.5">
                        {Math.round(rec.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFeedback(rec.id, true)}
                      className="h-7 w-7 p-0 rounded-full"
                    >
                      <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                      <span className="sr-only">Helpful</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFeedback(rec.id, false)}
                      className="h-7 w-7 p-0 rounded-full"
                    >
                      <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                      <span className="sr-only">Not helpful</span>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
