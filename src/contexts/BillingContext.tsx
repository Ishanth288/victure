import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  created_at?: string;
  updated_at?: string;
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
  sort_timestamp?: number;
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
  sort_priority: number;
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
  updateBill: (billId: number, updates: Partial<Bill>) => void;
  removeBill: (billId: number) => void;
  
  // Real-time status
  isConnected: boolean;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

interface BillingProviderProps {
  children: ReactNode;
}

export function BillingProvider({ children }: BillingProviderProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [prescriptionBills, setPrescriptionBills] = useState<PrescriptionBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'slow' | 'unknown'>('unknown');
  const [isConnected, setIsConnected] = useState(false);

  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const isInitialized = useRef(false);

  // Optimistic UI helpers
  const addBill = useCallback((newBill: Bill) => {
    setBills(prev => {
      const sortedBills = [newBill, ...prev].sort((a, b) => {
        const aTime = new Date(a.created_at || a.date).getTime();
        const bTime = new Date(b.created_at || b.date).getTime();
        if (bTime !== aTime) return bTime - aTime;
        return b.id - a.id;
      });
      return sortedBills;
    });
    
    // Also update prescription bills
    if (newBill.prescription) {
      const prescriptionBill = transformBillToPrescriptionBill(newBill);
      setPrescriptionBills(prev => {
        const updated = [prescriptionBill, ...prev.filter(p => p.bill_id !== newBill.id)];
        return sortPrescriptionBills(updated);
      });
    }
    
    setLastUpdated(new Date());
  }, []);

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

  // Transform bill to prescription bill format
  const transformBillToPrescriptionBill = useCallback((bill: Bill): PrescriptionBill => {
    const totalReturnValue = bill.bill_items?.reduce((sum, item) => {
      const returnQuantity = item.return_quantity || 0;
      const returnValue = returnQuantity * item.unit_price;
      return sum + returnValue;
    }, 0) || 0;
    
    const effectiveAmount = bill.total_amount - totalReturnValue;
    const billDate = new Date(bill.created_at || bill.date);
    
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
      sort_priority: billDate.getTime(),
      display_date: billDate
    };
  }, []);

  // Enhanced sorting function
  const sortPrescriptionBills = useCallback((bills: PrescriptionBill[]): PrescriptionBill[] => {
    return bills.sort((a, b) => {
      // Primary sort: by full timestamp (date + time)
      const timeDiff = b.sort_priority - a.sort_priority;
      if (timeDiff !== 0) return timeDiff;
      
      // Secondary sort: by bill ID (newer bills have higher IDs)
      return b.id - a.id;
    });
  }, []);

  // Fetch bills with enhanced sorting
  const fetchBills = useCallback(async (userId: string, showProgress = false) => {
    if (!userId || !mountedRef.current) return;

    try {
      if (showProgress) {
        setIsLoading(true);
      }

      console.log("🔄 Fetching bills for user:", userId);
      const startTime = Date.now();

      // Step 1: Fetch bills with prescriptions and patients - avoiding bill_items relationship ambiguity
      const { data: billsData, error: billsError } = await supabase
        .from("bills")
        .select(`
          *,
          prescriptions (
            id,
            prescription_number,
            doctor_name,
            patient_id,
            date,
            status,
            patients (
              id,
              name, 
              phone_number
            )
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(500);

      if (billsError) {
        throw new Error(`Failed to fetch bills: ${billsError.message}`);
      }

      // Step 2: Fetch bill items separately to avoid relationship ambiguity
      let billItemsData: any[] = [];
      let inventoryData: any[] = [];

      if (billsData && billsData.length > 0) {
        const billIds = billsData.map(bill => bill.id);

        // Fetch bill items for these bills
        const { data: items, error: itemsError } = await supabase
          .from("bill_items")
          .select(`
            id,
            bill_id,
            quantity,
            unit_price,
            total_price,
            return_quantity,
            inventory_item_id
          `)
          .in("bill_id", billIds);

        if (itemsError) {
          console.warn("Error fetching bill items:", itemsError);
        } else {
          billItemsData = items || [];
        }

        // Step 3: Fetch inventory data for all inventory items
        if (billItemsData.length > 0) {
          const inventoryIds = [...new Set(billItemsData.map(item => item.inventory_item_id))];
          
          const { data: inventory, error: inventoryError } = await supabase
            .from("inventory")
            .select(`
              id,
              name,
              unit_cost
            `)
            .in("id", inventoryIds);

          if (inventoryError) {
            console.warn("Error fetching inventory:", inventoryError);
          } else {
            inventoryData = inventory || [];
          }
        }
      }

      const fetchDuration = Date.now() - startTime;
      const quality = fetchDuration < 2000 ? 'fast' : 'slow';
      setConnectionQuality(quality);

      if (mountedRef.current && billsData) {
        // Create lookup maps for efficient data joining
        const inventoryMap = new Map(inventoryData.map(inv => [inv.id, inv]));
        const billItemsMap = new Map<number, any[]>();
        
        // Group bill items by bill_id
        billItemsData.forEach(item => {
          if (!billItemsMap.has(item.bill_id)) {
            billItemsMap.set(item.bill_id, []);
          }
          billItemsMap.get(item.bill_id)?.push(item);
        });

        // Enhanced bills with computed fields and normalized structure
        const enhancedBills: Bill[] = (billsData as any[]).map((bill: any) => {
          // Normalize the prescription data (from array to single object)
          const prescription = bill.prescriptions && bill.prescriptions.length > 0 ? {
            ...bill.prescriptions[0],
            patient: bill.prescriptions[0].patients && bill.prescriptions[0].patients.length > 0 
              ? bill.prescriptions[0].patients[0] 
              : null
          } : null;

          // Get bill items for this bill and attach inventory data
          const billItems = billItemsMap.get(bill.id) || [];
          const normalizedBillItems = billItems.map((item: any) => ({
            ...item,
            inventory_item: inventoryMap.get(item.inventory_item_id) || { name: 'Unknown', unit_cost: 0 }
          }));

          return {
            ...bill,
            prescription,
            bill_items: normalizedBillItems,
            created_at: bill.created_at || bill.date,
            updated_at: bill.updated_at || bill.date,
            sort_timestamp: new Date(bill.created_at || bill.date).getTime(),
            effective_amount: bill.total_amount - (normalizedBillItems.reduce((sum: number, item: any) => 
              sum + ((item.return_quantity || 0) * item.unit_price), 0) || 0),
            original_amount: bill.total_amount,
            return_value: normalizedBillItems.reduce((sum: number, item: any) => 
              sum + ((item.return_quantity || 0) * item.unit_price), 0) || 0
          };
        });

        // Transform to prescription bills
        const prescriptionBillsData = enhancedBills
          .filter(bill => bill.prescription)
          .map(transformBillToPrescriptionBill);

        // Sort both datasets
        const sortedBills = enhancedBills.sort((a, b) => {
          const aTime = a.sort_timestamp || 0;
          const bTime = b.sort_timestamp || 0;
          if (bTime !== aTime) return bTime - aTime;
          return b.id - a.id;
        });

        const sortedPrescriptionBills = sortPrescriptionBills(prescriptionBillsData);

        setBills(sortedBills);
        setPrescriptionBills(sortedPrescriptionBills);
        setError(null);
        setLastUpdated(new Date());

        console.log(`✅ Bills loaded: ${sortedBills.length} total, ${sortedPrescriptionBills.length} with prescriptions in ${fetchDuration}ms (${quality})`);
        
        // Log first few for debugging
        console.log("🔢 Recent bills:", sortedBills.slice(0, 3).map(b => ({ 
          bill_number: b.bill_number, 
          date: b.date,
          created_at: b.created_at,
          amount: b.total_amount
        })));
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
  }, [toast, transformBillToPrescriptionBill, sortPrescriptionBills]);

  // Enhanced real-time subscription
  const setupRealtimeSubscription = useCallback(async (userId: string) => {
    if (!userId || channelRef.current) return;

    try {
      console.log("📡 Setting up billing real-time subscription");
      
      const channel = supabase
        .channel(`billing_realtime_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bills',
            filter: `user_id=eq.${userId}`,
          },
          async (payload: any) => {
            if (!mountedRef.current) return;
            
            console.log('📡 Real-time bill update:', payload.eventType, payload.new?.bill_number || 'unknown');
            
            if (payload.eventType === 'INSERT' && payload.new) {
              // Fetch the bill data without problematic relationships
              const { data: newBillData, error: billError } = await supabase
                .from("bills")
                .select(`
                  *,
                  prescriptions (
                    id,
                    prescription_number,
                    doctor_name,
                    patient_id,
                    date,
                    status,
                    patients (
                      id,
                      name, 
                      phone_number
                    )
                  )
                `)
                .eq("id", payload.new.id)
                .single();
              
              if (!billError && newBillData) {
                // Fetch bill items separately
                const { data: billItems, error: itemsError } = await supabase
                  .from("bill_items")
                  .select(`
                    id,
                    bill_id,
                    quantity,
                    unit_price,
                    total_price,
                    return_quantity,
                    inventory_item_id
                  `)
                  .eq("bill_id", payload.new.id);

                // Fetch inventory data for bill items
                let inventoryData: any[] = [];
                if (!itemsError && billItems && billItems.length > 0) {
                  const inventoryIds = [...new Set(billItems.map((item: any) => item.inventory_item_id))];
                  const { data: inventory } = await supabase
                    .from("inventory")
                    .select("id, name, unit_cost")
                    .in("id", inventoryIds);
                  inventoryData = inventory || [];
                }

                // Normalize the data structure for real-time updates
                const bill = newBillData as any;
                const prescription = bill.prescriptions && bill.prescriptions.length > 0 ? {
                  ...bill.prescriptions[0],
                  patient: bill.prescriptions[0].patients && bill.prescriptions[0].patients.length > 0 
                    ? bill.prescriptions[0].patients[0] 
                    : null
                } : null;

                // Create inventory lookup map
                const inventoryMap = new Map(inventoryData.map(inv => [inv.id, inv]));
                
                const normalizedBillItems = (billItems || []).map((item: any) => ({
                  ...item,
                  inventory_item: inventoryMap.get(item.inventory_item_id) || { name: 'Unknown', unit_cost: 0 }
                }));

                const enhancedBill: Bill = {
                  ...bill,
                  prescription,
                  bill_items: normalizedBillItems,
                  created_at: bill.created_at || bill.date,
                  updated_at: bill.updated_at || bill.date,
                  sort_timestamp: new Date(bill.created_at || bill.date).getTime(),
                  effective_amount: bill.total_amount,
                  original_amount: bill.total_amount,
                  return_value: 0
                };
                
                addBill(enhancedBill);
                
                toast({
                  title: "New Bill Created",
                  description: `Bill ${enhancedBill.bill_number} has been added`,
                  duration: 4000,
                });
              }
            } else if (payload.eventType === 'DELETE' && payload.old) {
              removeBill(payload.old.id);
              toast({
                title: "Bill Deleted",
                description: "A bill has been removed",
                duration: 3000,
              });
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              updateBill(payload.new.id, payload.new);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bill_items',
          },
          (payload: any) => {
            if (!mountedRef.current) return;
            
            console.log('📡 Bill items updated, refreshing data');
            // When bill items change, we need to refresh to recalculate amounts
            setTimeout(() => {
              if (mountedRef.current) {
                fetchBills(userId);
              }
            }, 500);
          }
        )
        .subscribe((status) => {
          console.log('📡 Billing subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setConnectionQuality('fast');
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            setConnectionQuality('slow');
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error("Error setting up billing realtime subscription:", error);
      setConnectionQuality('slow');
      setIsConnected(false);
    }
  }, [addBill, updateBill, removeBill, fetchBills, toast]);

  // Cleanup channel
  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      console.log("🧹 Cleaning up billing subscription");
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Enhanced refresh function
  const refreshBills = useCallback(async () => {
    if (userIdRef.current) {
      setError(null);
      await fetchBills(userIdRef.current, true);
    }
  }, [fetchBills]);

  // Main initialization effect
  useEffect(() => {
    if (isInitialized.current) return;
    
    let mounted = true;
    mountedRef.current = true;

    const initializeBilling = async () => {
      try {
        // Add timeout for authentication check
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication timeout')), 10000)
        );
        
        const { data: { user }, error: authError } = await Promise.race([
          authPromise,
          timeoutPromise
        ]) as any;
        
        if (authError) {
          console.warn('Authentication check failed:', authError.message);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (!user) {
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        userIdRef.current = user.id;

        if (mounted) {
          // Use timeout for data fetching
          const fetchPromise = fetchBills(user.id, true);
          const fetchTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Data fetch timeout')), 15000)
          );
          
          try {
            await Promise.race([fetchPromise, fetchTimeoutPromise]);
          } catch (error) {
            console.warn('Initial fetch timeout, will retry:', error);
            // Don't fail completely, just set loading to false
            if (mounted) {
              setIsLoading(false);
              setError('Initial load was slow, please refresh if needed');
            }
          }
          
          await setupRealtimeSubscription(user.id);
        }
      } catch (error) {
        console.error("Error initializing billing:", error);
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : "Failed to initialize billing";
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    initializeBilling();
    isInitialized.current = true;

    return () => {
      mounted = false;
      mountedRef.current = false;
      cleanupChannel();
    };
  }, [fetchBills, setupRealtimeSubscription, cleanupChannel]);

  // Auth state change handler
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        cleanupChannel();
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
        await setupRealtimeSubscription(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBills, setupRealtimeSubscription, cleanupChannel]);

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