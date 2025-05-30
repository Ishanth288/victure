import { useState, useEffect } from "react";
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

  useEffect(() => {
    checkAuth();
    fetchPatients();
  }, []);

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
          existing.prescriptions = [...(existing.prescriptions || []), ...(patient.prescriptions || [])];
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
  }, [searchQuery, patients, activeTab, isFilterActive]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login to view patients",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const fetchPatients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          bills:prescriptions (
            id,
            prescription_number,
            doctor_name,
            date,
            status,
            bills (
              id,
              bill_number,
              date,
              total_amount,
              prescription:prescriptions (
                doctor_name
              )
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processedPatients = data.map((patient) => {
        const allBills: any[] = [];
        patient.bills.forEach((prescription: any) => {
          prescription.bills.forEach((bill: any) => {
            allBills.push({
              ...bill,
              prescription: {
                doctor_name: bill.prescription?.doctor_name || "Unknown",
              },
            });
          });
        });

        const totalSpent = allBills.reduce(
          (sum, bill) => sum + bill.total_amount,
          0
        );

        return {
          ...patient,
          bills: allBills,
          prescriptions: patient.bills,
          total_spent: totalSpent,
          status: patient.status || 'active'
        };
      });

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
  };

  const applyFilters = () => {
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
  };

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to delete patients",
          variant: "destructive",
        });
        return;
      }
      
      const { data: prescriptions, error: prescriptionsError } = await supabase
        .from("prescriptions")
        .select("id")
        .eq("patient_id", patientToDelete);
        
      if (prescriptionsError) throw prescriptionsError;
      
      if (prescriptions && prescriptions.length > 0) {
        const prescriptionIds = prescriptions.map(p => p.id);
        
        const { data: bills, error: billsFetchError } = await supabase
          .from("bills")
          .select("id")
          .in("prescription_id", prescriptionIds);
          
        if (billsFetchError) throw billsFetchError;
        
        if (bills && bills.length > 0) {
          const billIds = bills.map(b => b.id);
          
          const { error: billItemsError } = await supabase
            .from("bill_items")
            .delete()
            .in("bill_id", billIds);
            
          if (billItemsError) throw billItemsError;
          
          const { error: billsError } = await supabase
            .from("bills")
            .delete()
            .in("id", billIds);
            
          if (billsError) throw billsError;
        }
        
        const { error: deletePresError } = await supabase
          .from("prescriptions")
          .delete()
          .in("id", prescriptionIds);
          
        if (deletePresError) throw deletePresError;
      }
      
      const { error: patientError } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientToDelete)
        .eq("user_id", user.id);

      if (patientError) throw patientError;

      setPatients(prev => prev.filter(patient => patient.id !== patientToDelete));
      
      toast({
        title: "Patient deleted",
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
        <h1 className="text-3xl font-bold mb-6">Patients</h1>
        
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

        {filteredPatients.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No patients found</p>
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
