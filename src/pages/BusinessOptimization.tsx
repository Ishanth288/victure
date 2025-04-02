
import { useState, useCallback, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BusinessOptimizationPage } from "@/components/dashboard/BusinessOptimization";
import { Fallback, ErrorFallback } from "@/components/ui/fallback";
import { stableToast } from "@/components/ui/stable-toast";
import { displayErrorMessage } from "@/utils/errorHandling";
import DashboardLayout from "@/components/DashboardLayout";

export default function BusinessOptimization() {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(true); // Set to true by default to avoid unnecessary loading screens
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorDetails, setErrorDetails] = useState<Error | null>(null);
  
  const handleError = useCallback((error: Error) => {
    console.error("BusinessOptimization page error:", error);
    setHasError(true);
    setErrorDetails(error);
    
    // Show error toast with 4 second auto-dismiss
    displayErrorMessage(error, "Business Optimization");
  }, []);

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setHasError(false);
    setErrorDetails(null);
    
    // Force re-mount of the component
    setIsLoaded(false);
    
    stableToast({
      title: "Retrying...",
      description: "Attempting to load business optimization data again.",
      variant: "default"
    });
    
    setTimeout(() => {
      setIsLoaded(true);
      setIsRetrying(false);
    }, 500);
  }, []);

  if (hasError) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center transition-opacity duration-300 ease-in-out">
          <ErrorFallback 
            message="Business optimization data could not be loaded." 
            error={errorDetails}
            onRetry={handleRetry}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={`transition-opacity duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <ErrorBoundary
          fallback={
            <ErrorFallback 
              message="Failed to load business optimization page" 
              onRetry={handleRetry}
            />
          }
          onError={(error) => handleError(error)}
        >
          {isRetrying ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <BusinessOptimizationPage />
          )}
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
