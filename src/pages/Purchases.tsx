import { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddPurchaseOrderDialog } from "@/components/purchases/AddPurchaseOrderDialog";
import { EditDeliveryDialog } from "@/components/purchases/EditDeliveryDialog";
import PurchaseOrderCard from "@/components/purchases/PurchaseOrderCard";
import { PurchaseOrder, PurchaseOrderItem } from "@/types/purchases";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Download, Printer, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { 
  AlertDialog,
  AlertDialogAction, 
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import Skeleton from '@/components/ui/skeleton-loader';

export default function Purchases() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isPurchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<PurchaseOrder | null>(null);

  // Use useCallback to memoize functions used in useEffect dependencies
  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login to view purchase orders",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [toast, navigate]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (error) throw error;

      const ordersWithItems = await Promise.all(
        (data || []).map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from("purchase_order_items")
            .select("*")
            .eq("purchase_order_id", order.id);

          if (itemsError) throw itemsError;

          const orderWithTypedStatus: PurchaseOrder = {
            id: order.id,
            supplier_name: order.supplier_name,
            supplier_phone: order.supplier_phone || "",
            order_date: order.order_date || new Date().toISOString(),
            status: (order.status || 'pending') as PurchaseOrder['status'],
            notes: order.notes || undefined,
            total_amount: order.total_amount || 0,
            delivery_notes: order.delivery_notes || undefined,
            items: items?.map(item => ({
              id: item.id,
              item_name: item.item_name,
              quantity_ordered: item.quantity_ordered,
              quantity_delivered: item.quantity_delivered || 0,
              unit_cost: item.unit_cost,
              total_cost: item.total_cost,
              is_delivered: item.is_delivered || false,
              delivery_notes: item.delivery_notes
            })) || []
          };

          return orderWithTypedStatus;
        })
      );

      setOrders(ordersWithItems);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load purchase orders",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [toast]);

  const filterOrders = useCallback(() => {
    let filtered = orders;
    
    if (activeTab !== "all") {
      filtered = filtered.filter(order => order.status === activeTab);
    }
    
    if (searchQuery !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.supplier_name.toLowerCase().startsWith(query) ||
        (order.notes?.toLowerCase().startsWith(query) || false) ||
        String(order.id).startsWith(query)
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, activeTab, searchQuery]);

  useEffect(() => {
    checkAuth();
    fetchOrders();
  }, [checkAuth, fetchOrders]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const handleCreateOrder = async (formData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const totalAmount = formData.items.reduce(
        (sum: number, item: any) => sum + (item.unit_cost * item.quantity_ordered),
        0
      );

      const { data: purchaseOrder, error: orderError } = await supabase
        .from("purchase_orders")
        .insert([
          {
            supplier_name: formData.supplier_name,
            supplier_phone: formData.supplier_phone,
            order_date: formData.order_date,
            total_amount: totalAmount,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const itemsToInsert = formData.items.map((item: any) => ({
        purchase_order_id: purchaseOrder.id,
        item_name: item.item_name,
        quantity_ordered: item.quantity_ordered,
        unit_cost: item.unit_cost,
        total_cost: item.unit_cost * item.quantity_ordered,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      fetchOrders();
      
      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });
      
      setPurchaseDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDelivery = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrderItems(order.items);
      setSelectedOrderId(orderId);
      setDeliveryDialogOpen(true);
    }
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setSelectedOrderForEdit(order);
    setEditDialogOpen(true);
  };

  const handleDeleteOrder = (orderId: number) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to delete orders",
          variant: "destructive",
        });
        return;
      }
      
      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .delete()
        .eq("purchase_order_id", orderToDelete);

      if (itemsError) throw itemsError;

      const { error: orderError } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", orderToDelete)
        .eq("user_id", user.id);

      if (orderError) throw orderError;

      setOrders(prev => prev.filter(order => order.id !== orderToDelete));
      
      toast({
        title: "Order deleted",
        description: "Purchase order has been removed successfully."
      });
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete purchase order",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleUpdateDeliverySubmit = async (itemUpdates: any, deliveryNotes?: string) => {
    try {
      for (const item of itemUpdates) {
        const { error } = await supabase
          .from("purchase_order_items")
          .update({
            quantity_delivered: item.quantityDelivered,
            is_delivered: item.quantityDelivered >= item.quantityOrdered,
            delivery_notes: item.notes,
          })
          .eq("id", item.id);

        if (error) throw error;
      }

      if (selectedOrderId && deliveryNotes !== undefined) {
        const { error } = await supabase
          .from("purchase_orders")
          .update({ 
            delivery_notes: deliveryNotes 
          })
          .eq("id", selectedOrderId);
          
        if (error) throw error;
      }

      const orderToUpdate = orders.find(o => o.id === selectedOrderId);
      if (!orderToUpdate) return;
      
      const updatedItems = orderToUpdate.items.map(item => {
        const updatedItem = itemUpdates.find((update: any) => update.id === item.id);
        return {
          ...item,
          quantity_delivered: updatedItem ? updatedItem.quantityDelivered : item.quantity_delivered,
          is_delivered: updatedItem 
            ? updatedItem.quantityDelivered >= item.quantity_ordered
            : item.is_delivered,
        };
      });

      const allItemsDelivered = updatedItems.every(item => item.is_delivered);
      
      if (allItemsDelivered && orderToUpdate.status === 'pending') {
        const { error } = await supabase
          .from("purchase_orders")
          .update({ status: "partially_delivered" })
          .eq("id", selectedOrderId);

        if (error) throw error;
      }

      fetchOrders();
      
      toast({
        title: "Success",
        description: "Delivery information updated successfully",
      });
    } catch (error) {
      console.error("Error updating delivery:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery information",
        variant: "destructive",
      });
    } finally {
      setDeliveryDialogOpen(false);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: "completed" })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId
            ? { ...order, status: "completed" }
            : order
        )
      );
      
      toast({
        title: "Order Completed",
        description: "Purchase order has been marked as completed",
      });
    } catch (error) {
      console.error("Error completing order:", error);
      toast({
        title: "Error",
        description: "Failed to complete purchase order",
        variant: "destructive",
      });
    }
  };

  const handlePrintOrder = (order: PurchaseOrder) => {
    try {
      const pdf = new jsPDF();
    
      pdf.setFontSize(20);
      pdf.text("Purchase Order", 105, 15, { align: "center" });
      
      pdf.setFontSize(12);
      pdf.text(`PO-${order.id}`, 20, 25);
      pdf.text(`Date: ${format(new Date(order.order_date), "dd/MM/yyyy")}`, 20, 32);
      
      pdf.setFontSize(14);
      pdf.text("Supplier Details", 20, 42);
      pdf.setFontSize(12);
      pdf.text(`Name: ${order.supplier_name}`, 20, 49);
      if (order.supplier_phone) {
        pdf.text(`Phone: ${order.supplier_phone}`, 20, 56);
      }
      
      pdf.setFontSize(14);
      pdf.text("Order Items", 20, 70);
      
      pdf.setFontSize(12);
      pdf.text("Item", 20, 78);
      pdf.text("Qty", 120, 78);
      pdf.text("Unit Cost", 140, 78);
      pdf.text("Total", 170, 78);
      
      pdf.line(20, 80, 190, 80);
      
      let y = 88;
      order.items.forEach(item => {
        pdf.text(item.item_name, 20, y);
        pdf.text(item.quantity_ordered.toString(), 120, y);
        pdf.text(`₹${item.unit_cost.toFixed(2)}`, 140, y);
        pdf.text(`₹${item.total_cost.toFixed(2)}`, 170, y);
        y += 8;
      });
      
      pdf.line(20, y, 190, y);
      y += 8;
      
      pdf.text("Total:", 140, y);
      pdf.text(`₹${order.total_amount.toFixed(2)}`, 170, y);
      
      if (order.notes) {
        y += 16;
        pdf.setFontSize(14);
        pdf.text("Notes:", 20, y);
        y += 8;
        pdf.setFontSize(12);
        pdf.text(order.notes, 20, y);
      }
      
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pdf.internal.pageSize.width / 2,
          pdf.internal.pageSize.height - 10,
          { align: "center" }
        );
      }
      
      pdf.save(`purchase-order-${order.id}.pdf`);
      
      toast({
        title: "Success",
        description: "Purchase order has been printed to PDF",
      });
    } catch (error) {
      console.error("Error printing order:", error);
      toast({
        title: "Error",
        description: "Failed to print purchase order",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    try {
      const pdf = new jsPDF("landscape");
    
      pdf.setFontSize(20);
      pdf.text("Purchase Orders Report", 150, 15, { align: "center" });
      
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${format(new Date(), "dd/MM/yyyy")}`, 20, 25);
      
      pdf.setFontSize(12);
      pdf.text("ID", 20, 35);
      pdf.text("Supplier", 40, 35);
      pdf.text("Date", 100, 35);
      pdf.text("Status", 140, 35);
      pdf.text("Total Amount", 180, 35);
      pdf.text("Items", 230, 35);
      
      pdf.line(20, 37, 280, 37);
      
      let y = 45;
      filteredOrders.forEach((order, index) => {
        if (y > 180) {
          pdf.addPage();
          y = 35;
          
          pdf.text("ID", 20, 25);
          pdf.text("Supplier", 40, 25);
          pdf.text("Date", 100, 25);
          pdf.text("Status", 140, 25);
          pdf.text("Total Amount", 180, 25);
          pdf.text("Items", 230, 25);
          
          pdf.line(20, 27, 280, 27);
          y = 35;
        }
        
        pdf.text(`PO-${order.id}`, 20, y);
        pdf.text(order.supplier_name, 40, y);
        pdf.text(format(new Date(order.order_date), "dd/MM/yyyy"), 100, y);
        pdf.text(order.status.charAt(0).toUpperCase() + order.status.slice(1), 140, y);
        pdf.text(`₹${order.total_amount.toFixed(2)}`, 180, y);
        
        const itemText = order.items
          .slice(0, 2)
          .map(item => `${item.item_name} (${item.quantity_ordered})`)
          .join(", ");
        const displayText = order.items.length > 2 
          ? `${itemText}, ...` 
          : itemText;
        
        pdf.text(displayText, 230, y);
        
        y += 10;
        
        if (index < filteredOrders.length - 1) {
          pdf.setDrawColor(200, 200, 200);
          pdf.line(20, y - 5, 280, y - 5);
          pdf.setDrawColor(0, 0, 0);
        }
      });
      
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pdf.internal.pageSize.width / 2,
          pdf.internal.pageSize.height - 10,
          { align: "center" }
        );
      }
      
      pdf.save("purchase-orders-report.pdf");
      
      toast({
        title: "Success",
        description: "Purchase orders have been exported to PDF",
      });
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast({
        title: "Error",
        description: "Failed to export purchase orders",
        variant: "destructive",
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-6">
          <Skeleton variant="dashboard" />
        </div>
    );
  }

 return (
    <>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-1">Manage and track your purchase orders</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setPurchaseDialogOpen(true)}
            >
              <Plus className="h-4 w-4" /> Add Order
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by supplier name or notes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={handleTabChange}
            className="flex-shrink-0"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content Card */}
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No purchase orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <PurchaseOrderCard
                key={order.id}
                order={order}
                onUpdateDelivery={handleUpdateDelivery}
                onEditOrder={handleEditOrder}
                onDeleteOrder={handleDeleteOrder}
                onPrintOrder={handlePrintOrder}
                onCompleteOrder={handleCompleteOrder}
              />
            ))
          )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddPurchaseOrderDialog
        open={isPurchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        onSubmit={handleCreateOrder}
      />

      <EditDeliveryDialog
        open={isDeliveryDialogOpen}
        onOpenChange={setDeliveryDialogOpen}
        orderItems={selectedOrderItems}
        onSubmit={handleUpdateDeliverySubmit}
        onComplete={handleCompleteOrder}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the purchase order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOrder} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}