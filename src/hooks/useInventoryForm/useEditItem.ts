
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InventoryItemFormData, InventoryItem } from "@/types/inventory";

export function useEditItem(
  formData: InventoryItemFormData,
  resetForm: () => void,
  onSuccess: () => void
) {
  const { toast } = useToast();

  const handleEditItem = async (itemId: number) => {
    try {
      if (!formData.name || !formData.unitCost || !formData.quantity) {
        toast({
          title: "Error",
          description: "Please fill in all required fields: Name, Unit Cost, and Quantity",
          variant: "destructive",
        });
        return null;
      }

      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to edit inventory items",
          variant: "destructive",
        });
        return null;
      }

      const updateData = {
        name: formData.name.trim(),
        ndc: formData.ndc.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        dosage_form: formData.dosageForm || null,
        unit_size: formData.unitSize.trim() || null,
        unit_cost: parseFloat(formData.unitCost),
        quantity: parseInt(formData.quantity),
        expiry_date: formData.expiryDate || null,
        supplier: formData.supplier.trim() || null,
        generic_name: formData.genericName.trim() || null,
        strength: formData.strength.trim() || null,
        reorder_point: parseInt(formData.reorderPoint || "10"),
        storage_condition: formData.storage || null,
        user_id: user.id
      };

      const { data: updatedItem, error } = await supabase
        .from("inventory")
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      if (!updatedItem) {
        throw new Error("No data returned from update");
      }

      resetForm();
      onSuccess();
      toast({
        title: "Success",
        description: "Item updated successfully",
      });

      return updatedItem as InventoryItem;

    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item",
        variant: "destructive",
      });
      return null;
    }
  };

  return { handleEditItem };
}
