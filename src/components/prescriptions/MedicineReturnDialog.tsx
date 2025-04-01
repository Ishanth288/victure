
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, PackageOpen, Trash2, AlertCircle } from "lucide-react";

interface BillItem {
  id: number;
  name: string;
  quantity: number;
  return_quantity: number;
  unit_price: number;
  inventory_item_id: number;
}

interface MedicineReturnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billId: number | null;
  onSuccess: () => void;
}

export function MedicineReturnDialog({
  isOpen,
  onClose,
  billId,
  onSuccess,
}: MedicineReturnDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [returnDestination, setReturnDestination] = useState<Record<number, "inventory" | "disposed">>({});
  const [reason, setReason] = useState("");
  
  useEffect(() => {
    if (isOpen && billId) {
      fetchBillItems();
    } else {
      setBillItems([]);
      setSelectedItems({});
      setReturnDestination({});
    }
  }, [isOpen, billId]);

  const fetchBillItems = async () => {
    if (!billId) return;
    
    setLoading(true);
    try {
      const { data: items, error } = await supabase
        .from('bill_items')
        .select(`
          id, 
          quantity,
          return_quantity,
          unit_price,
          inventory_item_id,
          inventory:inventory_items_id (name)
        `)
        .eq('bill_id', billId);

      if (error) throw error;
      
      if (items) {
        const formattedItems = items.map((item) => ({
          id: item.id,
          name: item.inventory?.name || `Product #${item.inventory_item_id}`,
          quantity: item.quantity,
          return_quantity: item.return_quantity || 0,
          unit_price: item.unit_price,
          inventory_item_id: item.inventory_item_id
        }));
        
        setBillItems(formattedItems);
      }
    } catch (error: any) {
      console.error("Error fetching bill items:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load medicine items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: number, value: number) => {
    const item = billItems.find(item => item.id === itemId);
    if (!item) return;
    
    // Ensure the return quantity doesn't exceed available quantity
    const availableQuantity = item.quantity - item.return_quantity;
    const validValue = Math.min(Math.max(0, value), availableQuantity);
    
    setSelectedItems({
      ...selectedItems,
      [itemId]: validValue
    });
    
    // Set default return destination if not already set
    if (validValue > 0 && !returnDestination[itemId]) {
      setReturnDestination({
        ...returnDestination,
        [itemId]: "inventory"
      });
    }
  };

  const handleDestinationChange = (itemId: number, destination: "inventory" | "disposed") => {
    setReturnDestination({
      ...returnDestination,
      [itemId]: destination
    });
  };

  const isReturnValid = () => {
    return (
      Object.entries(selectedItems).some(([_, quantity]) => quantity > 0) &&
      Object.entries(selectedItems).every(([itemId, quantity]) => {
        return quantity === 0 || returnDestination[Number(itemId)];
      })
    );
  };

  const handleSubmitReturn = async () => {
    if (!isReturnValid()) return;
    
    const selectedItemsArray = Object.entries(selectedItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => ({
        bill_item_id: Number(itemId),
        quantity,
        status: returnDestination[Number(itemId)],
        reason: reason.trim() || "Customer return"
      }));
    
    if (selectedItemsArray.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one medicine to return",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Start a transaction by wrapping operations in Promise.all
      await Promise.all(selectedItemsArray.map(async (returnItem) => {
        const billItem = billItems.find(item => item.id === returnItem.bill_item_id);
        if (!billItem) return;
        
        // 1. Create return record
        const { error: returnError } = await supabase
          .from('medicine_returns')
          .insert({
            bill_item_id: returnItem.bill_item_id,
            quantity: returnItem.quantity,
            reason: returnItem.reason,
            status: returnItem.status,
            processed_by: user.id,
            user_id: user.id
          });
          
        if (returnError) throw returnError;
        
        // 2. Update bill_item return_quantity
        const { error: billItemError } = await supabase
          .from('bill_items')
          .update({
            return_quantity: billItem.return_quantity + returnItem.quantity
          })
          .eq('id', returnItem.bill_item_id);
          
        if (billItemError) throw billItemError;
        
        // 3. Update inventory if returning to stock
        if (returnItem.status === 'inventory') {
          const { error: inventoryError } = await supabase
            .from('inventory')
            .update({
              quantity: supabase.rpc('increment', { 
                row_id: billItem.inventory_item_id,
                amount: returnItem.quantity
              })
            })
            .eq('id', billItem.inventory_item_id);
            
          if (inventoryError) throw inventoryError;
        }
      }));
      
      toast({
        title: "Return successful",
        description: "The medicine return has been processed successfully",
        variant: "default",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error processing return:", error);
      toast({
        title: "Return failed",
        description: error.message || "Failed to process medicine return",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ArrowLeft className="mr-2 h-5 w-5 text-primary" />
            Process Medicine Return
          </DialogTitle>
          <DialogDescription>
            Select medicines to return and specify whether they should be returned to inventory or disposed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : billItems.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              No medicines found in this bill
            </div>
          ) : (
            <>
              <div>
                <Label>Return Reason</Label>
                <Input 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for return (optional)"
                  className="mt-1"
                />
              </div>
              
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700">Select Items to Return</div>
                {billItems.map((item) => {
                  const availableQuantity = item.quantity - item.return_quantity;
                  const hasAvailableQuantity = availableQuantity > 0;
                  
                  if (!hasAvailableQuantity) return null;
                  
                  return (
                    <div key={item.id} className="p-3 border rounded-md bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {availableQuantity} of {item.quantity} available for return
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Label className="mr-2 text-sm">Qty:</Label>
                          <Input
                            type="number"
                            min={0}
                            max={availableQuantity}
                            value={selectedItems[item.id] || 0}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value || '0'))}
                            className="w-16 h-8 p-1 text-center"
                          />
                        </div>
                      </div>

                      {(selectedItems[item.id] || 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <RadioGroup 
                            value={returnDestination[item.id] || "inventory"} 
                            onValueChange={(value) => handleDestinationChange(item.id, value as "inventory" | "disposed")}
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="inventory" id={`inventory-${item.id}`} />
                              <Label htmlFor={`inventory-${item.id}`} className="cursor-pointer flex items-center">
                                <PackageOpen className="w-4 h-4 mr-1 text-green-600" />
                                Return to Inventory
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="disposed" id={`disposed-${item.id}`} />
                              <Label htmlFor={`disposed-${item.id}`} className="cursor-pointer flex items-center">
                                <Trash2 className="w-4 h-4 mr-1 text-red-600" />
                                Mark for Disposal
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {billItems.length > 0 && !billItems.some(item => (item.quantity - item.return_quantity) > 0) && (
                  <div className="flex items-center p-4 border rounded-md bg-amber-50 text-amber-700">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>All items from this bill have already been returned.</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitReturn} 
            disabled={loading || !isReturnValid()}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? "Processing..." : "Process Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
