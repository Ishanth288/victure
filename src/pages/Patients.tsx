import React, { useState, useCallback, useMemo } from "react";
import { addDays, format } from "date-fns";

import Skeleton from "@/components/ui/skeleton-loader";
import { Input } from "@/components/ui/input";
import { PatientList } from "@/components/patients/PatientList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { BillPreviewDialog } from "@/components/billing/BillPreviewDialog";
import { 
  AlertDialog,
  AlertDialogAction, 
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trash2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { logPatientDeletion, logPrescriptionDeletion } from "@/utils/deletionTracker";
import { useBilling } from "@/contexts/BillingContext";
import { usePatientsQuery } from "@/hooks/queries/usePatientsQuery";
import { useAuth } from "@/hooks/useAuth";

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
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const patients = useMemo(() => {
    if (!patientsData) return [];
    return patientsData.map(patient => {
        const totalSpent = (patient.prescriptions || []).reduce((acc, prescription) => {
          return acc + (prescription.bills as Array<{total_amount: number}> || []).reduce((billAcc, bill) => billAcc + (parseFloat(String(bill.total_amount)) || 0), 0);
        }, 0);

        return {
          ...patient,
          bills: (patient.prescriptions || []).flatMap(p => p.bills || []),
          total_spent: totalSpent,
          status: 'active', // Add default status to match Patient interface
        };
      });
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

  const handleShowBillPreview = (bill: any) => {
    setSelectedBill(bill);
    setShowBillPreview(true);
  };

  const handleDeletePatient = async () => {
    if (patientToDelete === null) return;

    try {
      // Log the deletion first
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientToDelete)
        .single();

      if (patientError) throw patientError;
      await logPatientDeletion(patientData, 'user_request');

      // Then, delete the patient
      const { error } = await supabase.from('patients').delete().eq('id', patientToDelete);
      if (error) throw error;

      toast({ title: 'Patient Deleted', description: 'The patient has been successfully deleted.' });
      refreshData(); // Refresh data after deletion
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({ title: 'Error', description: 'Failed to delete patient.', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleDeleteAllPatients = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to delete patients",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingAll(true);
    try {
      // First, get all patients for this user to log deletions
      const { data: allPatients, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Log all patient deletions
      if (allPatients && allPatients.length > 0) {
        for (const patient of allPatients) {
          await logPatientDeletion(patient, 'bulk_delete_request');
        }
      }

      // First, get all bill IDs for this user
      const { data: userBills, error: billsQueryError } = await supabase
        .from('bills')
        .select('id')
        .eq('user_id', user.id);
      
      if (billsQueryError) {
        console.error('Error fetching user bills:', billsQueryError);
        throw billsQueryError;
      }
      
      // Delete all bill_items for this user's bills
      if (userBills && userBills.length > 0) {
        const billIds = userBills.map(bill => bill.id);
        const { error: billItemsError } = await supabase
          .from('bill_items')
          .delete()
          .in('bill_id', billIds);
        
        if (billItemsError) {
          console.error('Error deleting bill items:', billItemsError);
          throw billItemsError;
        }
      }

      // Delete all bills for this user
      const { error: billsError } = await supabase
        .from('bills')
        .delete()
        .eq('user_id', user.id);
      
      if (billsError) {
        console.error('Error deleting bills:', billsError);
        throw billsError;
      }
      
      // Delete all prescriptions for this user
      const { error: prescriptionsError } = await supabase
        .from('prescriptions')
        .delete()
        .eq('user_id', user.id);
      
      if (prescriptionsError) {
        console.error('Error deleting prescriptions:', prescriptionsError);
        throw prescriptionsError;
      }

      // Finally, delete all patients for this user
      const { error: patientsError } = await supabase
        .from('patients')
        .delete()
        .eq('user_id', user.id);

      if (patientsError) throw patientsError;

      toast({
        title: 'All Patients Deleted',
        description: `Successfully deleted ${allPatients?.length || 0} patients and all associated data.`,
      });

      // Emit events for cross-page updates
      window.dispatchEvent(new CustomEvent('dataRefreshNeeded', { 
        detail: { type: 'bulk_delete_patients' }
      }));

      refreshData();
    } catch (error) {
      console.error('Error deleting all patients:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete all patients. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAll(false);
      setDeleteAllDialogOpen(false);
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
            <Button 
              onClick={() => setDeleteAllDialogOpen(true)} 
              variant="destructive" 
              size="sm"
              disabled={refreshing || isDeletingAll || filteredPatients.length === 0}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete All
            </Button>
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
                onViewBill={(billId) => {
                  // Find the bill by ID from the patient's bills
                  const bill = filteredPatients
                    .flatMap(patient => patient.bills || [])
                    .find(bill => bill.id === billId);
                  if (bill) {
                    handleShowBillPreview(bill);
                  }
                }}
                onToggleStatus={(patientId, currentStatus) => {
                  // TODO: Implement patient status toggle functionality
                  console.log('Toggle status for patient:', patientId, currentStatus);
                }}
                onDeletePatient={(id) => {
                  setPatientToDelete(id);
                  setDeleteDialogOpen(true);
                }}
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
          items={selectedBill.bill_items || []}
        />
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the patient and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Patients?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete ALL {filteredPatients.length} patients and all associated data including:
              <br />• All patient records
              <br />• All prescriptions
              <br />• All bills and bill items
              <br />• All related transaction history
              <br /><br />
              <strong>This will completely reset your patient database.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllPatients}
              disabled={isDeletingAll}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete All Patients'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
