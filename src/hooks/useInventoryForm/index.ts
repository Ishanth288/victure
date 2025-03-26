
import { useFormState } from "./useFormState";
import { useAddItem } from "./useAddItem";
import { useEditItem } from "./useEditItem";

export function useInventoryForm(onSuccess: () => void) {
  const { formData, setFormData, handleInputChange, handleSelectChange, resetForm } = useFormState();
  const { handleAddItem } = useAddItem(formData, resetForm, onSuccess);
  const { handleEditItem } = useEditItem(formData, resetForm, onSuccess);

  return {
    formData,
    setFormData,
    handleInputChange,
    handleSelectChange,
    handleAddItem,
    handleEditItem,
    resetForm,
  };
}
