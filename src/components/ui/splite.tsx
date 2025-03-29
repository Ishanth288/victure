
'use client'

import { Suspense, lazy, useState, useEffect, memo, useRef } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
  onLoad?: () => void
  onError?: () => void
}

// Memoizing the Spline component to prevent unnecessary re-renders
const SplineComponent = memo(({ scene, onError, onLoad }: any) => {
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  return (
    <Spline 
      scene={scene} 
      onError={() => {
        if (isMounted.current && onError) onError();
      }} 
      onLoad={() => {
        if (isMounted.current && onLoad) onLoad();
      }} 
    />
  );
});

SplineComponent.displayName = 'SplineComponent';

export function SplineScene({ scene, className, onLoad, onError }: SplineSceneProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // Reset error state if scene URL changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    
    return () => {
      mountedRef.current = false;
    };
  }, [scene]);

  const handleError = () => {
    if (!mountedRef.current) return;
    console.log("Spline scene failed to load, showing fallback");
    setHasError(true);
    setIsLoading(false);
    if (onError) onError();
  };

  const handleLoad = () => {
    if (!mountedRef.current) return;
    console.log("Spline scene loaded successfully");
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  // If we had an error loading the scene, show a simple gradient instead
  if (hasError) {
    return (
      <div className={`pharmacy-gradient w-full h-full rounded-xl opacity-20 ${className}`}>
        {/* Fallback gradient background when 3D scene fails to load */}
      </div>
    );
  }

  return (
    <Suspense 
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="loader"></span>
        </div>
      }
    >
      <SplineComponent
        scene={scene}
        onError={handleError}
        onLoad={handleLoad}
      />
    </Suspense>
  )
}
