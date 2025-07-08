import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeftRight,
  DollarSign,
  Search,
  PackageOpen,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { processMedicineReturn, updateInventoryAfterReturn } from "@/utils/returnUtils";
import { DatabaseMedicineReturn } from "@/types/returns";
import { ReturnReplacementPreviewDialog } from "@/components/billing/ReturnReplacementPreviewDialog";

type ReturnType = 'inventory' | 'dispose';

interface ReturnItem {
  id: number;
  inventory_item_id: number;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  return_quantity: number;
  max_returnable: number;
}

interface ReturnConfiguration {
  itemId: number;
  quantity: number;
  type: ReturnType;
  reason?: string;
}

interface NewMedicineReturnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billId: number | null;
  onReturnProcessed: () => void;
}

const NewMedicineReturnDialog: React.FC<NewMedicineReturnDialogProps> = ({
  isOpen,
  onClose,
  billId,
  onReturnProcessed,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Core state
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [returnConfigs, setReturnConfigs] = useState<Map<number, ReturnConfiguration>>(new Map());
  const [billGstPercentage, setBillGstPercentage] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'preview' | 'confirm'>('select');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Reset all state when dialog opens/closes or billId changes
  const resetState = useCallback(() => {
    setItems([]);
    setSelectedItemIds(new Set());
    setReturnConfigs(new Map());
    setBillGstPercentage(0);
    setLoading(false);
    setProcessing(false);
    setSearchTerm("");
    setCurrentStep('select');
    setShowPreview(false);
    setPreviewData(null);
  }, []);

  // Reset state when dialog closes or billId changes
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    if (billId) {
      resetState();
    }
  }, [billId, resetState]);

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen && billId) {
      loadBillData();
    }
  }, [isOpen, billId]);

  const loadBillData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBillItems(),
        fetchBillGstPercentage()
      ]);
    } catch (error) {
      console.error('Error loading bill data:', error);
      toast({
        title: "Error",
        description: "Failed to load bill data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBillItems = async () => {
    if (!billId) return;

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
          const { data: inventoryData } = await supabase
            .from("inventory")
            .select("name")
            .eq("id", item.inventory_item_id)
            .single();

          const maxReturnable = item.quantity - (item.return_quantity || 0);
          
          return {
            id: item.id,
            inventory_item_id: item.inventory_item_id,
            medicine_name: inventoryData?.name || "Unknown",
            quantity: item.quantity,
            unit_price: item.unit_price,
            return_quantity: item.return_quantity || 0,
            max_returnable: maxReturnable,
          };
        })
      );

      // Only include items that can be returned
      const returnableItems = itemsWithNames.filter(item => item.max_returnable > 0);
      setItems(returnableItems);
    }
  };

  const fetchBillGstPercentage = async () => {
    if (!billId) return;

    const { data: billData, error } = await supabase
      .from("bills")
      .select("gst_percentage")
      .eq("id", billId)
      .single();

    if (error) throw error;
    setBillGstPercentage(billData?.gst_percentage || 0);
  };

  const calculateReturnValue = useCallback(() => {
    let total = 0;
    returnConfigs.forEach((config) => {
      const item = items.find(i => i.id === config.itemId);
      if (item) {
        total += config.quantity * item.unit_price;
      }
    });
    return total * (1 + billGstPercentage / 100);
  }, [returnConfigs, items, billGstPercentage]);

  const filteredItems = items.filter(item => 
    item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemSelection = (itemId: number, selected: boolean) => {
    const newSelectedIds = new Set(selectedItemIds);
    const newConfigs = new Map(returnConfigs);
    
    if (selected) {
      newSelectedIds.add(itemId);
      // Initialize with default configuration
      newConfigs.set(itemId, {
        itemId,
        quantity: 1,
        type: 'inventory',
      });
    } else {
      newSelectedIds.delete(itemId);
      newConfigs.delete(itemId);
    }
    
    setSelectedItemIds(newSelectedIds);
    setReturnConfigs(newConfigs);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const newSelectedIds = new Set(filteredItems.map(item => item.id));
      const newConfigs = new Map<number, ReturnConfiguration>();
      
      filteredItems.forEach(item => {
        newConfigs.set(item.id, {
          itemId: item.id,
          quantity: 1,
          type: 'inventory',
        });
      });
      
      setSelectedItemIds(newSelectedIds);
      setReturnConfigs(newConfigs);
    } else {
      setSelectedItemIds(new Set());
      setReturnConfigs(new Map());
    }
  };

  const updateReturnConfig = (itemId: number, updates: Partial<ReturnConfiguration>) => {
    const newConfigs = new Map(returnConfigs);
    const existing = newConfigs.get(itemId);
    if (existing) {
      newConfigs.set(itemId, { ...existing, ...updates });
      setReturnConfigs(newConfigs);
    }
  };

  const canProceedToNext = () => {
    if (currentStep === 'select') {
      return selectedItemIds.size > 0;
    }
    if (currentStep === 'configure') {
      return Array.from(returnConfigs.values()).every(config => 
        config.quantity > 0 && config.type
      );
    }
    if (currentStep === 'preview') {
      return true;
    }
    return true;
  };

  const generatePreviewData = async () => {
    if (!billId) return null;

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

      const previewItems = Array.from(returnConfigs.entries()).map(([itemId, config]) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return null;

        return {
          id: itemId,
          medicine_name: item.medicine_name,
          quantity: config.quantity,
          unit_price: item.unit_price,
          total_price: config.quantity * item.unit_price,
          type: 'return' as const,
          reason: config.reason || `Return Type: ${config.type}`,
        };
      }).filter(Boolean);

      const subtotal = calculateReturnValue() / (1 + billGstPercentage / 100);
      const gstAmount = subtotal * (billGstPercentage / 100);
      const totalAmount = calculateReturnValue();

      return {
        bill_number: `RETURN-${billData.bill_number}`,
        date: new Date().toISOString(),
        type: 'return' as const,
        patient: patient ? {
          name: patient.name,
          phone_number: patient.phone_number,
        } : undefined,
        doctor_name: prescription?.doctor_name,
        prescription_number: prescription?.prescription_number,
        items: previewItems,
        subtotal,
        gst_amount: gstAmount,
        gst_percentage: billGstPercentage,
        total_amount: totalAmount,
        refund_amount: totalAmount,
        net_amount: -totalAmount, // Negative because it's a refund
      };
    } catch (error) {
      console.error('Error generating preview data:', error);
      return null;
    }
  };

  const handleNext = async () => {
    if (currentStep === 'select') {
      setCurrentStep('configure');
    } else if (currentStep === 'configure') {
      const preview = await generatePreviewData();
      if (preview) {
        setPreviewData(preview);
        setShowPreview(true);
      }
    } else if (currentStep === 'preview') {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'configure') {
      setCurrentStep('select');
    } else if (currentStep === 'preview') {
      setCurrentStep('configure');
      setShowPreview(false);
    } else if (currentStep === 'confirm') {
      setCurrentStep('preview');
    }
  };

  const handleSubmit = async () => {
    if (!user || returnConfigs.size === 0) return;

    setProcessing(true);
    try {
      for (const [itemId, config] of returnConfigs) {
        const item = items.find(i => i.id === itemId);
        if (!item) continue;

        const refundAmount = config.quantity * item.unit_price * (1 + billGstPercentage / 100);
        
        const returnData = {
          bill_item_id: itemId,
          quantity: config.quantity,
          reason: config.reason || `Return Type: ${config.type}`,
          return_date: new Date().toISOString(),
          status: config.type === 'inventory' ? 'inventory' : 'disposed',
          processed_by: user.id,
          user_id: user.id
        };

        await processMedicineReturn(returnData);
        
        // Handle inventory updates based on return type
          if (config.type === 'inventory' && item.inventory_item_id) {
            // Add back to inventory using the existing utility function
            try {
              await updateInventoryAfterReturn(
                item.inventory_item_id,
                config.quantity,
                true
              );
            } catch (inventoryError) {
              console.error('Error updating inventory:', inventoryError);
            }
          }
        // For 'dispose', we don't add back to inventory
      }

      toast({
        title: "Success",
        description: `Return processed successfully. Total refund: ₹${calculateReturnValue().toFixed(2)}`,
      });

      onReturnProcessed();
      onClose();
    } catch (error) {
      console.error('Error processing return:', error);
      toast({
        title: "Error",
        description: "Failed to process return",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        {['select', 'configure', 'preview', 'confirm'].map((step, index) => {
          const isActive = currentStep === step;
          const isCompleted = ['select', 'configure', 'preview', 'confirm'].indexOf(currentStep) > index;
          
          return (
            <React.Fragment key={step}>
              <div className={`flex items-center space-x-2 ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-blue-600 text-white' : 
                  isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <span className="font-medium capitalize">{step}</span>
              </div>
              {index < 3 && <div className="w-8 h-px bg-gray-300" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const renderSelectStep = () => (
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
              checked={filteredItems.length > 0 && filteredItems.every(item => selectedItemIds.has(item.id))}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm font-medium">
              Select All
            </Label>
          </div>
        </div>
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <PackageOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No returnable items found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className={`p-4 transition-all ${
              selectedItemIds.has(item.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedItemIds.has(item.id)}
                    onCheckedChange={(checked) => handleItemSelection(item.id, checked as boolean)}
                  />
                  <PackageCheck className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{item.medicine_name}</p>
                    <p className="text-sm text-gray-600">
                      Purchased: {item.quantity} | Returned: {item.return_quantity} | Available: {item.max_returnable}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{item.unit_price}</p>
                  <Badge variant="outline">Max: {item.max_returnable}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderConfigureStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Configure Return Details</h3>
      
      <div className="grid gap-4">
        {Array.from(selectedItemIds).map(itemId => {
          const item = items.find(i => i.id === itemId);
          const config = returnConfigs.get(itemId);
          if (!item || !config) return null;
          
          return (
            <Card key={itemId} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label className="text-sm font-medium">{item.medicine_name}</Label>
                  <p className="text-xs text-gray-600">Max returnable: {item.max_returnable}</p>
                </div>
                
                <div>
                  <Label htmlFor={`quantity-${itemId}`}>Quantity</Label>
                  <Input
                    id={`quantity-${itemId}`}
                    type="number"
                    min="1"
                    max={item.max_returnable}
                    value={config.quantity}
                    onChange={(e) => updateReturnConfig(itemId, { quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`type-${itemId}`}>Return Type</Label>
                  <Select
                    value={config.type}
                    onValueChange={(value: ReturnType) => updateReturnConfig(itemId, { type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inventory">Return to Inventory</SelectItem>
                      <SelectItem value="dispose">Dispose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Refund Amount</Label>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{(config.quantity * item.unit_price * (1 + billGstPercentage / 100)).toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Confirm Return</h3>
      
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">Total Refund Amount</span>
          </div>
          <span className="text-2xl font-bold text-green-600">
            ₹{calculateReturnValue().toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-green-700">
          {returnConfigs.size} items selected for return
        </p>
      </Card>
      
      <div className="space-y-3">
        {Array.from(returnConfigs.entries()).map(([itemId, config]) => {
          const item = items.find(i => i.id === itemId);
          if (!item) return null;
          
          return (
            <Card key={itemId} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.medicine_name}</p>
                  <p className="text-sm text-gray-600">
                    Quantity: {config.quantity} | Type: {config.type}
                  </p>
                </div>
                <p className="font-semibold">
                  ₹{(config.quantity * item.unit_price * (1 + billGstPercentage / 100)).toFixed(2)}
                </p>
              </div>
            </Card>
          );
        })}
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
            Process medicine returns with proper inventory management
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {currentStep === 'select' && renderSelectStep()}
              {currentStep === 'configure' && renderConfigureStep()}
              {currentStep === 'confirm' && renderConfirmStep()}
            </>
          )}
        </div>

        {showPreview && previewData && (
          <ReturnReplacementPreviewDialog
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            data={previewData}
            onConfirm={() => {
              setShowPreview(false);
              setCurrentStep('confirm');
            }}
          />
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {returnConfigs.size > 0 && (
              <Badge variant="secondary">
                {returnConfigs.size} items selected
              </Badge>
            )}
            {returnConfigs.size > 0 && (
              <Badge variant="outline">
                ₹{calculateReturnValue().toFixed(2)} total
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {currentStep !== 'select' && (
              <Button variant="outline" onClick={handleBack} disabled={processing}>
                Back
              </Button>
            )}
            
            {currentStep !== 'confirm' ? (
              <Button 
                onClick={handleNext} 
                disabled={!canProceedToNext() || processing}
              >
                {currentStep === 'select' ? 'Configure Return' : 
                 currentStep === 'configure' ? 'Preview Return' : 
                 currentStep === 'preview' ? 'Confirm Return' : 'Next'}
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={processing || returnConfigs.size === 0}
              >
                {processing ? 'Processing...' : 'Process Return'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMedicineReturnDialog;