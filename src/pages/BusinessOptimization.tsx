
import { useState, useCallback } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BusinessOptimizationPage } from "@/components/dashboard/BusinessOptimization";
import { Fallback } from "@/components/ui/fallback";
import { useToast } from "@/hooks/use-toast";

export default function BusinessOptimization() {
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();
  
  const handleError = useCallback((error: Error) => {
    console.error("BusinessOptimization page error:", error);
    setHasError(true);
    toast({
      title: "Something went wrong",
      description: "We encountered an error loading the business data. Please try refreshing.",
      variant: "destructive"
    });
  }, [toast]);

  if (hasError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Fallback 
          message="Business optimization data could not be loaded. Please refresh the page." 
        />
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={<Fallback message="Failed to load business optimization page" />}
      onError={handleError}
    >
      <BusinessOptimizationPage />
    </ErrorBoundary>
  );
}
