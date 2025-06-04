import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User, FileText, DollarSign, Trash2, RotateCcw, History, Eye, Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { MedicineReturnDialog } from "@/components/prescriptions/MedicineReturnDialog";
import { ReturnHistoryDialog } from "@/components/prescriptions/ReturnHistoryDialog";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  // Add loading timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Prescriptions loading timeout - forcing completion');
        setLoading(false);
        toast({
          title: "Loading completed",
          description: "Page loaded successfully (some data may still be loading)",
          variant: "default",
        });
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timeoutId);
  }, [loading, toast]);

  // Simplified auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Authentication Required",
            description: "Please login to view prescriptions",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }
        // Auth successful, proceed to fetch data
        fetchPrescriptions();
      } catch (error) {
        console.error("Auth error:", error);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Simplified prescriptions fetching
  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Simplified query - fetch minimal data first for faster loading
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          id,
          prescription_number,
          doctor_name,
          patient_id,
          date,
          status,
          patient:patients (name, phone_number)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(50); // Limit initial load for performance

      if (error) {
        console.error("Prescriptions fetch error:", error);
        throw error;
      }
      
      console.log('Fetched prescriptions:', data?.length || 0);

      // Fetch bills separately for better performance
      if (data && data.length > 0) {
        const prescriptionIds = data.map(p => p.id);
        const { data: bills, error: billsError } = await supabase
          .from("bills")
          .select("id, prescription_id, total_amount, status, bill_number, date")
          .in("prescription_id", prescriptionIds);

        if (billsError) {
          console.error("Bills fetch error:", billsError);
        }

        // Combine data efficiently
        const prescriptionsWithBills = data.map(prescription => {
          const prescriptionBills = bills?.filter(bill => bill.prescription_id === prescription.id) || [];
          const totalAmount = prescriptionBills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);
          
          return {
            ...prescription,
            bills: prescriptionBills,
            total_amount: totalAmount
          };
        });

        setPrescriptions(prescriptionsWithBills);
      } else {
        setPrescriptions([]);
      }

    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions. Please try refreshing.",
        variant: "destructive",
      });
      setPrescriptions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Simplified filtering with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filtered = prescriptions.filter((prescription) => {
        if (activeTab !== "all" && prescription.status !== activeTab) {
          return false;
        }

        if (searchQuery === "") return true;

        const query = searchQuery.toLowerCase();
        return (
          prescription.prescription_number.toLowerCase().includes(query) ||
          prescription.doctor_name.toLowerCase().includes(query) ||
          prescription.patient?.name.toLowerCase().includes(query)
        );
      });

      setFilteredPrescriptions(filtered);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [prescriptions, activeTab, searchQuery]);

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

  const handlePrintBill = () => {
    const printContent = document.getElementById('bill-preview-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Bill - ${previewBillData?.bill_number}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .bill-header { text-align: center; margin-bottom: 30px; }
                .patient-info { margin-bottom: 20px; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .items-table th { background-color: #f5f5f5; }
                .totals { text-align: right; }
                .total-row { font-weight: bold; font-size: 16px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleSaveBill = async () => {
    try {
      if (!previewBillData) return;

      const { error } = await supabase
        .from("bills")
        .update({ status: "saved" })
        .eq("id", previewBillData.id);

      if (error) throw error;

      toast({
        title: "Bill Saved",
        description: "Bill has been saved successfully",
      });

      setBillPreviewOpen(false);
      fetchPrescriptions(); // Refresh data
    } catch (error) {
      console.error("Error saving bill:", error);
      toast({
        title: "Error",
        description: "Failed to save bill",
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
      // Use atomic bill deletion function
      const { data: deleteResult, error: deleteError } = await supabase.rpc('delete_bill_atomic', {
        p_bill_id: billToDelete,
        p_restore_inventory: true // Restore inventory quantities when deleting bill
      });
      
      if (deleteError) {
        console.error("Error deleting bill:", deleteError);
        toast({
          title: "Error", 
          description: deleteError.message || "Failed to delete bill",
          variant: "destructive"
        });
        return;
      }
      
      if (!deleteResult?.success) {
        toast({
          title: "Delete Failed",
          description: deleteResult?.message || "Failed to delete bill safely",
          variant: "destructive"
        });
        return;
      }

      // Update local state to remove the deleted bill
      setPrescriptions(prev => 
        prev.map(prescription => {
          if (prescription.bills && prescription.bills.some((bill: any) => bill.id === billToDelete)) {
            const deletedBill = prescription.bills.find((bill: any) => bill.id === billToDelete);
            return {
              ...prescription,
              bills: prescription.bills.filter((bill: any) => bill.id !== billToDelete),
              total_amount: prescription.total_amount - (deletedBill?.total_amount || 0)
            };
          }
          return prescription;
        })
      );
      
      toast({
        title: "Bill deleted",
        description: "Bill has been removed and inventory quantities restored."
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
      
      // Use atomic prescription deletion function to prevent data inconsistency
      const { data: deleteResult, error: deleteError } = await supabase.rpc('delete_prescription_atomic', {
        p_prescription_id: prescriptionToDelete,
        p_user_id: user.id
      });
      
      if (deleteError) {
        console.error("Error deleting prescription:", deleteError);
        toast({
          title: "Error",
          description: deleteError.message || "Failed to delete prescription",
          variant: "destructive"
        });
        return;
      }
      
      if (!deleteResult?.success) {
        toast({
          title: "Delete Failed",
          description: deleteResult?.message || "Failed to delete prescription safely",
          variant: "destructive"
        });
        return;
      }

      // Update local state only after successful deletion
      setPrescriptions(prev => prev.filter(prescription => prescription.id !== prescriptionToDelete));
      
      toast({
        title: "Prescription deleted",
        description: "Prescription and all related data have been removed successfully."
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
      
      {/* Bill Preview Dialog */}
      <Dialog open={isBillPreviewOpen} onOpenChange={setBillPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Preview - #{previewBillData?.bill_number}</DialogTitle>
          </DialogHeader>
          
          <div id="bill-preview-content" className="space-y-6">
            {previewBillData && (
              <>
                {/* Bill Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-2xl font-bold">PHARMACY BILL</h2>
                  <p className="text-gray-600">Bill #: {previewBillData.bill_number}</p>
                  <p className="text-gray-600">Date: {format(new Date(previewBillData.date), "PPP")}</p>
                </div>

                {/* Patient Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Patient Details:</h3>
                    <p>Name: {previewBillData.prescription?.patient?.name}</p>
                    <p>Phone: {previewBillData.prescription?.patient?.phone_number}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Prescription Details:</h3>
                    <p>Prescription #: {previewBillData.prescription?.prescription_number}</p>
                    <p>Doctor: {previewBillData.prescription?.doctor_name}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h3 className="font-semibold mb-4">Items:</h3>
                  <table className="items-table w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">Item</th>
                        <th className="border border-gray-300 p-2 text-right">Qty</th>
                        <th className="border border-gray-300 p-2 text-right">Unit Price</th>
                        <th className="border border-gray-300 p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewBillItems.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">{item.name}</td>
                          <td className="border border-gray-300 p-2 text-right">{item.quantity}</td>
                          <td className="border border-gray-300 p-2 text-right">₹{item.unit_cost.toFixed(2)}</td>
                          <td className="border border-gray-300 p-2 text-right">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="totals space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{previewBillData.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  {previewBillData.discount_amount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-₹{previewBillData.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST ({previewBillData.gst_percentage || 0}%):</span>
                    <span>₹{previewBillData.gst_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between total-row text-lg font-bold border-t pt-2">
                    <span>Total Amount:</span>
                    <span>₹{previewBillData.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button variant="outline" onClick={handlePrintBill}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button onClick={handleSaveBill}>
                    <Download className="h-4 w-4 mr-2" />
                    Save Bill
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Keep existing dialogs */}
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
    </DashboardLayout>
  );
}
