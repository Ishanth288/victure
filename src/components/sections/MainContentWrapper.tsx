
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
    <section id={id} className={`${className}`}>
      <Suspense fallback={
        useFallback ? (
          <div>
            <Fallback />
          </div>
        ) : (
          <div>
            <LoadingPlaceholder 
              height={loadingHeight} 
              message={loadingMessage} 
            />
          </div>
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

// Simplified Error Boundary implementation
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
    console.error("Component error:", error);
  }

  render() {
    if (this.state.hasError) {
      return <div>
        <Fallback message="Component failed to load" />
      </div>;
    }
    return this.props.children;
  }
}
