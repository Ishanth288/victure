import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReturnReplacementPreviewDialog } from "@/components/billing/ReturnReplacementPreviewDialog";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeftRight, 
  PackageCheck, 
  AlertCircle,
  DollarSign,
  Package
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface MedicineReplacementItem {
  id: number;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  inventory_item_id: number;
  returned_quantity?: number;
}

interface InventoryItem {
  id: number;
  name: string;
  unit_cost: number;
  quantity: number;
}

interface MedicineReplacementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billId: number | null;
  onSuccess?: () => void;
}

export function MedicineReplacementDialog({
  isOpen,
  onClose,
  billId,
  onSuccess
}: MedicineReplacementDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(false);
  const [processingReplacement, setProcessingReplacement] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [billItems, setBillItems] = useState<MedicineReplacementItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedOriginalItem, setSelectedOriginalItem] = useState<number | null>(null);
  const [selectedReplacementItem, setSelectedReplacementItem] = useState<number | null>(null);
  const [replacementQuantity, setReplacementQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [maxReplacementQuantity, setMaxReplacementQuantity] = useState<number>(0);
  const [priceDifference, setPriceDifference] = useState<number>(0);
  
  useEffect(() => {
    if (isOpen && billId) {
      fetchBillItems();
      fetchInventoryItems();
    } else {
      resetForm();
    }
  }, [isOpen, billId]);
  
  useEffect(() => {
    if (selectedOriginalItem) {
      const item = billItems.find(item => item.id === selectedOriginalItem);
      if (item) {
        const remainingQuantity = item.quantity - (item.returned_quantity || 0);
        setMaxReplacementQuantity(remainingQuantity);
        setReplacementQuantity(Math.min(1, remainingQuantity));
        calculatePriceDifference(item, selectedReplacementItem, Math.min(1, remainingQuantity));
      }
    } else {
      setMaxReplacementQuantity(0);
      setReplacementQuantity(0);
      setPriceDifference(0);
    }
  }, [selectedOriginalItem, selectedReplacementItem, billItems, inventoryItems]);
  
  const calculatePriceDifference = (originalItem: MedicineReplacementItem | undefined, replacementItemId: number | null, quantity: number) => {
    if (!originalItem || !replacementItemId) {
      setPriceDifference(0);
      return;
    }
    
    const replacementItem = inventoryItems.find(item => item.id === replacementItemId);
    if (!replacementItem) {
      setPriceDifference(0);
      return;
    }
    
    const originalValue = originalItem.unit_price * quantity;
    const replacementValue = replacementItem.unit_cost * quantity;
    setPriceDifference(replacementValue - originalValue);
  };

  const generatePreviewData = async () => {
    if (!billId || !selectedOriginalItem || !selectedReplacementItem || !replacementQuantity) {
      return null;
    }

    try {
      // Fetch bill and prescription data
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select(`
          *,
          prescriptions (
            *,
            patients (
              name,
              phone_number
            )
          )
        `)
        .eq('id', billId)
        .single();

      if (billError) throw billError;

      const prescription = billData.prescriptions;
      const patient = prescription?.patients;

      const originalItem = billItems.find(item => item.id === selectedOriginalItem);
      const replacementItem = inventoryItems.find(item => item.id === selectedReplacementItem);
      
      if (!originalItem || !replacementItem) {
        throw new Error('Selected items not found');
      }
      
      // Calculate GST for each item individually
      const originalSubtotal = originalItem.unit_price * replacementQuantity;
      const originalGst = originalSubtotal * ((billData.gst_percentage || 0) / 100);
      const originalTotal = originalSubtotal + originalGst;
      
      const replacementSubtotal = replacementItem.unit_cost * replacementQuantity;
      const replacementGst = replacementSubtotal * ((billData.gst_percentage || 0) / 100);
      const replacementTotal = replacementSubtotal + replacementGst;
      
      const previewItems = [
        {
          id: originalItem.id,
          medicine_name: originalItem.medicine_name,
          quantity: -replacementQuantity, // Negative for return
          unit_price: originalItem.unit_price,
          total_price: -originalTotal, // Include GST in total price
          type: 'return' as const,
          reason: `Replaced with ${replacementItem.name}`,
        },
        {
          id: replacementItem.id,
          medicine_name: replacementItem.name,
          quantity: replacementQuantity,
          unit_price: replacementItem.unit_cost,
          total_price: replacementTotal, // Include GST in total price
          type: 'replacement' as const,
          reason: reason || 'Medicine replacement',
        }
      ];
      
      // Net calculations
      const netSubtotal = replacementSubtotal - originalSubtotal;
      const netGst = replacementGst - originalGst;
      const netTotal = replacementTotal - originalTotal;

      return {
        bill_number: `REPLACE-${billData.bill_number}`,
        date: new Date().toISOString(),
        type: 'replacement' as const,
        patient: patient ? {
          name: patient.name,
          phone_number: patient.phone_number,
        } : undefined,
        doctor_name: prescription?.doctor_name,
        prescription_number: prescription?.prescription_number,
        items: previewItems,
        subtotal: netSubtotal,
        gst_amount: netGst,
        gst_percentage: billData.gst_percentage || 0,
        total_amount: netTotal,
        refund_amount: netTotal < 0 ? Math.abs(netTotal) : 0,
        additional_charge: netTotal > 0 ? netTotal : 0,
        net_amount: netTotal,
      };
    } catch (error) {
      console.error('Error generating preview data:', error);
      return null;
    }
  };
  
  const fetchBillItems = async () => {
    if (!billId) return;
    
    setFetchingItems(true);
    try {
      // Fetch bill items first
      const { data: billItemsData, error: billItemsError } = await supabase
        .from('bill_items')
        .select(`
          id,
          inventory_item_id,
          quantity,
          return_quantity,
          unit_price
        `)
        .eq('bill_id', billId);

      if (billItemsError) throw billItemsError;
      
      if (billItemsData && billItemsData.length > 0) {
        // Get all unique inventory item IDs
        const inventoryIds = [...new Set(billItemsData.map(item => item.inventory_item_id))];
        
        // Fetch inventory names separately
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('id, name')
          .in('id', inventoryIds);

        if (inventoryError) throw inventoryError;
        
        // Create a map for quick lookup
        const inventoryMap = new Map(inventoryData?.map(inv => [inv.id, inv.name]) || []);
        
        const items = billItemsData.map(item => ({
          id: item.id,
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          returned_quantity: item.return_quantity,
          medicine_name: inventoryMap.get(item.inventory_item_id) || 'Unknown Item'
        }));
        
        setBillItems(items);
      }
    } catch (error) {
      console.error('Error fetching bill items:', error);
      toast({
        title: "Error",
        description: "Failed to load bill items",
        variant: "destructive",
      });
    } finally {
      setFetchingItems(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, unit_cost, quantity')
        .eq('user_id', user.id)
        .gt('quantity', 0) // Only show items with stock
        .order('name');

      if (error) throw error;
      
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive",
      });
    }
  };

  const handleReplacementQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 0) {
      setReplacementQuantity(0);
      setPriceDifference(0);
      return;
    }
    
    const validValue = Math.min(value, maxReplacementQuantity);
    setReplacementQuantity(validValue);
    
    const originalItem = billItems.find(item => item.id === selectedOriginalItem);
    calculatePriceDifference(originalItem, selectedReplacementItem, validValue);
  };

  const handlePreview = async () => {
    if (!selectedOriginalItem || !selectedReplacementItem || !replacementQuantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const preview = await generatePreviewData();
    if (preview) {
      setPreviewData(preview);
      setShowPreview(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOriginalItem || !selectedReplacementItem || replacementQuantity <= 0) return;
    
    setProcessingReplacement(true);
    try {
      const originalItem = billItems.find(item => item.id === selectedOriginalItem);
      const replacementItem = inventoryItems.find(item => item.id === selectedReplacementItem);
      
      if (!originalItem || !replacementItem) throw new Error("Selected items not found");
      
      // Step 1: Add new bill item for replacement (don't update original item here)
      const { error: insertError } = await supabase
        .from('bill_items')
        .insert({
          bill_id: billId,
          inventory_item_id: selectedReplacementItem,
          quantity: replacementQuantity,
          unit_price: replacementItem.unit_cost,
          total_price: replacementItem.unit_cost * replacementQuantity,
          is_replacement: true,
          replaced_item_id: selectedOriginalItem,
          replacement_reason: reason || null
        });
      
      if (insertError) throw insertError;

      // Step 2: Update the original bill item to track the replacement
      const { error: updateError } = await supabase
        .from('bill_items')
        .update({ 
          return_quantity: (originalItem.returned_quantity || 0) + replacementQuantity,
          replacement_item_id: selectedReplacementItem,
          replacement_quantity: replacementQuantity,
          replacement_reason: reason || null
        })
        .eq('id', selectedOriginalItem);
      
      if (updateError) {
        console.warn("Warning - failed to update original item tracking:", updateError);
        // Don't throw error here as the main replacement was successful
      }

      // Step 3: Update inventory - decrease replacement item, increase original item
      // First update original item inventory (increase)
      const { data: origInventory, error: origFetchError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', originalItem.inventory_item_id)
        .single();
      
      if (!origFetchError && origInventory) {
        const { error: origUpdateError } = await supabase
          .from('inventory')
          .update({ quantity: origInventory.quantity + replacementQuantity })
          .eq('id', originalItem.inventory_item_id);
        
        if (origUpdateError) {
          console.error("Error updating original item inventory:", origUpdateError);
        }
      }

      // Then update replacement item inventory (decrease)
      const { data: replInventory, error: replFetchError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', selectedReplacementItem)
        .single();
      
      if (!replFetchError && replInventory) {
        const { error: replUpdateError } = await supabase
          .from('inventory')
          .update({ quantity: replInventory.quantity - replacementQuantity })
          .eq('id', selectedReplacementItem);
        
        if (replUpdateError) {
          console.error("Error updating replacement item inventory:", replUpdateError);
        }
      }
      
      // Show success message with price difference
      const priceDiffMessage = priceDifference > 0 
        ? `Additional charge: ₹${priceDifference.toFixed(2)}`
        : priceDifference < 0 
        ? `Refund: ₹${Math.abs(priceDifference).toFixed(2)}`
        : 'No price difference';

      toast({
        title: "Replacement Processed",
        description: `Successfully processed replacement. ${priceDiffMessage}`,
        variant: "default",
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) onSuccess();
      
      // Close the dialog
      onClose();
    } catch (error: any) {
      console.error("Error processing replacement:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process replacement",
        variant: "destructive",
      });
    } finally {
      setProcessingReplacement(false);
    }
  };

  const resetForm = () => {
    setBillItems([]);
    setInventoryItems([]);
    setSelectedOriginalItem(null);
    setSelectedReplacementItem(null);
    setReplacementQuantity(1);
    setReason('');
    setMaxReplacementQuantity(0);
    setPriceDifference(0);
    setShowPreview(false);
    setPreviewData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Process Medicine Replacement
          </DialogTitle>
          <DialogDescription>
            Replace medicines with equivalent or alternative products
          </DialogDescription>
        </DialogHeader>
        
        {fetchingItems ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : billItems.length === 0 ? (
          <div className="py-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">No items available for replacement in this bill</p>
          </div>
        ) : (
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="originalItem">Original Medicine to Replace</Label>
              <Select 
                value={selectedOriginalItem?.toString() || ''} 
                onValueChange={(value) => setSelectedOriginalItem(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select medicine to replace" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                  {billItems.map((item) => {
                    const remainingQuantity = item.quantity - (item.returned_quantity || 0);
                    if (remainingQuantity <= 0) return null;
                    
                    return (
                      <SelectItem 
                        key={item.id} 
                        value={item.id.toString()}
                        className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                      >
                        {item.medicine_name} ({remainingQuantity} available - ₹{item.unit_price}/unit)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replacementItem">Replacement Medicine</Label>
              <Select 
                value={selectedReplacementItem?.toString() || ''} 
                onValueChange={(value) => setSelectedReplacementItem(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select replacement medicine" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                  {inventoryItems.map((item) => (
                    <SelectItem 
                      key={item.id} 
                      value={item.id.toString()}
                      className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                    >
                      {item.name} ({item.quantity} in stock - ₹{item.unit_cost}/unit)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOriginalItem !== null && selectedReplacementItem !== null && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Replacement Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      max={maxReplacementQuantity}
                      value={replacementQuantity}
                      onChange={handleReplacementQuantityChange}
                    />
                    <span className="text-sm text-gray-500">
                      Max: {maxReplacementQuantity}
                    </span>
                  </div>
                </div>

                <Card className={`p-3 ${priceDifference > 0 ? 'bg-red-50 border-red-200' : priceDifference < 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className={`flex items-center ${priceDifference > 0 ? 'text-red-700' : priceDifference < 0 ? 'text-green-700' : 'text-blue-700'}`}>
                    <DollarSign className="h-5 w-5 mr-2" />
                    <div>
                      <div className="font-medium">
                        {priceDifference > 0 
                          ? `Additional Charge: ₹${priceDifference.toFixed(2)}`
                          : priceDifference < 0 
                          ? `Refund: ₹${Math.abs(priceDifference).toFixed(2)}`
                          : 'No Price Difference'
                        }
                      </div>
                      <p className="text-xs">
                        {priceDifference > 0 
                          ? 'Customer needs to pay extra'
                          : priceDifference < 0 
                          ? 'Customer will receive refund'
                          : 'Equal value replacement'
                        }
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Replacement (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Why is this medicine being replaced?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex space-x-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={processingReplacement}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={handlePreview}
                    className="gap-1"
                    disabled={!selectedOriginalItem || !selectedReplacementItem || replacementQuantity <= 0 || processingReplacement}
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    Preview Replacement
                  </Button>
                </div>

                <div className="flex items-center bg-blue-50 p-2 rounded text-sm text-blue-700">
                  <PackageCheck className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Original item will be returned to inventory, replacement item will be deducted</span>
                </div>
              </>
            )}
          </form>
        )}
        
        {showPreview && previewData && (
           <ReturnReplacementPreviewDialog
             isOpen={showPreview}
             onClose={() => setShowPreview(false)}
             data={previewData}
             onConfirm={() => {
               setShowPreview(false);
               handleSubmit();
             }}
           />
         )}
      </DialogContent>
    </Dialog>
  );
}