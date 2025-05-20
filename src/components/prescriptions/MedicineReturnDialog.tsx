
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeftRight, 
  PackageCheck, 
  Trash2, 
  PackageOpen, 
  AlertCircle,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { processMedicineReturn, updateInventoryAfterReturn } from "@/utils/returnUtils";
import { MedicineReturn } from "@/types/returns";
import { Card } from "@/components/ui/card";

interface MedicineReturnItem {
  id: number;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  inventory_item_id: number;
  returned_quantity?: number;
}

interface MedicineReturnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billId: number | null;
  onSuccess?: () => void;
}

export function MedicineReturnDialog({
  isOpen,
  onClose,
  billId,
  onSuccess
}: MedicineReturnDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(false);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [billItems, setBillItems] = useState<MedicineReturnItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [returnToInventory, setReturnToInventory] = useState<boolean>(true);
  const [maxReturnQuantity, setMaxReturnQuantity] = useState<number>(0);
  const [currentReturnValue, setCurrentReturnValue] = useState<number>(0);
  
  useEffect(() => {
    if (isOpen && billId) {
      fetchBillItems();
    } else {
      resetForm();
    }
  }, [isOpen, billId]);
  
  useEffect(() => {
    if (selectedItem) {
      const item = billItems.find(item => item.id === selectedItem);
      if (item) {
        const remainingQuantity = item.quantity - (item.returned_quantity || 0);
        setMaxReturnQuantity(remainingQuantity);
        setReturnQuantity(Math.min(1, remainingQuantity));
        // Calculate current return value
        updateReturnValue(item.unit_price, Math.min(1, remainingQuantity));
      }
    } else {
      setMaxReturnQuantity(0);
      setReturnQuantity(0);
      setCurrentReturnValue(0);
    }
  }, [selectedItem, billItems]);
  
  const updateReturnValue = (unitPrice: number, quantity: number) => {
    setCurrentReturnValue(unitPrice * quantity);
  };
  
  const fetchBillItems = async () => {
    if (!billId) return;
    
    setFetchingItems(true);
    try {
      const { data, error } = await supabase
        .from('bill_items')
        .select(`
          id,
          inventory_item_id,
          quantity,
          return_quantity,
          unit_price,
          inventory:inventory_item_id (name)
        `)
        .eq('bill_id', billId);

      if (error) throw error;
      
      if (data) {
        const items = data.map(item => ({
          id: item.id,
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          returned_quantity: item.return_quantity,
          medicine_name: item.inventory?.name || 'Unknown Item'
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

  const handleReturnQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 0) {
      setReturnQuantity(0);
      setCurrentReturnValue(0);
      return;
    }
    
    const validValue = Math.min(value, maxReturnQuantity);
    setReturnQuantity(validValue);
    
    // Update return value
    const item = billItems.find(item => item.id === selectedItem);
    if (item) {
      updateReturnValue(item.unit_price, validValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem || returnQuantity <= 0) return;
    
    setProcessingReturn(true);
    try {
      const item = billItems.find(item => item.id === selectedItem);
      if (!item) throw new Error("Selected item not found");
      
      // Process the return
      const returnData: Omit<MedicineReturn, 'id' | 'return_date' | 'processed_by' | 'user_id'> = {
        bill_item_id: selectedItem,
        quantity: returnQuantity,
        reason: reason || null,
        status: returnToInventory ? 'inventory' : 'disposed'
      };
      
      await processMedicineReturn(returnData);
      
      // Update inventory if returning to stock
      if (returnToInventory) {
        await updateInventoryAfterReturn(item.inventory_item_id, returnQuantity, returnToInventory);
      }
      
      // Update the bill item's return quantity
      const { error: updateError } = await supabase
        .from('bill_items')
        .update({ 
          return_quantity: (item.returned_quantity || 0) + returnQuantity 
        })
        .eq('id', selectedItem);
      
      if (updateError) throw updateError;
      
      // Show success message with refund amount
      toast({
        title: "Return Processed",
        description: `Successfully processed return. Refund amount: ₹${currentReturnValue.toFixed(2)}`,
        variant: "default",
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) onSuccess();
      
      // Close the dialog
      onClose();
    } catch (error: any) {
      console.error("Error processing return:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process return",
        variant: "destructive",
      });
    } finally {
      setProcessingReturn(false);
    }
  };

  const resetForm = () => {
    setBillItems([]);
    setSelectedItem(null);
    setReturnQuantity(1);
    setReason('');
    setReturnToInventory(true);
    setMaxReturnQuantity(0);
    setCurrentReturnValue(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ArrowLeftRight className="mr-2 h-5 w-5" />
            Process Medicine Return
          </DialogTitle>
          <DialogDescription>
            Return unused medicines from this bill
          </DialogDescription>
        </DialogHeader>
        
        {fetchingItems ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : billItems.length === 0 ? (
          <div className="py-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">No items available for return in this bill</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item">Select Medicine</Label>
              <Select 
                value={selectedItem?.toString() || ''} 
                onValueChange={(value) => setSelectedItem(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a medicine to return" />
                </SelectTrigger>
                <SelectContent>
                  {billItems.map((item) => {
                    const remainingQuantity = item.quantity - (item.returned_quantity || 0);
                    if (remainingQuantity <= 0) return null;
                    
                    return (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.medicine_name} ({remainingQuantity} available)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedItem !== null && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Return Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      max={maxReturnQuantity}
                      value={returnQuantity}
                      onChange={handleReturnQuantityChange}
                    />
                    <span className="text-sm text-gray-500">
                      Max: {maxReturnQuantity}
                    </span>
                  </div>
                </div>

                <Card className="p-3 bg-green-50 border-green-200">
                  <div className="flex items-center text-green-700">
                    <DollarSign className="h-5 w-5 mr-2" />
                    <div>
                      <div className="font-medium">Return Value: ₹{currentReturnValue.toFixed(2)}</div>
                      <p className="text-xs text-green-600">This amount will be refunded</p>
                    </div>
                  </div>
                </Card>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Return (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Why is this medicine being returned?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="inventory"
                    checked={returnToInventory}
                    onCheckedChange={(checked) => setReturnToInventory(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="inventory"
                      className="text-sm font-medium leading-none"
                    >
                      Return to Inventory
                    </Label>
                    <p className="text-sm text-gray-500">
                      If unchecked, the items will be marked as disposed
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex space-x-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={processingReturn}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="gap-1"
                    disabled={!selectedItem || returnQuantity <= 0 || processingReturn}
                  >
                    {processingReturn ? (
                      <>Processing</>
                    ) : returnToInventory ? (
                      <>
                        <PackageOpen className="h-4 w-4" />
                        Return to Stock
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Dispose
                      </>
                    )}
                  </Button>
                </div>

                {returnToInventory && (
                  <div className="flex items-center bg-blue-50 p-2 rounded text-sm text-blue-700">
                    <PackageCheck className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Inventory will be increased by {returnQuantity} units</span>
                  </div>
                )}
              </>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
