
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BillPreviewDialog } from "@/components/billing/BillPreviewDialog";
import { DateRangeFilter } from "@/components/patients/DateRangeFilter";
import { PatientList } from "@/components/patients/PatientList";
import type { Patient } from "@/types/patients";

export default function Patients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    checkAuth();
    fetchPatients();
  }, [startDate, endDate]);

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

      let query = supabase
        .from("patients")
        .select(`
          *,
          prescriptions:prescriptions(
            *,
            bills:bills(
              *
            )
          )
        `)
        .eq('user_id', user.id);

      const { data, error } = await query;

      if (error) throw error;

      const processedPatients = data.map((patient) => {
        const bills = patient.prescriptions
          .flatMap((prescription: any) => 
            prescription.bills.map((bill: any) => ({
              ...bill,
              prescription: { doctor_name: prescription.doctor_name }
            }))
          )
          .filter((bill: any) => {
            if (!startDate && !endDate) return true;
            const billDate = new Date(bill.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            
            if (start && end) {
              return billDate >= start && billDate <= end;
            } else if (start) {
              return billDate >= start;
            } else if (end) {
              return billDate <= end;
            }
            return true;
          });

        const total_spent = bills.reduce((sum: number, bill: any) => 
          sum + (bill.total_amount || 0), 0
        );

        return {
          ...patient,
          bills,
          total_spent
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

  const viewBill = async (billId: number) => {
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
        id: item.inventory_item.id,
        name: item.inventory_item.name,
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

        <PatientList patients={patients} onViewBill={viewBill} />

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
