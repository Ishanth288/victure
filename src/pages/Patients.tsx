
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

  useEffect(() => {
    checkAuth();
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, startDate, endDate, patients, activeTab]);

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
        .order("name", { ascending: true });

      if (error) throw error;

      // Process data to flatten bills and calculate total spent
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
          total_spent: totalSpent,
          status: patient.status || 'active' // Default to active if status is not set
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

  const filterPatients = () => {
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime() + 86400000; // Add one day to include the end date

    const filtered = patients.filter((patient) => {
      // Filter by status
      if (activeTab !== "all" && patient.status !== activeTab) {
        return false;
      }

      // Filter by search query
      const matchesSearch =
        searchQuery === "" ||
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone_number.includes(searchQuery);

      // Filter by date (created_at)
      const createdAt = new Date(patient.created_at).getTime();
      const matchesDate = createdAt >= startTimestamp && createdAt <= endTimestamp;

      return matchesSearch && matchesDate;
    });

    setFilteredPatients(filtered);
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

      // Update local state
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
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
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
      </div>
    </DashboardLayout>
  );
}
