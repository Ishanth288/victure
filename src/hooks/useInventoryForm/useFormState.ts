
import { useState, useCallback } from "react";
import { type InventoryItemFormData } from "@/types/inventory";

const initialFormData: InventoryItemFormData = {
  name: "",
  genericName: "",
  ndc: "",
  manufacturer: "",
  dosageForm: "",
  strength: "",
  unitSize: "",
  unitCost: "",
  quantity: "",
  reorderPoint: "10",
  expiryDate: "",
  supplier: "",
  storage: "",
};

export function useFormState() {
  const [formData, setFormData] = useState<InventoryItemFormData>(initialFormData);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  return {
    formData,
    setFormData,
    handleInputChange,
    handleSelectChange,
    resetForm
  };
}
