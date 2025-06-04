
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "You're back online. Data will sync automatically.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection Lost",
        description: "You're offline. Changes will sync when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Supabase connection periodically
    const checkSupabaseConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        if (!isSupabaseConnected) {
          setIsSupabaseConnected(true);
          toast({
            title: "Database Connected",
            description: "Connection to database restored.",
          });
        }
      } catch (error) {
        console.error('Supabase connection check failed:', error);
        if (isSupabaseConnected) {
          setIsSupabaseConnected(false);
          toast({
            title: "Database Connection Issue",
            description: "Having trouble connecting to database. Retrying...",
            variant: "destructive",
          });
        }
      }
    };

    const connectionCheckInterval = setInterval(checkSupabaseConnection, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionCheckInterval);
    };
  }, [isSupabaseConnected, toast]);

  return { isOnline, isSupabaseConnected };
}
