import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBillsQuery } from "@/hooks/queries/useBillsQuery";
import { debugLog } from "@/utils/debugLogger";

export interface BillItem {
  id: number;
  bill_id?: number;
  inventory_item_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  return_quantity?: number;
  inventory_item?: {
    name: string;
    unit_cost: number;
  };
}

export interface Bill {
  id: number;
  bill_number: string;
  prescription_id: number | null;
  subtotal: number;
  gst_amount: number;
  gst_percentage: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  date: string;
  user_id: string;
  // Related data
  prescription?: {
    id: number;
    prescription_number: string;
    doctor_name: string;
    patient_id: number;
    patient?: {
      id: number;
      name: string;
      phone_number: string;
    };
  };
  bill_items?: BillItem[];
  // Computed fields
  effective_amount?: number;
  original_amount?: number;
  return_value?: number;
}

export interface PrescriptionBill {
  id: number;
  bill_id: number;
  bill_number: string;
  amount: number;
  original_amount: number;
  return_value: number;
  date: string;
  prescription_id: number | null;
  prescription_number: string;
  doctor_name: string;
  status: string;
  patient: {
    name: string;
    phone_number: string;
  };
  bill_items: BillItem[];
  display_date: Date;
}

interface BillingContextType {
  bills: Bill[];
  prescriptionBills: PrescriptionBill[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  connectionQuality: 'fast' | 'slow' | 'unknown';
  
  // Actions
  refreshBills: () => Promise<void>;
  addBill: (bill: Bill) => void;
  
  // Real-time status
  isConnected: boolean;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

interface BillingProviderProps {
  children: ReactNode;
}

export const BillingProvider = ({ children }: BillingProviderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use React Query hook for data fetching - this provides automatic caching and parallelism
  const {
    data: queryData,
    isLoading,
    error: queryError,
    refetch,
    isFetched
  } = useBillsQuery(user?.id || null);
  
  // Extract data from query result
  const bills = queryData?.bills || [];
  const prescriptionBills = queryData?.prescriptionBills || [];
  const error = queryError?.message || null;
  const lastUpdated = bills.length > 0 ? new Date() : null;
  const connectionQuality: 'fast' | 'slow' | 'unknown' = error ? 'slow' : 'fast';
  const isConnected = !error;
  
  // Realtime subscription for live updates
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // Setup realtime subscription for live updates
  const setupRealtimeSubscription = useCallback(async (userId: string) => {
if (!userId || channelRef.current || !isFetched) return;

    try {
      debugLog.log("Setting up realtime bills subscription");
      
      const channel = supabase
        .channel(`bills_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bills',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (!mountedRef.current) return;
            
            debugLog.log('Real-time bills update:', payload.eventType);
            
            // Trigger a refetch when bills change
            refetch();
          }
        )
        .subscribe((status) => {
          debugLog.log('Bills subscription status:', status);
        });

      channelRef.current = channel;
    } catch (error) {
        debugLog.warn("Error setting up realtime bills subscription:", error);
      }
  }, [refetch, isFetched]);

  // Cleanup channel
  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      debugLog.log("Cleaning up bills subscription");
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Refresh function that uses React Query's refetch
  const refreshBills = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Add bill function to prevent duplicates
  const addBill = useCallback((newBill: Bill) => {
    // Since we're using React Query, we just trigger a refetch
    // The real-time subscription will handle the update automatically
    refetch();
  }, [refetch]);

  // Setup realtime subscription when user is available and initial fetch is complete
  useEffect(() => {
    if (!user?.id) return;

    setupRealtimeSubscription(user.id);

    return () => {
      cleanupChannel();
    };
  }, [user?.id, setupRealtimeSubscription, cleanupChannel, isFetched]);

  // Auth state change handler
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        cleanupChannel();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [cleanupChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanupChannel();
    };
  }, [cleanupChannel]);

  const value: BillingContextType = {
    bills,
    prescriptionBills,
    isLoading,
    error,
    lastUpdated,
    connectionQuality,
    isConnected,
    refreshBills,
    addBill,
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
};
