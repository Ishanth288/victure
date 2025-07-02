
import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";

import Skeleton from "@/components/ui/skeleton-loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User, FileText, DollarSign, Trash2, Loader2, RefreshCw, Calendar, Phone, Eye, Search, Plus, ArrowLeftRight, Filter, Download, Stethoscope, Package, AlertTriangle } from "lucide-react";
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
import MedicineReturnDialog from "@/components/prescriptions/MedicineReturnDialog";
import { BillPreviewDialog } from "@/components/billing/BillPreviewDialog";
import { MedicineReplacementDialog } from "@/components/prescriptions/MedicineReplacementDialog";
import { logBillItemDeletion } from "@/utils/deletionTracker";
import { useBilling } from "@/contexts/BillingContext";
import { usePrescriptionsQuery } from "@/hooks/queries/usePrescriptionsQuery";
import { useAuth } from "@/hooks/useAuth";


export default function Prescriptions() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Debug logging
  console.log('🔍 Prescriptions Debug:', {
    user: user,
    userId: user?.id,
    userEmail: user?.email
  });
  
  // Use new prescriptions query
  const { 
    data: prescriptions = [], 
    isLoading, 
    error, 
    refetch: refreshPrescriptions
  } = usePrescriptionsQuery(user?.id || null);
  
  // Debug prescription data
  console.log('📋 Prescriptions Data:', {
    prescriptions,
    count: prescriptions.length,
    isLoading,
    error
  });
  
  // Keep billing context for bill operations
  const { refreshBills } = useBilling();
  
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  

  
  // Return dialog state
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnBillId, setReturnBillId] = useState<number | null>(null);
  
  // Bill preview state
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  
  // Replacement dialog state
  const [showReplacementDialog, setShowReplacementDialog] = useState(false);
  const [replacementBillId, setReplacementBillId] = useState<number | null>(null);
  
  // Delete all dialog state
  const [isDeleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Real-time data refresh functionality
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshPrescriptions();
      await refreshBills(); // Still refresh bills for operations
      toast({
        title: "Data Refreshed",
        description: "Latest prescriptions loaded successfully",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [refreshPrescriptions, refreshBills, toast]);

  // Auto-refresh on window focus to catch updates from other tabs
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && !isLoading) {
        refreshData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, isLoading, refreshData]);

  // Listen for custom events from billing page
  useEffect(() => {
    const handleBillGenerated = () => {
      console.log("📢 Bill generated event received, refreshing data immediately...");
      refreshData();
    };

    const handleDataRefreshNeeded = (event: CustomEvent) => {
      console.log("📢 Data refresh needed event received:", event.detail);
      if (event.detail?.type === 'bill_generated' || event.detail?.type === 'return_processed' || event.detail?.type === 'replacement_processed') {
        console.log("🔄 Triggering immediate refresh for:", event.detail.type);
        refreshData();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'lastBillGenerated' && event.newValue) {
        console.log("📦 Storage change detected for bill generation");
        refreshData();
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
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('billGenerated', handleBillGenerated);
      window.removeEventListener('dataRefreshNeeded', handleDataRefreshNeeded as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, refreshData]);

  // Simplified auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAuthenticated(false);
          navigate("/auth");
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth error:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Updated filtering for prescriptions - moved to useEffect to prevent render-time setState
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {

        
        // First, process prescriptions to add computed bill properties
        const processedPrescriptions = prescriptions.map((prescription) => {
          const bills = prescription.bills || [];
          // Filter out zero-value, null, undefined, and invalid bills
          const validBills = bills.filter(bill => 
            bill && 
            bill.total_amount != null && 
            !isNaN(bill.total_amount) && 
            bill.total_amount > 0
          );
          // Sort bills by date (most recent first)
          const sortedBills = validBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const latestBill = sortedBills.length > 0 ? sortedBills[0] : null;
          
          return {
            ...prescription,
            has_bill: sortedBills.length > 0,
            bill_total_amount: latestBill?.total_amount || 0,
            bill_number: latestBill?.bill_number || null,
            bill_id: latestBill?.id || null
          };
        });
        
        const filtered = processedPrescriptions.filter((prescription) => {
          // Time-based filtering
          // Skip time filtering since fromTime/tillTime not defined
          if (false) {
            const prescriptionDate = new Date(prescription.date);
            const today = new Date();
            const fromDateTime = new Date(today.toDateString()); // Default to start of day
            const tillDateTime = new Date(today.setHours(23, 59, 59, 999)); // Set to end of day
            
            // Check if prescription was created today within the time range
            const isToday = prescriptionDate.toDateString() === today.toDateString();
            const isWithinTimeRange = prescriptionDate >= fromDateTime && prescriptionDate <= tillDateTime;
            
            if (!isToday || !isWithinTimeRange) {
              return false;
            }
          }

          if (searchQuery === "") return true;

          const query = searchQuery.toLowerCase();
          return (
            prescription.prescription_number?.toLowerCase().includes(query) ||
            prescription.doctor_name?.toLowerCase().includes(query) ||
            prescription.patients?.name?.toLowerCase().includes(query)
          );
        });

        setFilteredPrescriptions(filtered);
      } catch (error) {
        console.error("Error filtering prescriptions:", error);
        toast({
          title: "Error",
          description: "Failed to filter prescriptions",
          variant: "destructive",
        });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [prescriptions, searchQuery, toast]);

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

  // Bill preview handler
  const handleBillPreview = async (billId: number) => {
    try {
      const { data: billData, error } = await supabase
        .from("bills")
        .select(`
          *,
          prescriptions (
            *,
            patients (
              name,
              phone_number
            )
          ),
          bill_items!inner (
            *,
            inventory:inventory_item_id (
              name,
              unit_cost
            )
          )
        `)
        .eq("id", billId)
        .single();

      if (error) throw error;

      // Normalize the data structure  
      const prescriptions = Array.isArray(billData.prescriptions) ? billData.prescriptions : [billData.prescriptions].filter(Boolean);
      
      const patientInfo = prescriptions.length > 0 && prescriptions[0] ? prescriptions[0].patients : null;
      const patientArray = Array.isArray(patientInfo) ? patientInfo : [patientInfo].filter(Boolean);
      const patient = patientArray.length > 0 ? patientArray[0] : { name: 'Unknown', phone_number: 'Unknown' };

      const normalizedBillData = {
        ...billData,
        subtotal: billData.subtotal || billData.total_amount || 0,
        gst_amount: billData.gst_amount || 0,
        gst_percentage: billData.gst_percentage || 0,
        discount_amount: billData.discount_amount || 0,
        prescription: prescriptions.length > 0 && prescriptions[0] ? {
          ...prescriptions[0],
          patient: patient
        } : null
      };

      const items = billData.bill_items.map((item: any) => {
        const inventory = Array.isArray(item.inventory) ? item.inventory : [item.inventory].filter(Boolean);
        const inventoryItem = inventory.length > 0 && inventory[0] ? inventory[0] : null;
        return {
          id: inventoryItem?.id || 0,
          name: inventoryItem?.name || 'Unknown',
          quantity: item.quantity,
          unit_cost: item.unit_price,
          total: item.total_price,
        };
      });

      setSelectedBill({ ...normalizedBillData, items });
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

  // Return system handler
  const handleReturn = (billId: number, billNumber: string) => {
    console.log("Return button clicked for bill:", billId, billNumber);
    setReturnBillId(billId);
    setShowReturnDialog(true);
    console.log("Return dialog state set to true");
  };

  // Replacement system handler  
  const handleReplacement = (billId: number, billNumber: string) => {
    setReplacementBillId(billId);
    setShowReplacementDialog(true);
  };

  // Return dialog success handler
  const handleReturnSuccess = () => {
    setShowReturnDialog(false);
    setReturnBillId(null);
    refreshData();
    
    window.dispatchEvent(new CustomEvent('dataRefreshNeeded', { 
      detail: { type: 'return_processed' }
    }));
  };

  // Replacement dialog success handler
  const handleReplacementSuccess = () => {
    setShowReplacementDialog(false);
    setReplacementBillId(null);
    refreshData();
    
    window.dispatchEvent(new CustomEvent('dataRefreshNeeded', { 
      detail: { type: 'replacement_processed' }
    }));
  };

  const handleDeletePrescription = (id: number) => {
    console.log("Delete button clicked for prescription ID:", id);
    setPrescriptionToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Bill deletion logic
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

      // Find the prescription record to delete from our state
      const prescriptionToDeleteRecord = prescriptions.find(p => p.id === prescriptionToDelete);
      if (!prescriptionToDeleteRecord) {
        console.error("Prescription not found in state for ID:", prescriptionToDelete);
        toast({
          title: "Error", 
          description: "Prescription record not found",
          variant: "destructive"
        });
        return;
      }
      
      // Get the bill from the prescription record
      const billToDelete = prescriptionToDeleteRecord.bills?.[0];
      if (!billToDelete) {
        console.error("No bill found for prescription ID:", prescriptionToDelete);
        toast({
          title: "Error", 
          description: "No bill found for this prescription",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Found bill to delete:", {
        id: billToDelete.id,
        bill_number: billToDelete.bill_number,
        patient: prescriptionToDeleteRecord.patients?.name
      });

      // Step 1: Fetch and restore inventory for the bill being deleted
      console.log("Fetching bill items for bill_id:", billToDelete.id);
      const { data: billItems, error: billItemsError } = await supabase
        .from('bill_items')
        .select('inventory_item_id, quantity, return_quantity')
        .eq('bill_id', billToDelete.id);

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
      console.log("Deleting bill items for bill_id:", billToDelete.id);
      
      const { data: billItemsToDelete, error: fetchBillItemsError } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billToDelete.id);

      if (fetchBillItemsError) {
        console.error("Error fetching bill items for logging:", fetchBillItemsError);
      }

      const { error: deleteItemsError } = await supabase
        .from('bill_items')
        .delete()
        .eq('bill_id', billToDelete.id);
      
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
      console.log("Deleting bill with id:", billToDelete.id, "user_id:", user.id);
      const { error: deleteBillError } = await supabase
        .from('bills')
        .delete()
        .eq('id', billToDelete.id)
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
      refreshData();
      
      // Step 5: Check for orphaned patients and clean them up
      if (billToDelete && billToDelete.id) {
        console.log("Checking for orphaned patient after prescription deletion");
        
        // Get the prescription to find the patient_id
        const { data: prescription, error: prescriptionError } = await supabase
          .from('prescriptions')
          .select('patient_id')
          .eq('id', prescriptionToDelete)
          .single();
          
        if (!prescriptionError && prescription) {
          // Check if this patient has any other prescriptions
          const { data: otherPrescriptions, error: otherPresError } = await supabase
            .from('prescriptions')
            .select('id')
            .eq('patient_id', prescription.patient_id)
            .neq('id', prescriptionToDelete);
            
          if (!otherPresError && otherPrescriptions && otherPrescriptions.length === 0) {
            // This patient has no other prescriptions, delete the patient
            console.log(`Deleting orphaned patient ${prescription.patient_id}`);
            const { error: deletePatientError } = await supabase
              .from('patients')
              .delete()
              .eq('id', prescription.patient_id)
              .eq('user_id', user.id);
              
            if (deletePatientError) {
              console.error("Error deleting orphaned patient:", deletePatientError);
            } else {
              console.log("✓ Orphaned patient deleted successfully");
            }
          }
        }
        
        // Delete the prescription record
        const { error: deletePrescriptionError } = await supabase
          .from('prescriptions')
          .delete()
          .eq('id', prescriptionToDelete)
          .eq('user_id', user.id);
          
        if (deletePrescriptionError) {
          console.error("Error deleting prescription:", deletePrescriptionError);
        } else {
          console.log("✓ Prescription deleted successfully");
        }
      }
      
      // Step 6: Emit events for cross-page updates
      console.log("Emitting cross-page update events");
      window.dispatchEvent(new CustomEvent('billDeleted', { 
        detail: { billId: billToDelete.id, type: 'bill_deleted' }
      }));
      window.dispatchEvent(new CustomEvent('dataRefreshNeeded', { 
        detail: { type: 'bill_deleted' }
      }));
      
      // Cross-tab communication
      localStorage.setItem('lastBillDeleted', JSON.stringify({
        billId: billToDelete.id,
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

  const handleDeleteAllPrescriptions = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    setIsDeletingAll(true);
    
    try {
      console.log("Starting delete all prescriptions process...");
      
      // First, get all bill IDs for this user
      const { data: userBills, error: billsQueryError } = await supabase
        .from('bills')
        .select('id')
        .eq('user_id', user.id);
      
      if (billsQueryError) {
        console.error('Error fetching user bills:', billsQueryError);
        throw billsQueryError;
      }
      
      // Delete all bill_items for this user's bills
      if (userBills && userBills.length > 0) {
        const billIds = userBills.map(bill => bill.id);
        const { error: billItemsError } = await supabase
          .from('bill_items')
          .delete()
          .in('bill_id', billIds);
        
        if (billItemsError) {
          console.error('Error deleting bill items:', billItemsError);
          throw billItemsError;
        }
      }
      
      // Delete all bills for this user
      const { error: billsError } = await supabase
        .from('bills')
        .delete()
        .eq('user_id', user.id);
      
      if (billsError) {
        console.error('Error deleting bills:', billsError);
        throw billsError;
      }
      
      // Delete all prescriptions for this user
      const { error: prescriptionsError } = await supabase
        .from('prescriptions')
        .delete()
        .eq('user_id', user.id);
      
      if (prescriptionsError) {
        console.error('Error deleting prescriptions:', prescriptionsError);
        throw prescriptionsError;
      }
      
      // Delete all patients for this user
      const { error: patientsError } = await supabase
        .from('patients')
        .delete()
        .eq('user_id', user.id);
      
      if (patientsError) {
        console.error('Error deleting patients:', patientsError);
        throw patientsError;
      }
      
      toast({
        title: "All Data Deleted",
        description: "All prescriptions, bills, and patients have been deleted successfully.",
        variant: "default"
      });
      
      // Emit events for cross-page updates
      window.dispatchEvent(new CustomEvent('dataRefreshNeeded', { 
        detail: { type: 'bulk_delete_prescriptions' }
      }));
      
      // Refresh the data
      refreshData();
      
    } catch (error: any) {
      console.error('Error deleting all data:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete all data",
        variant: "destructive"
      });
    } finally {
       setIsDeletingAll(false);
       setDeleteAllDialogOpen(false);
     }
   };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton variant="dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading prescriptions: {error?.message || String(error)}</p>
          <Button onClick={refreshData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="p-6 space-y-6">
          {/* Header Section with proper semantic HTML */}
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your prescription records efficiently
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setDeleteAllDialogOpen(true)} 
                variant="destructive" 
                size="sm"
                disabled={refreshing || isDeletingAll || filteredPrescriptions.length === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </Button>
            </div>
          </header>

          {/* Tabs and Search Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search by prescription number, bill number, doctor or patient name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            

          </div>

          {/* Main Content Card */}
          <Card className="rounded-xl border shadow-sm">
            <CardContent className="p-6">
              {refreshing && (
                <div className="flex items-center justify-center py-4 text-blue-600 mb-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Updating data...</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrescriptions.length === 0 ? (
            <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No prescriptions found</p>
              {!isLoading && (
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
            filteredPrescriptions.map((prescription) => {
              const prescriptionStatus = prescription.has_bill ? "completed" : "pending";
              return (
              <Card key={prescription.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium">{prescription.patients?.name}</h3>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge 
                          variant={prescriptionStatus === 'completed' ? 'default' : prescriptionStatus === 'pending' ? 'secondary' : 'destructive'}
                        >
                          {prescriptionStatus.charAt(0).toUpperCase() + prescriptionStatus.slice(1)}
                        </Badge>
                        <div className="text-right">
                          {prescription.has_bill ? (
                            <div className="space-y-1">
                              <div className="text-xl font-bold text-green-600">
                                ₹{prescription.bill_total_amount || 0}
                              </div>
                              <div className="text-xs text-gray-500">
                                Bill #{prescription.bill_number}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              No Bill Yet
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
                      {prescription.has_bill && (
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span>Bill Generated</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{format(new Date(prescription.created_at), "MMM dd, yyyy h:mm a")}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{prescription.patients?.phone_number}</span>
                      </div>
                    </div>
                  </div>
                    
                  {prescription.has_bill ? (
                    <>
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
                          <ArrowLeftRight className="h-4 w-4 mr-2" />
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
                    </>
                  ) : (
                    <div className="grid grid-cols-2 border-t border-gray-100">
                      <Button 
                        variant="ghost" 
                        className="rounded-none py-3 text-green-600 hover:bg-green-50"
                        onClick={() => handleCreateBill(prescription.id, prescription.patients)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Bill
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
                  )}
                </CardContent>
              </Card>
              );
            })
          )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Return Dialog */}

      <MedicineReturnDialog
        isOpen={showReturnDialog}
        onClose={() => {
          setShowReturnDialog(false);
          setReturnBillId(null);
        }}
        billId={returnBillId}
        onReturnProcessed={handleReturnSuccess}
      />
      
      {/* Bill Preview Dialog */}
      {showBillPreview && selectedBill && (
        <BillPreviewDialog
          open={showBillPreview}
          onOpenChange={setShowBillPreview}
          billData={selectedBill}
          items={selectedBill.items || []}
        />
      )}
      
      {/* Replacement Dialog */}
      <MedicineReplacementDialog
        isOpen={showReplacementDialog}
        onClose={() => {
          setShowReplacementDialog(false);
          setReplacementBillId(null);
        }}
        billId={replacementBillId}
        onSuccess={handleReplacementSuccess}
      />
      
      {/* Delete Dialog */}
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
      
      {/* Delete All Dialog */}
      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete All Prescriptions and Patients?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All prescription records</li>
                <li>All bill records and items</li>
                <li>All patient records</li>
                <li>All associated data for your account</li>
              </ul>
              <strong className="text-red-600 block mt-2">This will completely reset your data!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllPrescriptions} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingAll}
            >
              {isDeletingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      

    </>
  );
}
