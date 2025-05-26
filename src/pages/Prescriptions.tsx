import { useState, useEffect } from "react";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User, FileText, DollarSign, Trash2, RotateCcw, History, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { MedicineReturnDialog } from "@/components/prescriptions/MedicineReturnDialog";
import { ReturnHistoryDialog } from "@/components/prescriptions/ReturnHistoryDialog";
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

export default function Prescriptions() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("active");
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<number | null>(null);
  const [billToDelete, setBillToDelete] = useState<number | null>(null);
  const [isDeleteBillDialogOpen, setDeleteBillDialogOpen] = useState(false);
  
  const [isMedicineReturnDialogOpen, setMedicineReturnDialogOpen] = useState(false);
  const [isReturnHistoryDialogOpen, setReturnHistoryDialogOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | null>(null);
  
  // Bill preview state
  const [isBillPreviewOpen, setBillPreviewOpen] = useState(false);
  const [previewBillData, setPreviewBillData] = useState<any>(null);
  const [previewBillItems, setPreviewBillItems] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [searchQuery, prescriptions, activeTab]);

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
      if (!user) return;

      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          patient:patients (name, phone_number),
          bills (id, total_amount, status, bill_number, date, subtotal, gst_amount, gst_percentage, discount_amount)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      
      const prescriptionsWithTotal = data?.map(prescription => {
        const totalAmount = prescription.bills?.reduce((sum: number, bill: any) => 
          sum + (bill.total_amount || 0), 0);
        
        return {
          ...prescription,
          total_amount: totalAmount || 0
        };
      }) || [];

      setPrescriptions(prescriptionsWithTotal);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    const filtered = prescriptions.filter((prescription) => {
      if (activeTab !== "all" && prescription.status !== activeTab) {
        return false;
      }

      const matchesSearch =
        searchQuery === "" ||
        prescription.prescription_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.patient?.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    setFilteredPrescriptions(filtered);
  };

  const handleCreateBill = (prescriptionId: number, patientData?: any) => {
    // Pass patient data via URL params for auto-fill
    const searchParams = new URLSearchParams({
      prescriptionId: prescriptionId.toString()
    });
    
    if (patientData) {
      searchParams.set('patientName', patientData.name || '');
      searchParams.set('patientPhone', patientData.phone_number || '');
    }
    
    navigate(`/billing?${searchParams.toString()}`);
  };

  const handlePreviewBill = async (billId: number) => {
    try {
      // Fetch bill data with prescription and patient info
      const { data: billData, error: billError } = await supabase
        .from("bills")
        .select(`
          *,
          prescription:prescriptions(
            prescription_number,
            doctor_name,
            patient:patients(name, phone_number)
          )
        `)
        .eq("id", billId)
        .single();

      if (billError) throw billError;

      // Fetch bill items
      const { data: billItems, error: itemsError } = await supabase
        .from("bill_items")
        .select(`
          *,
          inventory_item:inventory(name)
        `)
        .eq("bill_id", billId);

      if (itemsError) throw itemsError;

      // Format items for the preview
      const formattedItems = billItems.map(item => ({
        id: item.id,
        name: item.inventory_item?.name || 'Unknown Item',
        quantity: item.quantity,
        unit_cost: item.unit_price,
        total: item.total_price
      }));

      setPreviewBillData(billData);
      setPreviewBillItems(formattedItems);
      setBillPreviewOpen(true);
    } catch (error) {
      console.error("Error fetching bill data:", error);
      toast({
        title: "Error",
        description: "Failed to load bill preview",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      console.log(`Updating prescription ${id} status from ${currentStatus} to ${newStatus}`);
      
      const { data: prescriptionData, error: fetchError } = await supabase
        .from("prescriptions")
        .select("id, status")
        .eq("id", id)
        .single();
        
      if (fetchError) throw fetchError;
      if (!prescriptionData) throw new Error("Prescription not found");
      
      const { error } = await supabase
        .from("prescriptions")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

      setPrescriptions(prev => 
        prev.map(prescription => 
          prescription.id === id
            ? { ...prescription, status: newStatus }
            : prescription
        )
      );

      toast({
        title: "Status Updated",
        description: `Prescription marked as ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating prescription status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update prescription status",
        variant: "destructive",
      });
    }
  };

  const handleDeletePrescription = (id: number) => {
    setPrescriptionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBill = (id: number) => {
    setBillToDelete(id);
    setDeleteBillDialogOpen(true);
  };

  const confirmDeleteBill = async () => {
    if (!billToDelete) return;
    
    try {
      const { error: billItemsError } = await supabase
        .from("bill_items")
        .delete()
        .eq("bill_id", billToDelete);
        
      if (billItemsError) throw billItemsError;
      
      const { error: billError } = await supabase
        .from("bills")
        .delete()
        .eq("id", billToDelete);

      if (billError) throw billError;

      setPrescriptions(prev => 
        prev.map(prescription => {
          if (prescription.bills && prescription.bills.some((bill: any) => bill.id === billToDelete)) {
            return {
              ...prescription,
              bills: prescription.bills.filter((bill: any) => bill.id !== billToDelete),
              total_amount: prescription.total_amount - (prescription.bills.find((bill: any) => bill.id === billToDelete)?.total_amount || 0)
            };
          }
          return prescription;
        })
      );
      
      toast({
        title: "Bill deleted",
        description: "Bill has been removed successfully."
      });
    } catch (error: any) {
      console.error("Error deleting bill:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete bill",
        variant: "destructive"
      });
    } finally {
      setDeleteBillDialogOpen(false);
      setBillToDelete(null);
    }
  };

  const confirmDeletePrescription = async () => {
    if (!prescriptionToDelete) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to delete prescriptions",
          variant: "destructive",
        });
        return;
      }
      
      const { data: bills, error: billsError } = await supabase
        .from("bills")
        .select("id")
        .eq("prescription_id", prescriptionToDelete);
        
      if (billsError) throw billsError;
      
      if (bills && bills.length > 0) {
        for (const bill of bills) {
          const { error: billItemsError } = await supabase
            .from("bill_items")
            .delete()
            .eq("bill_id", bill.id);
            
          if (billItemsError) throw billItemsError;
        }
        
        const { error: deleteBillsError } = await supabase
          .from("bills")
          .delete()
          .eq("prescription_id", prescriptionToDelete);
          
        if (deleteBillsError) throw deleteBillsError;
      }
      
      const { error: prescriptionError } = await supabase
        .from("prescriptions")
        .delete()
        .eq("id", prescriptionToDelete)
        .eq("user_id", user.id);

      if (prescriptionError) throw prescriptionError;

      setPrescriptions(prev => prev.filter(prescription => prescription.id !== prescriptionToDelete));
      
      toast({
        title: "Prescription deleted",
        description: "Prescription has been removed successfully."
      });
    } catch (error: any) {
      console.error("Error deleting prescription:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete prescription",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setPrescriptionToDelete(null);
    }
  };

  const handleMedicineReturn = (billId: number) => {
    setSelectedBillId(billId);
    setMedicineReturnDialogOpen(true);
  };

  const handleViewReturnHistory = (prescriptionId: number) => {
    setSelectedPrescriptionId(prescriptionId);
    setReturnHistoryDialogOpen(true);
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold">Prescriptions</h1>

          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="mt-4 sm:mt-0">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Input
          placeholder="Search by prescription number, doctor or patient name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md mb-6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrescriptions.length === 0 ? (
            <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No prescriptions found</p>
            </div>
          ) : (
            filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium">{prescription.patient?.name}</h3>
                      <Badge 
                        variant={prescription.status === 'active' ? 'default' : 'secondary'}
                      >
                        {prescription.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        <span>Dr. {prescription.doctor_name}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        <span>Rx #{prescription.prescription_number}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{format(new Date(prescription.date), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>₹{prescription.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {prescription.bills && prescription.bills.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">Associated Bills</h4>
                          {prescription.bills.length > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 px-2 text-primary"
                              onClick={() => handleViewReturnHistory(prescription.id)}
                            >
                              <History className="h-3.5 w-3.5 mr-1" />
                              Return History
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {prescription.bills.map((bill: any) => (
                            <div key={bill.id} className="flex justify-between items-center text-sm">
                              <span>Bill #{bill.id}</span>
                              <span>₹{bill.total_amount.toFixed(2)}</span>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-7 px-2 text-primary hover:text-primary"
                                  title="Preview Bill"
                                  onClick={() => handlePreviewBill(bill.id)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-7 px-2 text-primary hover:text-primary"
                                  title="Process Return"
                                  onClick={() => handleMedicineReturn(bill.id)}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                                {(!bill.status || bill.status === 'pending') && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-7 px-2 text-destructive hover:text-destructive"
                                    title="Delete Bill"
                                    onClick={() => handleDeleteBill(bill.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      className="flex-1 rounded-none py-2"
                      onClick={() => handleToggleStatus(prescription.id, prescription.status)}
                    >
                      Mark {prescription.status === 'active' ? 'Inactive' : 'Active'}
                    </Button>
                    
                    {(prescription.bills?.length === 0 || !prescription.bills) && prescription.status === 'active' && (
                      <Button 
                        variant="ghost" 
                        className="flex-1 rounded-none py-2 text-primary border-l border-gray-100"
                        onClick={() => handleCreateBill(prescription.id, prescription.patient)}
                      >
                        Create Bill
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      className="flex-1 rounded-none py-2 text-destructive border-l border-gray-100"
                      onClick={() => handleDeletePrescription(prescription.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this prescription?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the prescription and all related bills.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePrescription} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isDeleteBillDialogOpen} onOpenChange={setDeleteBillDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this bill?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bill and all related items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBill} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <MedicineReturnDialog
        isOpen={isMedicineReturnDialogOpen}
        onClose={() => setMedicineReturnDialogOpen(false)}
        billId={selectedBillId}
        onSuccess={fetchPrescriptions}
      />
      
      <ReturnHistoryDialog
        isOpen={isReturnHistoryDialogOpen}
        onClose={() => setReturnHistoryDialogOpen(false)}
        prescriptionId={selectedPrescriptionId}
      />

      <BillPreviewDialog
        open={isBillPreviewOpen}
        onOpenChange={setBillPreviewOpen}
        billData={previewBillData}
        items={previewBillItems}
      />
    </DashboardLayout>
  );
}
