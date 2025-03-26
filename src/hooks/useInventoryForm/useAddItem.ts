
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InventoryItemFormData, InventoryItem } from "@/types/inventory";

export function useAddItem(
  formData: InventoryItemFormData,
  resetForm: () => void,
  onSuccess: () => void
) {
  const { toast } = useToast();

  const handleAddItem = async () => {
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
          description: "You must be logged in to add inventory items",
          variant: "destructive",
        });
        return null;
      }

      const unitCost = parseFloat(formData.unitCost);
      const quantity = parseInt(formData.quantity);
      const reorderPoint = parseInt(formData.reorderPoint || "10");

      if (isNaN(unitCost) || isNaN(quantity)) {
        toast({
          title: "Error",
          description: "Please enter valid numbers for Unit Cost and Quantity",
          variant: "destructive",
        });
        return null;
      }

      const insertData = {
        name: formData.name.trim(),
        ndc: formData.ndc.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        dosage_form: formData.dosageForm || null,
        unit_size: formData.unitSize.trim() || null,
        unit_cost: unitCost,
        quantity: quantity,
        expiry_date: formData.expiryDate || null,
        supplier: formData.supplier.trim() || null,
        status: 'in stock',
        generic_name: formData.genericName.trim() || null,
        strength: formData.strength.trim() || null,
        reorder_point: reorderPoint,
        storage_condition: formData.storage || null,
        user_id: user.id // Add the user_id here
      };

      const { data: newItem, error } = await supabase
        .from("inventory")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!newItem) {
        throw new Error("No data returned from insert");
      }

      console.log("Successfully inserted:", newItem);
      
      resetForm();
      onSuccess();
      toast({
        title: "Success",
        description: "Item added successfully",
      });

      return newItem as InventoryItem;

    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
      });
      return null;
    }
  };

  return { handleAddItem };
}
