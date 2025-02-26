
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Calendar } from "lucide-react";
import { BillPreviewDialog } from "@/components/billing/BillPreviewDialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface PatientBill {
  id: number;
  date: string;
  total_amount: number;
  bill_number: string;
  prescription: {
    doctor_name: string;
  };
}

interface Patient {
  id: number;
  name: string;
  phone_number: string;
  bills: PatientBill[];
  total_spent: number;
}

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
          .filter((bill: PatientBill) => {
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

        const total_spent = bills.reduce((sum: number, bill: PatientBill) => 
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
                <span>to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <Card key={patient.id}>
              <CardHeader>
                <CardTitle className="text-lg">{patient.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p>{patient.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Bills</p>
                    <p>{patient.bills.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p>₹{patient.total_spent.toFixed(2)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Recent Bills</p>
                    {patient.bills.slice(0, 3).map((bill) => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(bill.date), "dd/MM/yyyy")}
                          </p>
                          <p className="text-sm text-gray-500">
                            ₹{bill.total_amount.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewBill(bill.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
