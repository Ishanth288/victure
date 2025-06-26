import { useState, useEffect, useCallback } from "react";
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
import { Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { logPatientDeletion, logPrescriptionDeletion } from "@/utils/deletionTracker";
import { useBilling } from "@/contexts/BillingContext";

export default function Patients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { prescriptionBills, isLoading: loading, refreshBills } = useBilling();

  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshBills();
      toast({
        title: "Data Refreshed",
        description: "Latest patients and bills loaded successfully",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshBills, toast]);

  useEffect(() => {
    const patientsByPhone = new Map();
    prescriptionBills.forEach(bill => {
      const phone = bill.patient.phone_number;
      if (!patientsByPhone.has(phone)) {
        patientsByPhone.set(phone, {
          ...bill.patient,
          prescriptions: [],
          bills: [],
          total_spent: 0,
        });
      }
      const patientGroup = patientsByPhone.get(phone);
      patientGroup.prescriptions.push(bill);
      patientGroup.bills.push(bill);
      patientGroup.total_spent += parseFloat(String(bill.total_amount)) || 0;
    });
    setPatients(Array.from(patientsByPhone.values()));
  }, [prescriptionBills]);

  useEffect(() => {
    let filtered = patients;

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(lowercasedQuery) ||
        patient.phone_number.includes(lowercasedQuery)
      );
    }

    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

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

  return (
    <div className="flex h-full w-full flex-col bg-gray-50/50 dark:bg-gray-900/50">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 dark:bg-gray-950">
          <h1 className="text-2xl font-bold">Patients</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={refreshData} variant="outline" size="icon" disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Card>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Input
                  placeholder="Search by name or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                {loading ? (
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
              </div>
            </CardContent>
          </Card>
        </main>
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
    </div>
  );
}
