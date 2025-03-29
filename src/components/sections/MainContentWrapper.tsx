
import { Suspense, memo, ReactNode } from "react";
import { LoadingPlaceholder } from "@/components/ui/loading-placeholder";
import { Fallback } from "@/components/ui/fallback";

interface MainContentWrapperProps {
  children: ReactNode;
  useFallback?: boolean;
  id?: string;
  className?: string;
  loadingMessage?: string;
  loadingHeight?: string;
  onError?: (error: Error) => void;
}

export const MainContentWrapper = memo(({ 
  children, 
  useFallback = false,
  id,
  className = "",
  loadingMessage,
  loadingHeight,
  onError
}: MainContentWrapperProps) => {
  return (
    <section id={id} className={`${className} gpu-accelerated`}>
      <Suspense fallback={
        useFallback ? (
          <Fallback />
        ) : (
          <LoadingPlaceholder 
            height={loadingHeight} 
            message={loadingMessage} 
          />
        )
      }>
        <ErrorBoundaryWrapper onError={onError}>
          {children}
        </ErrorBoundaryWrapper>
      </Suspense>
    </section>
  );
});

MainContentWrapper.displayName = 'MainContentWrapper';

// Simple error boundary to prevent entire app from crashing
const ErrorBoundaryWrapper = ({ 
  children, 
  onError 
}: { 
  children: ReactNode; 
  onError?: (error: Error) => void 
}) => {
  try {
    return <>{children}</>;
  } catch (error) {
    if (onError && error instanceof Error) {
      onError(error);
    }
    return <Fallback message="Component failed to load" />;
  }
};
