
import { useState, useCallback, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BusinessOptimizationPage } from "@/components/dashboard/BusinessOptimization";
import { Fallback } from "@/components/ui/fallback";
import { useToast } from "@/hooks/use-toast";
import { stableToast } from "@/components/ui/stable-toast";

export default function BusinessOptimization() {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  
  // Add fade-in effect to prevent flickering
  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleError = useCallback((error: Error) => {
    console.error("BusinessOptimization page error:", error);
    setHasError(true);
    
    // Use stableToast to prevent duplicate error messages
    stableToast({
      title: "Something went wrong",
      description: "We encountered an error loading the business data. Please try refreshing.",
      variant: "destructive",
      duration: 5000
    });
  }, []);

  if (hasError) {
    return (
      <div className="h-screen flex items-center justify-center transition-opacity duration-300 ease-in-out">
        <Fallback 
          message="Business optimization data could not be loaded. Please refresh the page." 
        />
      </div>
    );
  }

  return (
    <div className={`transition-opacity duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <ErrorBoundary
        fallback={<Fallback message="Failed to load business optimization page" />}
        onError={(error) => handleError(error)}
      >
        <BusinessOptimizationPage />
      </ErrorBoundary>
    </div>
  );
}
