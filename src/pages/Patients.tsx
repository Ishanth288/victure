import { useState, useMemo, useCallback } from "react";
import { addDays, format } from "date-fns";

import Skeleton from "@/components/ui/skeleton-loader";
import { Input } from "@/components/ui/input";
import { PatientList } from "@/components/patients/PatientList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { BillPreviewDialog } from "@/components/billing/BillPreviewDialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { logPatientDeletion, logPrescriptionDeletion } from "@/utils/deletionTracker";
import { useBilling } from "@/contexts/BillingContext";
import { usePatientsQuery } from "@/hooks/queries/usePatientsQuery";
import { useAuth } from "@/hooks/useAuth";
import { Patient } from "@/types/patients";

export default function Patients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshBills, isLoading: billingLoading } = useBilling();

  
  // Debug logging
  console.log('🔍 Patients Debug:', {
    user: user,
    userId: user?.id,
    userEmail: user?.email
  });
  
  // Use new patients query
  const { 
    data: patientsData = [], 
    isLoading: patientsLoading, 
    error: patientsError,
    refetch: refreshPatients
  } = usePatientsQuery(user?.id || null);
  
  // Debug patient data
  console.log('👥 Patients Data:', {
    patientsData,
    patientsCount: patientsData.length,
    patientsLoading,
    patientsError
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const patients = useMemo(() => {
    if (!patientsData) return [];
    
    // First, process the patient data
    const processedPatients = patientsData.map(patient => {
        const totalSpent = (patient.prescriptions || []).reduce((acc, prescription) => {
          return acc + (prescription.bills || []).reduce((billAcc, bill) => {
            // Safely handle potential type mismatches by checking bill structure
            if (bill && typeof bill === 'object' && 'total_amount' in bill && bill.total_amount != null) {
              const amount = parseFloat(String(bill.total_amount)) || 0;
              return billAcc + amount;
            }
            return billAcc;
          }, 0);
        }, 0);

        return {
          ...patient,
          bills: (patient.prescriptions || []).flatMap(p => p.bills || []),
          total_spent: totalSpent,
          status: 'active', // Add default status to match Patient interface
        };
    });
    
    // Remove duplicates based on phone_number and user_id
    // Keep the patient with the highest total_spent or most recent created_at
    const uniquePatients = processedPatients.reduce((acc, current) => {
      const existingIndex = acc.findIndex(p => 
        p.phone_number === current.phone_number && p.user_id === current.user_id
      );
      
      if (existingIndex === -1) {
        // No duplicate found, add the patient
        acc.push(current);
      } else {
        // Duplicate found, keep the one with higher total_spent or more recent date
        const existing = acc[existingIndex];
        if (current.total_spent > existing.total_spent || 
            (current.total_spent === existing.total_spent && 
             new Date(current.created_at) > new Date(existing.created_at))) {
          acc[existingIndex] = current;
        }
      }
      
      return acc;
    }, [] as typeof processedPatients);
    
    console.log('🔍 Deduplication Results:', {
      original: processedPatients.length,
      afterDedup: uniquePatients.length,
      removed: processedPatients.length - uniquePatients.length
    });
    
    return uniquePatients;
  }, [patientsData]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery) {
      return patients;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(lowercasedQuery) ||
      patient.phone_number.includes(lowercasedQuery)
    );
  }, [searchQuery, patients]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshPatients(), refreshBills()]);
      toast({
        title: "Data Refreshed",
        description: "Latest patients and bills loaded successfully",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [refreshPatients, refreshBills, toast]);

  const handleShowBillPreview = async (billId: number, patient: any, prescription: any) => {
    try {
      const { data: billData, error } = await supabase
        .from("bills")
        .select(`
          *,
          prescriptions (
            *,
            patients (
              name,
              phone_number
            )
          ),
          bill_items!inner (
            *,
            inventory:inventory_item_id (
              name,
              unit_cost
            )
          )
        `)
        .eq("id", billId)
        .single();

      if (error) throw error;

      const prescriptions = Array.isArray(billData.prescriptions) ? billData.prescriptions : [billData.prescriptions].filter(Boolean);
      const patientInfo = prescriptions.length > 0 && prescriptions[0] ? prescriptions[0].patients : null;
      const patientArray = Array.isArray(patientInfo) ? patientInfo : [patientInfo].filter(Boolean);
      const normalizedPatient = patientArray.length > 0 ? patientArray[0] : { name: 'Unknown', phone_number: 'Unknown' };

      const normalizedBillData = {
        ...billData,
        subtotal: billData.subtotal || billData.total_amount || 0,
        gst_amount: billData.gst_amount || 0,
        gst_percentage: billData.gst_percentage || 0,
        discount_amount: billData.discount_amount || 0,
        prescription: prescriptions.length > 0 && prescriptions[0] ? {
          ...prescriptions[0],
          patient: normalizedPatient
        } : null
      };

      const items = billData.bill_items.map((item: any) => {
        const inventory = Array.isArray(item.inventory) ? item.inventory : [item.inventory].filter(Boolean);
        const inventoryItem = inventory.length > 0 && inventory[0] ? inventory[0] : null;
        return {
          id: inventoryItem?.id || 0,
          name: inventoryItem?.name || 'Unknown',
          quantity: item.quantity,
          unit_cost: item.unit_price,
          total: item.total_price,
        };
      });

      setSelectedBill({ ...normalizedBillData, items });
      setShowBillPreview(true);
    } catch (error) {
      console.error("Error fetching bill details:", error);
      toast({
        title: "Error",
        description: "Failed to load bill details",
        variant: "destructive",
      });
    }
  };







  return (
    <div className="container mx-auto px-4 py-8">
      <div className="p-6 space-y-6">
        {/* Header Section with proper semantic HTML */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your patient records efficiently
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button onClick={refreshData} variant="outline" size="sm" disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </header>

        {/* Search Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search by name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6">
            {(patientsLoading || billingLoading) ? (
               <Skeleton className="h-64 w-full" />
            ) : (
              <PatientList
                patients={filteredPatients}
                onViewBill={handleShowBillPreview}
                onPatientDeleted={refreshData}
              />
            )}
          </CardContent>
        </Card>
      </div>
      {showBillPreview && selectedBill && (
        <BillPreviewDialog
          open={showBillPreview}
          onOpenChange={setShowBillPreview}
          billData={selectedBill}
          items={selectedBill.items || []}
        />
      )}

    </div>
  );
}
