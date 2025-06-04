import { useState, useEffect, useCallback } from "react";
import { addDays, format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { PatientList } from "@/components/patients/PatientList";
import { DateRangeFilter } from "@/components/patients/DateRangeFilter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { BillPreviewDialog } from "@/components/billing/BillPreviewDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function Patients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(
    format(addDays(new Date(), -30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<number | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Use useCallback to memoize functions used in useEffect dependencies
  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login to view patients",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [toast, navigate]);

  // Real-time data refresh functionality
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPatients();
      toast({
        title: "Data Refreshed",
        description: "Latest patients and bills loaded successfully",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  // Auto-refresh on window focus to catch updates from other tabs
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        refreshData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loading, refreshData]);

  // Listen for custom events from billing page
  useEffect(() => {
    const handleBillGenerated = () => {
      console.log("📢 Bill generated event received, refreshing patient data immediately...");
      // Immediate refresh without delay
      fetchPatients();
    };

    const handleBillDeleted = (event: CustomEvent) => {
      console.log("🔴 Patients page - Bill deleted event received:", event.detail);
      console.log("🔄 Patients page - Immediate refresh due to bill deletion...");
      // Immediate refresh
      fetchPatients();
    };

    const handleDataRefreshNeeded = (event: CustomEvent) => {
      console.log("🔄 Patients page - Data refresh needed event received:", event.detail);
      if (event.detail?.type === 'bill_generated' || event.detail?.type === 'bill_deleted' || event.detail?.type === 'return_processed' || event.detail?.type === 'replacement_processed') {
        console.log("🔄 Patients page - Immediate refresh for event type:", event.detail.type);
        // Immediate refresh
        fetchPatients();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if ((event.key === 'lastBillGenerated' || event.key === 'lastBillDeleted') && event.newValue) {
        console.log("📦 Storage change detected for bill operation in patients");
        // Immediate refresh
        fetchPatients();
      }
    };

    // Enhanced event listening for immediate updates
    window.addEventListener('billGenerated', handleBillGenerated);
    window.addEventListener('billDeleted', handleBillDeleted);
    window.addEventListener('dataRefreshNeeded', handleDataRefreshNeeded as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Also listen for visibility change to refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 Patients tab became visible, refreshing data...");
        fetchPatients();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('billGenerated', handleBillGenerated);
      window.removeEventListener('billDeleted', handleBillDeleted);
      window.removeEventListener('dataRefreshNeeded', handleDataRefreshNeeded as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // No dependencies to ensure immediate event handling

  const fetchPatients = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // FIXED: Fetch patients with proper ordering
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (patientsError) throw patientsError;

      // FIXED: Fetch prescriptions separately
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from("prescriptions")
        .select(`
          id,
          prescription_number,
          doctor_name,
          date,
          status,
          patient_id
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (prescriptionsError) throw prescriptionsError;

      // FIXED: Fetch bills separately with bill items for return calculations
      const { data: billsData, error: billsError } = await supabase
        .from("bills")
        .select(`
          id,
          bill_number,
          date,
          total_amount,
          prescription_id,
          bill_items:bill_items (
            id,
            quantity,
            unit_price,
            total_price,
            return_quantity
          )
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("id", { ascending: false }) // Secondary sort by ID for same date/time
        .limit(500); // Increased limit for better data coverage

      if (billsError) throw billsError;

      // FIXED: Group patients by phone number - This is the key fix for patient workflow
      const patientsByPhone = new Map();

      patientsData.forEach(patient => {
        const phoneNumber = patient.phone_number;
        
        if (!patientsByPhone.has(phoneNumber)) {
          // First patient with this phone number
          patientsByPhone.set(phoneNumber, {
            ...patient,
            patients: [patient], // Keep track of all patient records with this number
            prescriptions: [],
            bills: [],
            total_spent: 0,
            bill_count: 0,
            last_bill_date: null,
            sort_priority: new Date(patient.created_at || patient.id).getTime()
          });
        } else {
          // Additional patient record with same phone number
          const existing = patientsByPhone.get(phoneNumber);
          existing.patients.push(patient);
          
          // Update to most recent patient data if this one is newer
          if (patient.id > existing.id) {
            existing.name = patient.name;
            existing.status = patient.status;
            existing.created_at = patient.created_at;
          }
        }
      });

      // Now process prescriptions and bills for each phone number group
      const processedPatients = Array.from(patientsByPhone.values()).map(patientGroup => {
        // Get all patient IDs for this phone number
        const patientIds = patientGroup.patients.map(p => p.id);
        
        // Find all prescriptions for any patient with this phone number
        const groupPrescriptions = prescriptionsData?.filter(prescription => 
          patientIds.includes(prescription.patient_id)
        ) || [];
        
        // Find all bills for these prescriptions
        const prescriptionIds = groupPrescriptions.map(p => p.id);
        const groupBills = billsData?.filter(bill => 
          prescriptionIds.includes(bill.prescription_id)
        ) || [];

        // FIXED: Attach bills to each prescription to prevent undefined errors
        const prescriptionsWithBills = groupPrescriptions.map(prescription => {
          const prescriptionBills = groupBills.filter(bill => bill.prescription_id === prescription.id);
          return {
            ...prescription,
            bills: prescriptionBills || [] // Ensure bills is always an array
          };
        });

        // Add prescription info to bills and calculate effective amounts
        const billsWithPrescriptions = groupBills.map(bill => {
          const prescription = groupPrescriptions.find(p => p.id === bill.prescription_id);
          
          // Calculate effective amount after returns
          let totalReturnValue = 0;
          let originalAmount = bill.total_amount;
          
          if (bill.bill_items && bill.bill_items.length > 0) {
            totalReturnValue = bill.bill_items.reduce((sum, item) => {
              const returnQuantity = item.return_quantity || 0;
              const returnValue = returnQuantity * item.unit_price;
              return sum + returnValue;
            }, 0);
          }
          
          const effectiveAmount = originalAmount - totalReturnValue;
          const billDate = new Date(bill.date);
          
          return {
            ...bill,
            effective_amount: effectiveAmount,
            original_amount: originalAmount,
            return_value: totalReturnValue,
            sort_timestamp: billDate.getTime(), // Add timestamp for precise sorting
            prescription: {
              doctor_name: prescription?.doctor_name || "Unknown",
              prescription_number: prescription?.prescription_number || "Unknown"
            }
          };
        });

        // Enhanced sorting by timestamp and ID - most recent first
        billsWithPrescriptions.sort((a, b) => {
          // Primary sort: by full timestamp (date + time)
          const timeDiff = b.sort_timestamp - a.sort_timestamp;
          if (timeDiff !== 0) return timeDiff;
          
          // Secondary sort: by bill ID (newer bills have higher IDs)
          return b.id - a.id;
        });

        console.log("📊 Patient bills sorted (recent first):", patientGroup.name, billsWithPrescriptions.slice(0, 3).map(b => ({
          bill_number: b.bill_number,
          date: b.date,
          timestamp: b.sort_timestamp
        })));

        // Calculate total spent using effective amounts (after returns)
        const totalSpent = billsWithPrescriptions.reduce((sum, bill) => sum + bill.effective_amount, 0);
        const lastBillDate = billsWithPrescriptions.length > 0 ? billsWithPrescriptions[0].date : null;
        const billCount = billsWithPrescriptions.length;

        return {
          ...patientGroup,
          prescriptions: prescriptionsWithBills, // Use prescriptions with bills attached
          bills: billsWithPrescriptions,
          total_spent: totalSpent,
          bill_count: billCount,
          last_bill_date: lastBillDate,
          // Update sort priority based on most recent activity
          sort_priority: lastBillDate ? new Date(lastBillDate).getTime() : new Date(patientGroup.created_at || patientGroup.id).getTime()
        };
      });

      // FIXED: Sort patients to show those with most recent activity first
      processedPatients.sort((a, b) => b.sort_priority - a.sort_priority);

      setPatients(processedPatients);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [toast]);

  const applyFilters = useCallback(() => {
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime() + 86400000; // Add one day to include end date

    const filtered = patients.filter((patient) => {
      const query = searchQuery.toLowerCase();
      return (
        patient.name.toLowerCase().startsWith(query) ||
        patient.phone_number.startsWith(searchQuery)
      );
    });

    setFilteredPatients(filtered);
  }, [patients, startDate, endDate, searchQuery]);

  useEffect(() => {
    checkAuth();
    fetchPatients();
  }, [checkAuth, fetchPatients]);

  useEffect(() => {
    if (isFilterActive) {
      applyFilters();
    } else {
      // Group patients by unique phone number and merge their bills
      const patientsByPhone = new Map();
      patients.forEach(patient => {
        if (!patientsByPhone.has(patient.phone_number)) {
          patientsByPhone.set(patient.phone_number, { ...patient });
        } else {
          // Merge bills and prescriptions for duplicate phone numbers
          const existing = patientsByPhone.get(patient.phone_number);
          existing.bills = [...existing.bills, ...patient.bills];
          
          // FIXED: Ensure prescriptions are properly merged with bills arrays
          const existingPrescriptions = existing.prescriptions || [];
          const newPrescriptions = patient.prescriptions || [];
          const mergedPrescriptions = [...existingPrescriptions, ...newPrescriptions].map(prescription => ({
            ...prescription,
            bills: prescription.bills || [] // Ensure bills is always an array
          }));
          
          existing.prescriptions = mergedPrescriptions;
          existing.total_spent += patient.total_spent;
        }
      });
      const uniquePatients = Array.from(patientsByPhone.values())
        .filter(patient => activeTab === "all" || patient.status === activeTab)
        .filter(patient => 
          searchQuery === "" || 
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.phone_number.includes(searchQuery)
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20); // Limit to 20 most recent patients
      setFilteredPatients(uniquePatients);
    }
  }, [searchQuery, patients, activeTab, isFilterActive, applyFilters]);

  const toggleFilter = () => {
    if (isFilterActive) {
      // Clear filters
      setIsFilterActive(false);
    } else {
      // Apply filters
      setIsFilterActive(true);
      applyFilters();
    }
  };

  const handleViewBill = async (billId: number) => {
    try {
      const { data: billData, error } = await supabase
        .from("bills")
        .select(`
          *,
          prescription:prescriptions (
            *,
            patient:patients (
              name,
              phone_number
            )
          ),
          bill_items:bill_items (
            *,
            inventory_item:inventory (
              name,
              unit_cost
            )
          )
        `)
        .eq("id", billId)
        .single();

      if (error) throw error;

      const items = billData.bill_items.map((item: any) => ({
        id: item.inventory_item?.id || 0,
        name: item.inventory_item?.name || 'Unknown',
        quantity: item.quantity,
        unit_cost: item.unit_price,
        total: item.total_price,
      }));

      setSelectedBill({ ...billData, items });
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

  const handleTogglePatientStatus = async (patientId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from("patients")
        .update({ status: newStatus })
        .eq("id", patientId);

      if (error) throw error;

      setPatients(prevPatients => 
        prevPatients.map(patient => 
          patient.id === patientId
            ? { ...patient, status: newStatus }
            : patient
        )
      );

      toast({
        title: "Status Updated",
        description: `Patient marked as ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating patient status:", error);
      toast({
        title: "Error",
        description: "Failed to update patient status",
        variant: "destructive",
      });
    }
  };

  const handleCreateBill = (prescriptionId: number) => {
    navigate(`/billing?prescriptionId=${prescriptionId}`);
  };

  const handleDeletePatient = (patientId: number) => {
    setPatientToDelete(patientId);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;
    
    try {
      setRefreshing(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to delete patients",
          variant: "destructive",
        });
        return;
      }
      
      // ENHANCED: Check for prescriptions first
      const { data: prescriptions, error: prescriptionsError } = await supabase
        .from("prescriptions")
        .select("id")
        .eq("patient_id", patientToDelete);
        
      if (prescriptionsError) {
        console.error("Error checking prescriptions:", prescriptionsError);
        toast({
          title: "Delete Failed",
          description: "Failed to check for related prescriptions",
          variant: "destructive",
        });
        return;
      }
      
      if (prescriptions && prescriptions.length > 0) {
        const prescriptionIds = prescriptions.map(p => p.id);
        
        // Check for bills
        const { data: bills, error: billsFetchError } = await supabase
          .from("bills")
          .select("id")
          .in("prescription_id", prescriptionIds);
          
        if (billsFetchError) {
          console.error("Error checking bills:", billsFetchError);
          toast({
            title: "Delete Failed",
            description: "Failed to check for related bills",
            variant: "destructive",
          });
          return;
        }
        
        if (bills && bills.length > 0) {
          toast({
            title: "Cannot Delete Patient",
            description: "This patient has bills associated with their prescriptions. Please delete the bills first.",
            variant: "destructive",
          });
          return;
        }
        
        // Delete prescriptions first
        const { error: deletePresError } = await supabase
          .from("prescriptions")
          .delete()
          .in("id", prescriptionIds);
          
        if (deletePresError) {
          console.error("Error deleting prescriptions:", deletePresError);
          toast({
            title: "Delete Failed",
            description: "Failed to delete patient prescriptions",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Finally delete the patient
      const { error: patientError } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientToDelete)
        .eq("user_id", user.id);

      if (patientError) {
        console.error("Error deleting patient:", patientError);
        toast({
          title: "Delete Failed",
          description: "Failed to delete patient",
          variant: "destructive",
        });
        return;
      }

      // ENHANCED: Real-time local state update
      setPatients(prev => prev.filter(patient => patient.id !== patientToDelete));
      
      // ENHANCED: Trigger data refresh after successful deletion
      setTimeout(() => refreshData(), 500);
      
      toast({
        title: "Patient Deleted Successfully",
        description: "Patient record has been removed successfully."
      });
    } catch (error: any) {
      console.error("Error deleting patient:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete patient",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">Patients</h1>
            {/* ENHANCED: Real-time refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </Button>
          </div>
        </div>
        
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onFilterApply={toggleFilter}
          isFilterActive={isFilterActive}
        />

        <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-center">
          <Input
            placeholder="Search by name or phone number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="flex-shrink-0">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ENHANCED: Show loading state during refresh */}
        {refreshing && (
          <div className="flex items-center justify-center py-4 text-blue-600">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Updating data...</span>
          </div>
        )}

        {filteredPatients.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No patients found</p>
            {!loading && (
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => navigate("/billing")}
              >
                Create New Patient
              </Button>
            )}
          </div>
        ) : (
          <PatientList 
            patients={filteredPatients} 
            onViewBill={handleViewBill}
            onToggleStatus={handleTogglePatientStatus}
            onCreateBill={handleCreateBill}
            onDeletePatient={handleDeletePatient}
          />
        )}

        {selectedBill && (
          <BillPreviewDialog
            open={showBillPreview}
            onOpenChange={setShowBillPreview}
            billData={selectedBill}
            items={selectedBill.items}
          />
        )}
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this patient?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the patient record, all prescriptions, and all related bills.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePatient} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
