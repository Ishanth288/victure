import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle,
  Loader2,
  PackageCheck, 
  Trash2, 
  PackageOpen, 
  AlertCircle,
  RotateCcw,
  Archive,
  RefreshCw,
  Search,
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { processMedicineReturn, updateInventoryAfterReturn } from "@/utils/returnUtils";
import { logMedicineReturn } from "@/utils/deletionTracker";
import { DatabaseMedicineReturn } from "@/types/returns";
import { useAuth } from "@/hooks/useAuth";

interface MedicineReturnItem {
  id: number;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  return_quantity: number;
  inventory_item_id: number;
  name?: string;
  selected?: boolean;
  return_type?: 'inventory' | 'dispose' | 'exchange';
}

type ReturnType = 'inventory' | 'dispose' | 'exchange';

interface MedicineReturnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billId: number | null;
  onReturnProcessed: () => void;
}

const MedicineReturnDialog: React.FC<MedicineReturnDialogProps> = ({
  isOpen,
  onClose,
  billId,
  onReturnProcessed,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<MedicineReturnItem[]>([]);
  const [returnQuantities, setReturnQuantities] = useState<{ [key: number]: number }>({});
  const [returnTypes, setReturnTypes] = useState<{ [key: number]: ReturnType }>({});
  const [returnReason, setReturnReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentReturnValue, setCurrentReturnValue] = useState(0);
  const [billGstPercentage, setBillGstPercentage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'confirm'>('select');

  useEffect(() => {
    if (isOpen && billId) {
      fetchBillItems();
      fetchBillGstPercentage();
    }
  }, [isOpen, billId]);

  const fetchBillItems = async () => {
    try {
      const { data: billItemsData, error } = await supabase
        .from("bill_items")
        .select(`
          id,
          inventory_item_id,
          quantity,
          return_quantity,
          unit_price
        `)
        .eq("bill_id", billId);

      if (error) throw error;

      if (billItemsData) {
        const itemsWithNames = await Promise.all(
          billItemsData.map(async (item) => {
            const { data: inventoryData, error: inventoryError } = await supabase
              .from("inventory")
              .select("name")
              .eq("id", item.inventory_item_id)
              .single();

            console.log('🔍 MedicineReturnDialog: Fetching bill items for billId:', billId);
            console.log('🔍 MedicineReturnDialog: inventoryData:', inventoryData);
            console.log('🔍 MedicineReturnDialog: inventoryError:', inventoryError);
            console.log('🔍 MedicineReturnDialog: Final name assigned:', inventoryData?.name || 'Unknown');
            if (inventoryError) {
              console.error(`Error fetching inventory for item ${item.inventory_item_id}:`, inventoryError);
            }

            return {
              ...item,
              medicine_name: inventoryData?.name || "Unknown",
              return_quantity: item.return_quantity || 0,
            };
          })
        );

        setSelectedItems(itemsWithNames);
        updateReturnValue(itemsWithNames, returnQuantities);
      }
    } catch (error) {
      console.error("Error fetching bill items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bill items",
        variant: "destructive",
      });
    }
  };

  const fetchBillGstPercentage = async () => {
    try {
      const { data: billData, error } = await supabase
        .from("bills")
        .select("gst_percentage")
        .eq("id", billId)
        .single();

      if (error) throw error;

      if (billData) {
        setBillGstPercentage(billData.gst_percentage || 0);
      }
    } catch (error) {
      console.error("Error fetching bill GST percentage:", error);
    }
  };

  const updateReturnValue = (items: MedicineReturnItem[], quantities: { [key: number]: number }) => {
    const baseValue = items.reduce((total, item) => {
      if (!item.selected) return total;
      const returnQty = quantities[item.id] || 0;
      const unitPrice = item.unit_price || 0;
      return total + (returnQty * unitPrice);
    }, 0);

    // Calculate GST-inclusive return value
    const gstMultiplier = 1 + (billGstPercentage / 100);
    const totalValue = baseValue * gstMultiplier;
    
    setCurrentReturnValue(totalValue);
  };

  const filteredItems = selectedItems.filter(item => 
    item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItemsForReturn = selectedItems.filter(item => item.selected);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    const updatedItems = selectedItems.map(item => ({
      ...item,
      selected: checked
    }));
    setSelectedItems(updatedItems);
    updateReturnValue(updatedItems, returnQuantities);
  };

  const handleItemSelect = (itemId: number, checked: boolean) => {
    const updatedItems = selectedItems.map(item => 
      item.id === itemId ? { ...item, selected: checked } : item
    );
    setSelectedItems(updatedItems);
    setSelectAll(updatedItems.every(item => item.selected));
    updateReturnValue(updatedItems, returnQuantities);
  };

  const handleReturnTypeChange = (itemId: number, returnType: ReturnType) => {
    setReturnTypes(prev => ({ ...prev, [itemId]: returnType }));
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    const newQuantities = { ...returnQuantities, [itemId]: quantity };
    setReturnQuantities(newQuantities);
    updateReturnValue(selectedItems, newQuantities);
  };

  const handleSubmit = async () => {
    if (!returnReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the return",
        variant: "destructive",
      });
      return;
    }

    const itemsToReturn = selectedItems.filter(item => 
      item.selected && returnQuantities[item.id] > 0
    );
    
    if (itemsToReturn.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item to return with quantity > 0",
        variant: "destructive",
      });
      return;
    }

    // Validate return types
    const missingReturnTypes = itemsToReturn.filter(item => !returnTypes[item.id]);
    if (missingReturnTypes.length > 0) {
      toast({
        title: "Error",
        description: "Please select return type for all selected items",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      for (const item of itemsToReturn) {
        const returnQuantity = returnQuantities[item.id];
        const returnType = returnTypes[item.id];
        
        if (returnQuantity > 0) {
          const returnData: Omit<DatabaseMedicineReturn, 'id' | 'created_at'> = {
            bill_item_id: item.id,
            quantity: returnQuantity,
            reason: `${returnReason} (Return Type: ${returnType})`,
            return_date: new Date().toISOString(),
            status: 'completed',
            processed_by: user?.id || '',
            user_id: user?.id || ''
          };

          await processMedicineReturn(returnData);
          
          // Handle different return types
          if (returnType === 'inventory') {
            // Return to inventory - add back to stock
            await updateInventoryAfterReturn(item.inventory_item_id, returnQuantity, true);
          } else if (returnType === 'dispose') {
            // Dispose - don't add back to inventory, just log the return
            console.log(`Disposed ${returnQuantity} units of ${item.medicine_name}`);
          } else if (returnType === 'exchange') {
            // Exchange - log for replacement processing
            console.log(`Exchange requested for ${returnQuantity} units of ${item.medicine_name}`);
          }
        }
      }

      await logMedicineReturn(billId, {
        bill_id: billId,
        items: itemsToReturn.map(item => ({
          medicine_name: item.medicine_name,
          quantity: returnQuantities[item.id],
          return_value: (returnQuantities[item.id] * item.unit_price * (1 + billGstPercentage / 100))
        })),
        reason: returnReason,
        return_value: currentReturnValue
      });

      const returnTypeSummary = itemsToReturn.reduce((acc, item) => {
        const type = returnTypes[item.id];
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<ReturnType, number>);

      const summaryText = Object.entries(returnTypeSummary)
        .map(([type, count]) => `${count} ${type}`)
        .join(', ');

      toast({
        title: "Success",
        description: `Medicine return processed successfully. Items: ${summaryText}. Return value: ₹${currentReturnValue.toFixed(2)}`,
      });

      onReturnProcessed();
      onClose();
      
      // Reset form
      setSelectedItems([]);
      setReturnQuantities({});
      setReturnTypes({});
      setReturnReason("");
      setCurrentReturnValue(0);
      setBillGstPercentage(0);
      setSearchTerm("");
      setSelectAll(false);
      setCurrentStep('select');
    } catch (error) {
      console.error("Error processing return:", error);
      toast({
        title: "Error",
        description: "Failed to process medicine return",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center space-x-2 ${
          currentStep === 'select' ? 'text-blue-600' : 'text-gray-400'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            1
          </div>
          <span className="font-medium">Select Items</span>
        </div>
        <div className="w-8 h-px bg-gray-300" />
        <div className={`flex items-center space-x-2 ${
          currentStep === 'configure' ? 'text-blue-600' : 'text-gray-400'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'configure' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            2
          </div>
          <span className="font-medium">Configure Returns</span>
        </div>
        <div className="w-8 h-px bg-gray-300" />
        <div className={`flex items-center space-x-2 ${
          currentStep === 'confirm' ? 'text-blue-600' : 'text-gray-400'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            3
          </div>
          <span className="font-medium">Confirm</span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Medicine Return System
          </DialogTitle>
          <DialogDescription>
            Advanced return processing with inventory management options
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Return Value Display */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Current Return Value (incl. GST)</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                ₹{currentReturnValue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-blue-700">
                {billGstPercentage > 0 && `GST Rate: ${billGstPercentage}%`}
              </div>
              <div className="text-sm text-blue-700">
                Selected: {selectedItemsForReturn.length} items
              </div>
            </div>
          </Card>

          {/* Step Content */}
          {currentStep === 'select' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Items to Return</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search medicines..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all" className="text-sm font-medium">
                      Select All
                    </Label>
                  </div>
                </div>
              </div>
              
              {selectedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PackageOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items found for this bill</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredItems.map((item) => {
                    const maxReturnQuantity = item.quantity - (item.return_quantity || 0);
                    
                    return (
                      <Card key={item.id} className={`p-4 transition-all ${
                        item.selected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={item.selected || false}
                              onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                              disabled={maxReturnQuantity === 0}
                            />
                            <PackageCheck className={`h-5 w-5 ${
                              maxReturnQuantity === 0 ? 'text-gray-400' : 'text-green-600'
                            }`} />
                            <div>
                              <h4 className="font-medium">{item.medicine_name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Available: {maxReturnQuantity}</span>
                                <span>Unit Price: ₹{item.unit_price}</span>
                                <span>Total Sold: {item.quantity}</span>
                                {item.return_quantity > 0 && (
                                  <Badge variant="secondary">
                                    Previously Returned: {item.return_quantity}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {maxReturnQuantity === 0 && (
                            <div className="flex items-center gap-2 text-amber-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Fully Returned</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep === 'configure' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configure Return Details</h3>
              {selectedItemsForReturn.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items selected for return</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep('select')}
                    className="mt-4"
                  >
                    Go Back to Selection
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {selectedItemsForReturn.map((item) => {
                    const maxReturnQuantity = item.quantity - (item.return_quantity || 0);
                    const currentReturnQty = returnQuantities[item.id] || 0;
                    const currentReturnType = returnTypes[item.id] || 'inventory';
                    
                    return (
                      <Card key={item.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <PackageCheck className="h-5 w-5 text-green-600" />
                            <div>
                              <h4 className="font-medium">{item.medicine_name}</h4>
                              <div className="text-sm text-gray-600">
                                Available: {maxReturnQuantity} | Unit Price: ₹{item.unit_price}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor={`quantity-${item.id}`} className="text-sm font-medium">
                                Return Quantity
                              </Label>
                              <Input
                                id={`quantity-${item.id}`}
                                type="number"
                                min="0"
                                max={maxReturnQuantity}
                                value={currentReturnQty}
                                onChange={(e) => {
                                  const value = Math.min(
                                    Math.max(0, parseInt(e.target.value) || 0),
                                    maxReturnQuantity
                                  );
                                  handleQuantityChange(item.id, value);
                                }}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">Return Type</Label>
                              <Select 
                                value={currentReturnType} 
                                onValueChange={(value: ReturnType) => handleReturnTypeChange(item.id, value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inventory">
                                    <div className="flex items-center gap-2">
                                      <RotateCcw className="h-4 w-4 text-green-600" />
                                      Return to Inventory
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="dispose">
                                    <div className="flex items-center gap-2">
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                      Dispose
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="exchange">
                                    <div className="flex items-center gap-2">
                                      <RefreshCw className="h-4 w-4 text-blue-600" />
                                      Exchange/Replace
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">Return Value</Label>
                              <div className="mt-1 p-2 bg-gray-50 rounded border text-sm font-medium">
                                ₹{(currentReturnQty * item.unit_price * (1 + billGstPercentage / 100)).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            {currentReturnType === 'inventory' && '✓ Will be added back to inventory stock'}
                            {currentReturnType === 'dispose' && '⚠️ Will be permanently removed from inventory'}
                            {currentReturnType === 'exchange' && '🔄 Will be marked for replacement processing'}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Confirm Return Details</h3>
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="space-y-3">
                  <h4 className="font-medium text-yellow-800">Return Summary</h4>
                  {selectedItemsForReturn.filter(item => returnQuantities[item.id] > 0).map((item) => {
                    const returnQty = returnQuantities[item.id];
                    const returnType = returnTypes[item.id];
                    const returnValue = returnQty * item.unit_price * (1 + billGstPercentage / 100);
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.medicine_name}</span>
                          <Badge variant="outline">{returnType}</Badge>
                        </div>
                        <div className="text-right">
                          <div>Qty: {returnQty}</div>
                          <div className="font-medium">₹{returnValue.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <Separator />
                  <div className="flex justify-between font-semibold text-yellow-800">
                    <span>Total Return Value:</span>
                    <span>₹{currentReturnValue.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Return Reason - Show on configure and confirm steps */}
          {(currentStep === 'configure' || currentStep === 'confirm') && (
            <div className="space-y-2">
              <Label htmlFor="return-reason" className="text-sm font-medium">
                Return Reason *
              </Label>
              <Textarea
                id="return-reason"
                placeholder="Please provide a reason for the return..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="min-h-[80px]"
                required
                disabled={currentStep === 'confirm'}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            
            {currentStep === 'select' && (
              <Button
                type="button"
                onClick={() => setCurrentStep('configure')}
                disabled={selectedItemsForReturn.length === 0}
                className="min-w-[120px]"
              >
                Configure Returns
              </Button>
            )}
            
            {currentStep === 'configure' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('select')}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep('confirm')}
                  disabled={selectedItemsForReturn.filter(item => returnQuantities[item.id] > 0).length === 0 || !returnReason.trim()}
                  className="min-w-[120px]"
                >
                  Review & Confirm
                </Button>
              </>
            )}
            
            {currentStep === 'confirm' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('configure')}
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isProcessing || currentReturnValue === 0 || !returnReason.trim()}
                  className="min-w-[120px] bg-red-600 hover:bg-red-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Process Return (₹{currentReturnValue.toFixed(2)})
                    </>
                  )}
                </Button>
              </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicineReturnDialog;
