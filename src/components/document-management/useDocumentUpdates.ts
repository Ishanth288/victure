
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemDocument } from "./types";

export function useDocumentUpdates(currentUserId: string | null, documents: SystemDocument[]) {
  const [updatedDocuments, setUpdatedDocuments] = useState<SystemDocument[]>(documents);

  useEffect(() => {
    if (!currentUserId) return;
    
    const setupRealtimeSubscriptions = async () => {
      const channel = supabase.channel('document-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'inventory', filter: `user_id=eq.${currentUserId}` }, 
          () => updateDocumentLastUpdated('inventory')
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${currentUserId}` }, 
          () => updateDocumentLastUpdated('sales')
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'purchase_orders', filter: `user_id=eq.${currentUserId}` }, 
          () => updateDocumentLastUpdated('purchase_orders')
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'patients', filter: `user_id=eq.${currentUserId}` }, 
          () => updateDocumentLastUpdated('patients')
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const unsubscribe = setupRealtimeSubscriptions();
    return () => {
      if (unsubscribe) {
        unsubscribe.then(cleanup => cleanup && cleanup());
      }
    };
  }, [currentUserId]);

  useEffect(() => {
    setUpdatedDocuments(documents);
  }, [documents]);

  const updateDocumentLastUpdated = (docType: string) => {
    const now = new Date();
    setUpdatedDocuments(prev => prev.map(doc => 
      doc.id === docType ? { ...doc, lastUpdated: now } : doc
    ));
  };

  const setDocumentLoading = (docType: string, isLoading: boolean) => {
    setUpdatedDocuments(prev => prev.map(doc => 
      doc.id === docType ? { ...doc, isLoading } : doc
    ));
  };

  return { 
    documents: updatedDocuments, 
    setDocuments: setUpdatedDocuments,
    updateDocumentLastUpdated,
    setDocumentLoading
  };
}
