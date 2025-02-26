
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AddPurchaseOrderDialog } from "@/components/purchases/AddPurchaseOrderDialog";
import { PurchaseOrderCard } from "@/components/purchases/PurchaseOrderCard";
import { BillPreviewDialog } from "@/components/billing/BillPreviewDialog";
import type { PurchaseOrder } from "@/types/purchases";
import type { Database } from "@/integrations/supabase/types";

export default function Purchases() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchOrders();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login to view purchases",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, items:purchase_order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedOrders: PurchaseOrder[] = data.map((order: any) => ({
          id: order.id,
          supplier_name: order.supplier_name,
          supplier_phone: order.supplier_phone,
          order_date: order.order_date,
          status: order.status,
          notes: order.notes,
          total_amount: order.total_amount,
          items: order.items || [],
        }));
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load purchase orders",
        variant: "destructive",
      });
    }
  };

  const handleCreateOrder = async (data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalAmount = data.items.reduce(
        (sum: number, item: any) => sum + item.quantity_ordered * item.unit_cost,
        0
      );

      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          user_id: user.id,
          supplier_name: data.supplier_name,
          supplier_phone: data.supplier_phone,
          order_date: data.order_date,
          total_amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const items = data.items.map((item: any) => ({
        purchase_order_id: order.id,
        item_name: item.item_name,
        quantity_ordered: item.quantity_ordered,
        quantity_delivered: 0,
        unit_cost: item.unit_cost,
        total_cost: item.quantity_ordered * item.unit_cost,
        is_delivered: false
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(items);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });

      setShowAddDialog(false);
      fetchOrders();
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDelivery = async (
    orderId: number,
    items: PurchaseOrder["items"],
    notes: string
  ) => {
    try {
      const { error: orderError } = await supabase
        .from('purchase_orders')
        .update({ 
          notes,
          status: items.every(item => item.is_delivered) ? 'delivered' : 'partially_delivered'
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      for (const item of items) {
        const { error: itemError } = await supabase
          .from('purchase_order_items')
          .update({
            quantity_delivered: item.quantity_delivered,
            is_delivered: item.is_delivered,
          })
          .eq('id', item.id);

        if (itemError) throw itemError;
      }

      toast({
        title: "Success",
        description: "Delivery details updated successfully",
      });

      fetchOrders();
    } catch (error) {
      console.error("Error updating delivery:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery details",
        variant: "destructive",
      });
    }
  };

  const handlePreviewBill = (order: PurchaseOrder) => {
    const billData = {
      bill_number: `PO-${order.id}`,
      date: order.order_date,
      total_amount: order.total_amount,
      prescription: {
        doctor_name: order.supplier_name,
        patient: {
          name: order.supplier_name,
          phone_number: order.supplier_phone,
        },
      },
    };

    const items = order.items.map((item) => ({
      id: item.id!,
      name: item.item_name,
      quantity: item.quantity_delivered,
      unit_cost: item.unit_cost,
      total: item.quantity_delivered * item.unit_cost,
    }));

    setSelectedBill({ ...billData, items });
    setShowBillPreview(true);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Order
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => (
            <PurchaseOrderCard
              key={order.id}
              order={order}
              onUpdateDelivery={handleUpdateDelivery}
              onPreviewBill={handlePreviewBill}
            />
          ))}
        </div>

        <AddPurchaseOrderDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={handleCreateOrder}
        />

        {selectedBill && (
          <BillPreviewDialog
            open={showBillPreview}
            onOpenChange={setShowBillPreview}
            billData={selectedBill}
            items={selectedBill.items}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
