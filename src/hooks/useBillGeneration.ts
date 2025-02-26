
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/types/billing";

export function useBillGeneration() {
  const { toast } = useToast();
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<any>(null);

  const generateBill = async (
    items: CartItem[],
    prescriptionId: number,
    subtotal: number,
    gstAmount: number,
    gstPercentage: number,
    discountAmount: number,
    total: number,
    onSuccess: () => void
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to generate bills",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the cart",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const { data: billData, error: billError } = await supabase
        .from("bills")
        .insert([
          {
            prescription_id: prescriptionId,
            bill_number: `BILL-${Date.now()}`,
            subtotal: Math.round(subtotal),
            gst_amount: Math.round(gstAmount),
            gst_percentage: gstPercentage,
            discount_amount: Math.round(discountAmount),
            total_amount: Math.round(total),
            status: "completed",
            user_id: session.user.id
          },
        ])
        .select(`
          *,
          prescription:prescriptions (
            *,
            patient:patients (
              name,
              phone_number
            )
          )
        `)
        .single();

      if (billError) throw new Error(billError.message);

      const billItems = items.map((item) => ({
        bill_id: billData.id,
        inventory_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_cost,
        total_price: item.total,
      }));

      const { error: billItemsError } = await supabase
        .from("bill_items")
        .insert(billItems);

      if (billItemsError) throw new Error(billItemsError.message);

      for (const item of items) {
        const { data: inventoryData, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("id", item.id)
          .single();

        if (fetchError) throw new Error(fetchError.message);

        const newQuantity = (inventoryData?.quantity || 0) - item.quantity;
        const { error: inventoryError } = await supabase
          .from("inventory")
          .update({ quantity: newQuantity })
          .eq("id", item.id);

        if (inventoryError) throw new Error(inventoryError.message);
      }

      setGeneratedBill({ ...billData, pharmacy_address: profileData });
      setShowBillPreview(true);
      onSuccess();

      toast({
        title: "Success",
        description: "Bill generated successfully",
      });
    } catch (error) {
      console.error("Error generating bill:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate bill",
        variant: "destructive",
      });
    }
  };

  return {
    showBillPreview,
    setShowBillPreview,
    generatedBill,
    generateBill,
  };
}
