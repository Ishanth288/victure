
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
}

export const MainContentWrapper = memo(({ 
  children, 
  useFallback = false,
  id,
  className = "",
  loadingMessage,
  loadingHeight
}: MainContentWrapperProps) => {
  return (
    <section id={id} className={className}>
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
        {children}
      </Suspense>
    </section>
  );
});

MainContentWrapper.displayName = 'MainContentWrapper';
