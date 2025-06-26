
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBillsQuery } from "@/hooks/queries/useBillsQuery";

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
  
  // Real-time status
  isConnected: boolean;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

interface BillingProviderProps {
  children: ReactNode;
}

export function BillingProvider({ children }: BillingProviderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use React Query hook for data fetching - this provides automatic caching and parallelism
  const {
    data: queryData,
    isLoading,
    error: queryError,
    refetch
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

  // Transform bill to prescription bill format
  const transformBillToPrescriptionBill = useCallback((bill: Bill): PrescriptionBill => {
    const totalReturnValue = bill.bill_items?.reduce((sum, item) => {
      const returnQuantity = item.return_quantity || 0;
      const returnValue = returnQuantity * item.unit_price;
      return sum + returnValue;
    }, 0) || 0;
    
    const effectiveAmount = bill.total_amount - totalReturnValue;
    const billDate = new Date(bill.date);
    
    return {
      id: bill.id,
      bill_id: bill.id,
      bill_number: bill.bill_number,
      amount: effectiveAmount,
      original_amount: bill.total_amount,
      return_value: totalReturnValue,
      date: bill.date,
      prescription_id: bill.prescription_id,
      prescription_number: bill.prescription?.prescription_number || 'Unknown',
      doctor_name: bill.prescription?.doctor_name || 'Not Specified',
      status: bill.status,
      patient: bill.prescription?.patient || { name: 'Unknown', phone_number: 'Unknown' },
      bill_items: bill.bill_items || [],
      display_date: billDate
    };
  }, []);

  // Optimistic UI helpers
  const addBill = useCallback((newBill: Bill) => {
    setBills(prev => {
      const exists = prev.find(b => b.id === newBill.id);
      if (exists) return prev;
      
      const sortedBills = [newBill, ...prev].sort((a, b) => {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        if (bTime !== aTime) return bTime - aTime;
        return b.id - a.id;
      });
      return sortedBills;
    });
    
    // Also update prescription bills
    if (newBill.prescription) {
      const prescriptionBill = transformBillToPrescriptionBill(newBill);
      setPrescriptionBills(prev => {
        const exists = prev.find(p => p.bill_id === newBill.id);
        if (exists) return prev;
        
        const updated = [prescriptionBill, ...prev];
        return updated.sort((a, b) => b.display_date.getTime() - a.display_date.getTime());
      });
    }
    
    setLastUpdated(new Date());
  }, [transformBillToPrescriptionBill]);

  const updateBill = useCallback((billId: number, updates: Partial<Bill>) => {
    setBills(prev => prev.map(bill => 
      bill.id === billId ? { ...bill, ...updates } : bill
    ));
    
    setPrescriptionBills(prev => prev.map(pBill => {
      if (pBill.bill_id === billId) {
        const updatedAmount = updates.total_amount || pBill.amount;
        return { ...pBill, amount: updatedAmount };
      }
      return pBill;
    }));
    
    setLastUpdated(new Date());
  }, []);

  const removeBill = useCallback((billId: number) => {
    setBills(prev => prev.filter(bill => bill.id !== billId));
    setPrescriptionBills(prev => prev.filter(pBill => pBill.bill_id !== billId));
    setLastUpdated(new Date());
  }, []);

  // Fixed fetch bills function with correct column names
  const fetchBills = useCallback(async (userId: string, showProgress = false) => {
    try {
      if (showProgress) {
        console.log("🔄 Fetching bills...");
      }

      const startTime = Date.now();
      
      // Use correct column names - 'date' instead of 'created_at'
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select(`
          *,
          prescriptions (
            id,
            prescription_number,
            doctor_name,
            date,
            status,
            patient_id,
            patients (
              id,
              name,
              phone_number
            )
          ),
          bill_items (
            id,
            inventory_item_id,
            quantity,
            unit_price,
            total_price,
            return_quantity
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('id', { ascending: false });

      if (billsError) {
        throw billsError;
      }

      const fetchDuration = Date.now() - startTime;
      const quality = fetchDuration < 1000 ? 'fast' : fetchDuration < 3000 ? 'medium' : 'slow';

      if (!billsData) {
        console.log("No bills found");
        setBills([]);
        setPrescriptionBills([]);
        return;
      }

      // Transform to prescription bills with proper data structure
      const prescriptionBillsData = billsData.map(bill => {
        const prescription = Array.isArray(bill.prescriptions) ? bill.prescriptions[0] : bill.prescriptions;
        const patient = prescription?.patients ? 
          (Array.isArray(prescription.patients) ? prescription.patients[0] : prescription.patients) : null;
        
        const billDate = bill.date || new Date().toISOString();
        
        return {
          id: bill.id,
          bill_id: bill.id,
          bill_number: bill.bill_number,
          amount: bill.total_amount,
          original_amount: bill.total_amount,
          return_value: bill.bill_items?.reduce((sum, item) => sum + ((item.return_quantity || 0) * item.unit_price), 0) || 0,
          date: billDate,
          prescription_id: prescription?.id || null,
          prescription_number: prescription?.prescription_number || 'Unknown',
          doctor_name: prescription?.doctor_name || 'Unknown',
          status: prescription?.status || 'active',
          patient: patient ? {
            name: patient.name || 'Unknown',
            phone_number: patient.phone_number || 'Unknown'
          } : {
            name: 'Unknown',
            phone_number: 'Unknown'
          },
          bill_items: bill.bill_items || [],
          display_date: new Date(billDate)
        };
      });

      // Sort by date, most recent first
      const sortedBills = prescriptionBillsData.sort((a, b) => {
        return b.display_date.getTime() - a.display_date.getTime();
      });

      setBills(billsData);
      setPrescriptionBills(sortedBills);
      setError(null);
      setLastUpdated(new Date());

      if (showProgress) {
        console.log(`✅ Bills loaded: ${sortedBills.length} total in ${fetchDuration}ms`);
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error);
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch bills";
        setError(errorMessage);
        toast({
          title: "Error Loading Bills",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [toast]);

  // Enhanced refresh function
  const refreshBills = useCallback(async () => {
    if (userIdRef.current) {
      setError(null);
      await fetchBills(userIdRef.current, true);
    }
  }, [fetchBills]);

  // Main initialization effect - only run when auth is ready and user exists
  useEffect(() => {
    if (!ready || !user || isInitialized.current) return;
    
    let mounted = true;
    mountedRef.current = true;

    const initializeBilling = async () => {
      if (!mountedRef.current || isInitialized.current) return;

      try {
        setIsLoading(true);
        setError(null);

        console.log("🔄 Initializing billing context for user:", user.id);

        userIdRef.current = user.id;

        // Fetch bills data
        await fetchBills(user.id, true);

        console.log("✅ Billing context initialized successfully");
        setIsConnected(true);
        isInitialized.current = true;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error("❌ Error initializing billing:", errorMessage);
        setError(errorMessage);
        setIsConnected(false);
        
        // Reset bills on error
        setBills([]);
        setPrescriptionBills([]);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initializeBilling();
    isInitialized.current = true;

    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, [ready, user, fetchBills]);

  // Auth state change handler
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        setBills([]);
        setPrescriptionBills([]);
        userIdRef.current = null;
        setError(null);
        setLastUpdated(null);
        setConnectionQuality('unknown');
        setIsConnected(false);
        isInitialized.current = false;
      } else if (event === 'SIGNED_IN' && session?.user && session.user.id !== userIdRef.current) {
        userIdRef.current = session.user.id;
        setIsLoading(true);
        
        await fetchBills(session.user.id, true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBills]);

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
    updateBill,
    removeBill,
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
}
