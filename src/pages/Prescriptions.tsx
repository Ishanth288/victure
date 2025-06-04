import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User, FileText, DollarSign, Trash2, Loader2, RefreshCw, Calendar, Phone, Eye, Search, Plus, ArrowLeftRight, Filter, Download, Stethoscope, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
import { MedicineReturnDialog } from "@/components/prescriptions/MedicineReturnDialog";
import { BillPreviewDialog } from "@/components/billing/BillPreviewDialog";
import { MedicineReplacementDialog } from "@/components/prescriptions/MedicineReplacementDialog";
import { logBillItemDeletion } from "@/utils/deletionTracker";

export default function Prescriptions() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("active");
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // NEW: Return dialog state
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnBillId, setReturnBillId] = useState<number | null>(null);
  
  // NEW: Bill preview state
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  
  // NEW: Replacement dialog state
  const [showReplacementDialog, setShowReplacementDialog] = useState(false);
  const [replacementBillId, setReplacementBillId] = useState<number | null>(null);

  // Real-time data refresh functionality
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPrescriptions();
      toast({
        title: "Data Refreshed",
        description: "Latest prescriptions and bills loaded successfully",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh on window focus to catch updates from other tabs
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && !loading) {
        refreshData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, loading, refreshData]);

  // Listen for custom events from billing page
  useEffect(() => {
    const handleBillGenerated = () => {
      console.log("📢 Bill generated event received, refreshing data immediately...");
      // Immediate refresh without delay
      fetchPrescriptions();
    };

    const handleDataRefreshNeeded = (event: CustomEvent) => {
      console.log("📢 Data refresh needed event received:", event.detail);
      if (event.detail?.type === 'bill_generated' || event.detail?.type === 'return_processed' || event.detail?.type === 'replacement_processed') {
        console.log("🔄 Triggering immediate refresh for:", event.detail.type);
        // Immediate refresh
        fetchPrescriptions();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'lastBillGenerated' && event.newValue) {
        console.log("📦 Storage change detected for bill generation");
        // Immediate refresh for storage changes
        fetchPrescriptions();
      }
    };

    // Enhanced event listening for immediate updates
    window.addEventListener('billGenerated', handleBillGenerated);
    window.addEventListener('dataRefreshNeeded', handleDataRefreshNeeded as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Also listen for visibility change to refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        console.log("🔄 Tab became visible, refreshing data...");
        fetchPrescriptions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('billGenerated', handleBillGenerated);
      window.removeEventListener('dataRefreshNeeded', handleDataRefreshNeeded as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]); // Depend on auth state

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

  // NEW: Bill-centric prescriptions fetching - Each bill = One prescription record
  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }
      
      setIsAuthenticated(true);

      // NEW WORKFLOW: Fetch bills as prescription records
      const { data: billsData, error: billsError } = await supabase
        .from("bills")
        .select(`
          id,
          bill_number,
          date,
          total_amount,
          prescription_id,
          prescription:prescriptions (
            id,
            prescription_number,
            doctor_name,
            patient_id,
            date,
            status,
            patient:patients (
              id,
              name, 
              phone_number
            )
          ),
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
        .limit(200);

      if (billsError) {
        console.error("Bills fetch error:", billsError);
        throw billsError;
      }
      
      console.log('📊 Fetched bills as prescriptions:', billsData?.length || 0);

      if (billsData && billsData.length > 0) {
        // NEW: Each bill becomes a prescription record with effective amount calculation
        const billPrescriptions = billsData.map(bill => {
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
            // Use bill ID as unique identifier
            id: bill.id,
            bill_id: bill.id,
            bill_number: bill.bill_number,
            amount: effectiveAmount, // Show effective amount after returns
            original_amount: originalAmount,
            return_value: totalReturnValue,
            date: bill.date,
            
            // Prescription details
            prescription_id: bill.prescription_id,
            prescription_number: bill.prescription?.prescription_number || 'Unknown',
            doctor_name: bill.prescription?.doctor_name || 'Not Specified',
            status: bill.prescription?.status || 'active',
            
            // Patient details
            patient: bill.prescription?.patient || { name: 'Unknown', phone_number: 'Unknown' },
            
            // Bill items for returns/replacements
            bill_items: bill.bill_items || [],
            
            // Enhanced sorting with both date and time
            sort_priority: billDate.getTime(), // Use full timestamp for precise sorting
            display_date: billDate // Store date object for additional sorting options
          };
        });

        // Sort by most recent date AND time - ENHANCED PRIORITIZATION
        billPrescriptions.sort((a, b) => {
          // Primary sort: by full timestamp (date + time)
          const timeDiff = b.sort_priority - a.sort_priority;
          if (timeDiff !== 0) return timeDiff;
          
          // Secondary sort: by bill ID (newer bills have higher IDs)
          return b.id - a.id;
        });

        console.log("🔢 Final sorted bills (recent first):", billPrescriptions.slice(0, 5).map(p => ({ 
          bill_number: p.bill_number, 
          date: p.date,
          timestamp: p.sort_priority,
          amount: p.amount
        })));

        setPrescriptions(billPrescriptions);
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
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Updated filtering for bill-centric prescriptions
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
          prescription.patient?.name.toLowerCase().includes(query) ||
          prescription.bill_number.toLowerCase().includes(query)
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

  // NEW: Bill preview handler
  const handleBillPreview = async (billId: number) => {
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

  // NEW: Return system handler
  const handleReturn = (billId: number, billNumber: string) => {
    // Open return dialog
    setReturnBillId(billId);
    setShowReturnDialog(true);
  };

  // NEW: Replacement system handler  
  const handleReplacement = (billId: number, billNumber: string) => {
    // Open replacement dialog
    setReplacementBillId(billId);
    setShowReplacementDialog(true);
  };

  // NEW: Return dialog success handler
  const handleReturnSuccess = () => {
    setShowReturnDialog(false);
    setReturnBillId(null);
    // Refresh data to show updated information
    refreshData();
    
    // Emit events for other pages to refresh
    window.dispatchEvent(new CustomEvent('dataRefreshNeeded', { 
      detail: { type: 'return_processed' }
    }));
  };

  // NEW: Replacement dialog success handler
  const handleReplacementSuccess = () => {
    setShowReplacementDialog(false);
    setReplacementBillId(null);
    // Refresh data to show updated information
    refreshData();
    
    // Emit events for other pages to refresh
    window.dispatchEvent(new CustomEvent('dataRefreshNeeded', { 
      detail: { type: 'replacement_processed' }
    }));
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
    console.log("Delete button clicked for prescription ID:", id);
    setPrescriptionToDelete(id);
    setDeleteDialogOpen(true);
  };

  // NEW: Bill deletion logic (bills treated as prescriptions)
  const confirmDeletePrescription = async () => {
    if (!prescriptionToDelete) {
      console.log("No prescription to delete");
      return;
    }
    
    try {
      setRefreshing(true);
      console.log("Starting deletion process for prescription ID:", prescriptionToDelete);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to delete prescriptions",
          variant: "destructive",
        });
        return;
      }

      // Find the bill record to delete from our state
      const billToDelete = prescriptions.find(p => p.id === prescriptionToDelete);
      if (!billToDelete) {
        console.error("Bill not found in state for ID:", prescriptionToDelete);
        console.log("Available prescriptions:", prescriptions.map(p => ({ id: p.id, bill_id: p.bill_id })));
        toast({
          title: "Error",
          description: "Bill record not found",
          variant: "destructive"
        });
        return;
      }

      console.log("Found bill to delete:", {
        id: billToDelete.id,
        bill_id: billToDelete.bill_id,
        bill_number: billToDelete.bill_number,
        patient: billToDelete.patient?.name
      });

      // Step 1: Fetch and restore inventory for the bill being deleted
      console.log("Fetching bill items for bill_id:", billToDelete.bill_id);
      const { data: billItems, error: billItemsError } = await supabase
        .from('bill_items')
        .select('inventory_item_id, quantity, return_quantity')
        .eq('bill_id', billToDelete.bill_id);

      if (billItemsError) {
        console.error("Error fetching bill items:", billItemsError);
        toast({
          title: "Delete Failed",
          description: "Failed to fetch bill items for inventory restoration",
          variant: "destructive"
        });
        return;
      }

      console.log("Found bill items:", billItems);

      if (billItems && billItems.length > 0) {
        // Restore inventory quantities (only non-returned quantities)
        for (const item of billItems) {
          const quantityToRestore = item.quantity - (item.return_quantity || 0);
          console.log(`Processing item ${item.inventory_item_id}: quantity=${item.quantity}, returned=${item.return_quantity || 0}, to_restore=${quantityToRestore}`);
          
          if (quantityToRestore > 0) {
            // Get current inventory quantity
            const { data: inventoryItem, error: fetchError } = await supabase
              .from('inventory')
              .select('quantity')
              .eq('id', item.inventory_item_id)
              .single();
            
            if (!fetchError && inventoryItem) {
              const newQuantity = inventoryItem.quantity + quantityToRestore;
              console.log(`Updating inventory ${item.inventory_item_id}: ${inventoryItem.quantity} + ${quantityToRestore} = ${newQuantity}`);
              
              const { error: updateError } = await supabase
                .from('inventory')
                .update({ quantity: newQuantity })
                .eq('id', item.inventory_item_id);
              
              if (updateError) {
                console.error("Error restoring inventory for item:", item.inventory_item_id, updateError);
              } else {
                console.log(`✓ Restored ${quantityToRestore} units to inventory item ${item.inventory_item_id}`);
              }
            } else {
              console.error("Failed to fetch inventory item:", item.inventory_item_id, fetchError);
            }
          }
        }
      }

      // Step 2: Delete bill items first (foreign key constraint)
      console.log("Deleting bill items for bill_id:", billToDelete.bill_id);
      
      // First get the bill items that will be deleted for logging
      const { data: billItemsToDelete, error: fetchBillItemsError } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billToDelete.bill_id);

      if (fetchBillItemsError) {
        console.error("Error fetching bill items for logging:", fetchBillItemsError);
      }

      const { error: deleteItemsError } = await supabase
        .from('bill_items')
        .delete()
        .eq('bill_id', billToDelete.bill_id);
      
      if (deleteItemsError) {
        console.error("Error deleting bill items:", deleteItemsError);
        toast({
          title: "Delete Failed",
          description: "Failed to delete bill items",
          variant: "destructive"
        });
        return;
      }

      // Log each deleted bill item for audit purposes
      if (billItemsToDelete) {
        for (const billItem of billItemsToDelete) {
          await logBillItemDeletion(
            billItem,
            "Manual bill deletion from prescriptions page",
            `Bill #${billToDelete.bill_number} deleted by user - inventory quantities restored`
          );
        }
      }
      
      console.log("✓ Bill items deleted successfully");

      // Step 3: Delete the bill itself
      console.log("Deleting bill with id:", billToDelete.bill_id, "user_id:", user.id);
      const { error: deleteBillError } = await supabase
        .from('bills')
        .delete()
        .eq('id', billToDelete.bill_id)
        .eq('user_id', user.id);
      
      if (deleteBillError) {
        console.error("Error deleting bill:", deleteBillError);
        toast({
          title: "Delete Failed",
          description: "Failed to delete bill: " + deleteBillError.message,
          variant: "destructive"
        });
        return;
      }
      console.log("✓ Bill deleted successfully");

      // Step 4: Update local state immediately - remove the deleted prescription
      console.log("Updating local state to remove prescription ID:", prescriptionToDelete);
      setPrescriptions(prev => {
        const updated = prev.filter(prescription => prescription.id !== prescriptionToDelete);
        console.log("Updated prescriptions count:", updated.length);
        return updated;
      });
      
      // Step 5: Emit events for cross-page updates
      console.log("Emitting cross-page update events");
      window.dispatchEvent(new CustomEvent('billDeleted', { 
        detail: { billId: billToDelete.bill_id, type: 'bill_deleted' }
      }));
      window.dispatchEvent(new CustomEvent('dataRefreshNeeded', { 
        detail: { type: 'bill_deleted' }
      }));
      
      // Cross-tab communication
      localStorage.setItem('lastBillDeleted', JSON.stringify({
        billId: billToDelete.bill_id,
        timestamp: Date.now(),
        type: 'bill_deleted'
      }));
      
      // Success message
      toast({
        title: "Bill Deleted Successfully",
        description: `Bill #${billToDelete.bill_number} has been deleted and inventory restored.`,
        variant: "default"
      });

      console.log("✓ Deletion process completed successfully");
      
    } catch (error: any) {
      console.error("Error deleting prescription:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete prescription",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setPrescriptionToDelete(null);
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">Prescriptions</h1>
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

          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="mt-4 sm:mt-0">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Input
          placeholder="Search by prescription number, bill number, doctor or patient name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md mb-6"
        />

        {/* ENHANCED: Show loading state during refresh */}
        {refreshing && (
          <div className="flex items-center justify-center py-4 text-blue-600">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Updating data...</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrescriptions.length === 0 ? (
            <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No prescriptions found</p>
              {!loading && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => navigate("/billing")}
                >
                  Create New Prescription
                </Button>
              )}
            </div>
          ) : (
            filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium">{prescription.patient?.name}</h3>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge 
                          variant={prescription.status === 'active' ? 'default' : 'secondary'}
                        >
                          {prescription.status}
                        </Badge>
                        <div className="text-right">
                          {prescription.return_value > 0 ? (
                            <div className="space-y-1">
                              <div className="text-sm text-gray-400 line-through">
                                ₹{prescription.original_amount.toFixed(2)}
                              </div>
                              <div className="text-lg font-bold text-green-600">
                                ₹{prescription.amount.toFixed(2)}
                              </div>
                              <div className="text-xs text-orange-600">
                                (₹{prescription.return_value.toFixed(2)} returned)
                              </div>
                            </div>
                          ) : (
                            <div className="text-xl font-bold text-green-600">
                              ₹{prescription.amount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
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
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Bill #{prescription.bill_number}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{format(new Date(prescription.date), "MMM dd, yyyy h:mm a")}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{prescription.patient?.phone_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      className="rounded-none py-3 text-blue-600 hover:bg-blue-50"
                      onClick={() => handleBillPreview(prescription.bill_id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="rounded-none py-3 text-orange-600 hover:bg-orange-50 border-l border-gray-100"
                      onClick={() => handleReturn(prescription.bill_id, prescription.bill_number)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Return
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      className="rounded-none py-3 text-purple-600 hover:bg-purple-50"
                      onClick={() => handleReplacement(prescription.bill_id, prescription.bill_number)}
                    >
                      <Loader2 className="h-4 w-4 mr-2" />
                      Replace
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="rounded-none py-3 text-destructive hover:bg-red-50 border-l border-gray-100"
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
      
      {/* NEW: Return Dialog */}
      <MedicineReturnDialog
        isOpen={showReturnDialog}
        onClose={() => {
          setShowReturnDialog(false);
          setReturnBillId(null);
        }}
        billId={returnBillId}
        onSuccess={handleReturnSuccess}
      />
      
      {/* NEW: Bill Preview Dialog */}
      {selectedBill && (
        <BillPreviewDialog
          open={showBillPreview}
          onOpenChange={setShowBillPreview}
          billData={selectedBill}
          items={selectedBill.items}
        />
      )}
      
      {/* NEW: Replacement Dialog */}
      <MedicineReplacementDialog
        isOpen={showReplacementDialog}
        onClose={() => {
          setShowReplacementDialog(false);
          setReplacementBillId(null);
        }}
        billId={replacementBillId}
        onSuccess={handleReplacementSuccess}
      />
      
      {/* Keep existing dialogs */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this prescription record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bill record, restore inventory quantities, and remove this entry from both prescriptions and patients pages.
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
    </DashboardLayout>
  );
}

