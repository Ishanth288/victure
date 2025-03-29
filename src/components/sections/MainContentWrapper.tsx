
import { Suspense, memo, ReactNode, Component, ErrorInfo } from "react";
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

// Proper React error boundary implementation
class ErrorBoundaryWrapper extends Component<{ 
  children: ReactNode; 
  onError?: (error: Error) => void 
}, { 
  hasError: boolean,
  error: Error | null
}> {
  constructor(props: { children: ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error);
    }
    console.error("Component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Fallback message="Component failed to load" />;
    }
    return this.props.children;
  }
}
