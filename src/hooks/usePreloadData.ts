
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePreloadData() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const preloadData = async () => {
      try {
        // Preload user profile data
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          // Preload profile data
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          // Execute the preload operations
          await Promise.all([profilePromise]);
        }
      } catch (error) {
        console.error("Error preloading data:", error);
      } finally {
        setIsDataLoaded(true);
      }
    };

    preloadData();
  }, []);

  return { isDataLoaded };
}
