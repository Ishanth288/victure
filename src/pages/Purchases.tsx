
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
import { fetchPurchaseOrders, createPurchaseOrder, createOrderItems, updatePurchaseOrderDelivery } from "@/services/purchaseOrderService";
import { calculateTotalAmount } from "@/utils/purchaseOrderUtils";
import type { PurchaseOrder } from "@/types/purchases";

export default function Purchases() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);

  useEffect(() => {
    checkAuth();
    loadOrders();
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

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const orders = await fetchPurchaseOrders(user.id);
      setOrders(orders);
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

      const totalAmount = calculateTotalAmount(data.items);
      const orderData = {
        supplier_name: data.supplier_name,
        supplier_phone: data.supplier_phone,
        order_date: data.order_date,
        total_amount: totalAmount,
        status: 'pending'
      };

      const order = await createPurchaseOrder(user.id, orderData);

      const items = data.items.map((item: any) => ({
        purchase_order_id: order.id,
        item_name: item.item_name,
        quantity_ordered: item.quantity_ordered,
        quantity_delivered: 0,
        unit_cost: item.unit_cost,
        total_cost: item.quantity_ordered * item.unit_cost,
        is_delivered: false
      }));

      await createOrderItems(items);

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });

      setShowAddDialog(false);
      loadOrders();
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
      await updatePurchaseOrderDelivery(orderId, items, notes);
      toast({
        title: "Success",
        description: "Delivery details updated successfully",
      });
      loadOrders();
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
