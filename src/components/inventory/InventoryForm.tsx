
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface InventoryItemFormData {
  name: string;
  genericName: string;
  ndc: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  unitSize: string;
  unitCost: string;
  sellingPrice: string;
  quantity: string;
  reorderPoint: string;
  expiryDate: string;
  supplier: string;
  storage: string;
}

interface InventoryFormProps {
  formData: InventoryItemFormData;
  isEdit?: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
}

export default function InventoryForm({
  formData,
  isEdit = false,
  onInputChange,
  onSelectChange,
  onCancel,
  onSubmit
}: InventoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculateProfit, setCalculateProfit] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit();
      toast.success(isEdit ? "Item updated successfully!" : "Item added successfully!");
    } catch (error) {
      toast.error("Failed to save item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate profit margin
  const calculateProfitMargin = () => {
    const costPrice = parseFloat(formData.unitCost) || 0;
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    
    if (costPrice === 0 || sellingPrice === 0) return "N/A";
    
    const profit = sellingPrice - costPrice;
    const margin = (profit / sellingPrice) * 100;
    
    return margin.toFixed(2) + "%";
  };

  // Auto-calculate selling price based on a markup percentage
  const handleCalculateSellingPrice = () => {
    const costPrice = parseFloat(formData.unitCost) || 0;
    if (costPrice === 0) return;
    
    // Default to 40% markup
    const recommendedPrice = (costPrice * 1.4).toFixed(2);
    
    // Create a synthetic event to trigger the input change
    const syntheticEvent = {
      target: {
        name: "sellingPrice",
        value: recommendedPrice
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(syntheticEvent);
    setCalculateProfit(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Medicine Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            placeholder="Enter medicine name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="genericName">Generic Name</Label>
          <Input
            id="genericName"
            name="genericName"
            value={formData.genericName}
            onChange={onInputChange}
            placeholder="Enter generic name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ndc">NDC</Label>
          <Input
            id="ndc"
            name="ndc"
            value={formData.ndc}
            onChange={onInputChange}
            placeholder="Enter NDC"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input
            id="manufacturer"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={onInputChange}
            placeholder="Enter manufacturer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dosageForm">Dosage Form</Label>
          <Select
            value={formData.dosageForm}
            onValueChange={(value) => onSelectChange("dosageForm", value)}
          >
            <SelectTrigger className="bg-white border border-gray-300 shadow-sm">
              <SelectValue placeholder="Select dosage form" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 shadow-lg z-50">
              <SelectItem value="tablet">Tablet</SelectItem>
              <SelectItem value="capsule">Capsule</SelectItem>
              <SelectItem value="syrup">Syrup</SelectItem>
              <SelectItem value="injection">Injection</SelectItem>
              <SelectItem value="ointment">Ointment</SelectItem>
              <SelectItem value="spray">Spray</SelectItem>
              <SelectItem value="drops">Drops</SelectItem>
              <SelectItem value="sachet">Sachet</SelectItem>
              <SelectItem value="respule">Respule</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="strength">Strength/Concentration</Label>
          <Input
            id="strength"
            name="strength"
            value={formData.strength}
            onChange={onInputChange}
            placeholder="e.g., 500mg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitCost">Cost Price (CP) (₹)</Label>
          <Input
            id="unitCost"
            name="unitCost"
            type="number"
            value={formData.unitCost}
            onChange={(e) => {
              onInputChange(e);
              setCalculateProfit(true);
            }}
            placeholder="Enter cost price"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sellingPrice">
            Selling Price (SP) (₹)
            <Button 
              variant="link" 
              className="ml-2 text-xs text-blue-500 p-0 h-auto"
              type="button"
              onClick={handleCalculateSellingPrice}
            >
              Auto-calculate
            </Button>
          </Label>
          <Input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            value={formData.sellingPrice}
            onChange={(e) => {
              onInputChange(e);
              setCalculateProfit(true);
            }}
            placeholder="Enter selling price"
          />
          {calculateProfit && formData.unitCost && formData.sellingPrice && (
            <p className="text-xs text-muted-foreground mt-1">
              Profit Margin: {calculateProfitMargin()}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={onInputChange}
            placeholder="Enter quantity"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reorderPoint">Reorder Point</Label>
          <Input
            id="reorderPoint"
            name="reorderPoint"
            type="number"
            value={formData.reorderPoint}
            onChange={onInputChange}
            placeholder="Enter reorder point"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            name="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={onInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="storage">Storage Conditions</Label>
          <Select
            value={formData.storage}
            onValueChange={(value) => onSelectChange("storage", value)}
          >
            <SelectTrigger className="bg-white border border-gray-300 shadow-sm">
              <SelectValue placeholder="Select storage condition" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 shadow-lg z-50">
              <SelectItem value="room">Room Temperature</SelectItem>
              <SelectItem value="refrigerated">Refrigerated</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? "Saving..." : "Adding..."}
            </>
          ) : (
            isEdit ? "Save Changes" : "Add Item"
          )}
        </Button>
      </div>
    </div>
  );
}
