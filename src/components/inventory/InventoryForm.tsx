
import { useState } from "react";
import { toast } from "sonner";
import FormField from "./form/FormField";
import SelectField from "./form/SelectField";
import FormActions from "./form/FormActions";

export interface InventoryItemFormData {
  name: string;
  genericName: string;
  ndc: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  unitSize: string;
  unitCost: string;
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

  const dosageFormOptions = [
    { value: "tablet", label: "Tablet" },
    { value: "capsule", label: "Capsule" },
    { value: "syrup", label: "Syrup" },
    { value: "injection", label: "Injection" },
    { value: "ointment", label: "Ointment" },
  ];

  const storageOptions = [
    { value: "room", label: "Room Temperature" },
    { value: "refrigerated", label: "Refrigerated" },
    { value: "frozen", label: "Frozen" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          id="name"
          label="Medicine Name"
          value={formData.name}
          onChange={onInputChange}
          placeholder="Enter medicine name"
          required={true}
        />

        <FormField
          id="genericName"
          label="Generic Name (Optional)"
          value={formData.genericName}
          onChange={onInputChange}
          placeholder="Enter generic name"
        />

        <FormField
          id="ndc"
          label="NDC (Optional)"
          value={formData.ndc}
          onChange={onInputChange}
          placeholder="Enter NDC"
        />

        <FormField
          id="manufacturer"
          label="Manufacturer (Optional)"
          value={formData.manufacturer}
          onChange={onInputChange}
          placeholder="Enter manufacturer"
        />

        <SelectField
          id="dosageForm"
          label="Dosage Form (Optional)"
          value={formData.dosageForm}
          options={dosageFormOptions}
          onChange={(value) => onSelectChange("dosageForm", value)}
          placeholder="Select dosage form"
        />

        <FormField
          id="strength"
          label="Strength/Concentration (Optional)"
          value={formData.strength}
          onChange={onInputChange}
          placeholder="e.g., 500mg"
        />

        <FormField
          id="unitCost"
          label="Unit Cost (₹)"
          value={formData.unitCost}
          onChange={onInputChange}
          placeholder="Enter unit cost"
          type="number"
          required={true}
        />

        <FormField
          id="quantity"
          label="Quantity"
          value={formData.quantity}
          onChange={onInputChange}
          placeholder="Enter quantity"
          type="number"
          required={true}
        />

        <FormField
          id="reorderPoint"
          label="Reorder Point (Optional)"
          value={formData.reorderPoint}
          onChange={onInputChange}
          placeholder="Enter reorder point"
          type="number"
        />

        <FormField
          id="expiryDate"
          label="Expiry Date (Optional)"
          value={formData.expiryDate}
          onChange={onInputChange}
          type="date"
        />

        <SelectField
          id="storage"
          label="Storage Conditions (Optional)"
          value={formData.storage}
          options={storageOptions}
          onChange={(value) => onSelectChange("storage", value)}
          placeholder="Select storage condition"
        />
      </div>

      <FormActions
        onCancel={onCancel}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isEdit={isEdit}
      />

      <div className="text-sm text-gray-500">
        Fields marked with <span className="text-red-500">*</span> are required.
      </div>
    </div>
  );
}
