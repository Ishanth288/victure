
'use client'

import { Suspense, lazy, useState, useEffect } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset error state if scene URL changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [scene]);

  const handleError = () => {
    console.log("Spline scene failed to load, showing fallback");
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    console.log("Spline scene loaded successfully");
    setIsLoading(false);
  };

  // If we had an error loading the scene, show a simple gradient instead
  if (hasError) {
    return (
      <div className={`pharmacy-gradient w-full h-full rounded-xl opacity-30 ${className}`}>
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
      <Spline
        scene={scene}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
      />
    </Suspense>
  )
}
