
import { useState, useEffect } from "react";

export function usePreloadData() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    // Simple timer instead of complex data loading
    const timer = setTimeout(() => {
      setIsDataLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { isDataLoaded };
}
