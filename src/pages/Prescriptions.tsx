
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Eye } from "lucide-react";
import { BillPreviewDialog } from "@/components/billing/BillPreviewDialog";
import { useToast } from "@/components/ui/use-toast";

interface Prescription {
  id: number;
  prescription_number: string;
  date: string;
  doctor_name: string;
  patient: {
    name: string;
    phone_number: string;
  };
  bills: Array<{
    id: number;
    bill_number: string;
    total_amount: number;
    date: string;
  }>;
}

export default function Prescriptions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchPrescriptions();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login to view prescriptions",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          patient:patients (*),
          bills (*)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setPrescriptions(data);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive",
      });
    } finally {
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
            <CardTitle className="text-2xl">Prescriptions</CardTitle>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      {prescription.patient.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {prescription.patient.phone_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      Dr. {prescription.doctor_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(prescription.date), "dd/MM/yyyy")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {prescription.prescription_number}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Bills</p>
                    {prescription.bills.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {bill.bill_number}
                          </p>
                          <p className="text-sm text-gray-500">
                            ₹{bill.total_amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(bill.date), "dd/MM/yyyy")}
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
