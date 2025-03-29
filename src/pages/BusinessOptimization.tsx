
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BusinessOptimizationPage } from "@/components/dashboard/BusinessOptimization";

export default function BusinessOptimization() {
  return (
    <ErrorBoundary>
      <BusinessOptimizationPage />
    </ErrorBoundary>
  );
}
