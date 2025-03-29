
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeQueryData } from "@/utils/safeSupabaseQueries";
import { SystemDocument } from "./types";

export function useDataFetching(initialDocuments: SystemDocument[]) {
  const [documents, setDocuments] = useState<SystemDocument[]>(initialDocuments);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchLastUpdates(user.id);
      }
    };

    checkAuth();
  }, []);

  const fetchLastUpdates = async (userId: string) => {
    try {
      // Inventory last update - we need to fix this since there's no created_at column
      const { data: inventoryLatest } = await supabase
        .from('inventory')
        .select('id, name')  // Just select id and name since we don't have created_at
        .eq('user_id', userId)
        .order('id', { ascending: false })  // Order by id as a fallback 
        .limit(1)
        .single();

      // Sales last update
      const { data: salesLatest } = await supabase
        .from('bills')
        .select('id, date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      // Purchase orders last update
      const { data: purchaseLatest } = await supabase
        .from('purchase_orders')
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Patients last update
      const { data: patientsLatest } = await supabase
        .from('patients')
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setDocuments(prev => prev.map(doc => {
        if (doc.id === 'inventory' && inventoryLatest) {
          return { ...doc, lastUpdated: new Date() }; // Use current date since we don't have created_at
        }
        if (doc.id === 'sales' && salesLatest) {
          return { ...doc, lastUpdated: new Date(salesLatest.date) };
        }
        if (doc.id === 'purchase_orders' && purchaseLatest) {
          return { ...doc, lastUpdated: new Date(purchaseLatest.created_at) };
        }
        if (doc.id === 'patients' && patientsLatest) {
          return { ...doc, lastUpdated: new Date(patientsLatest.created_at) };
        }
        return doc;
      }));
    } catch (error) {
      console.error("Error fetching document updates:", error);
    }
  };

  return { documents, setDocuments, currentUserId };
}
