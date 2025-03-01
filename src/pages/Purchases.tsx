import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Printer } from "lucide-react";
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

export default function Purchases() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const ordersContainerRef = useRef<HTMLDivElement>(null);

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

  const handleEditOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowEditDialog(true);
  };

  const handleDeleteOrder = (orderId: number) => {
    setOrderToDelete(orderId);
    setShowDeleteDialog(true);
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
      
      // Delete order items first
      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .delete()
        .eq("purchase_order_id", orderToDelete);
        
      if (itemsError) throw itemsError;
      
      // Then delete the order
      const { error: orderError } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", orderToDelete)
        .eq("user_id", user.id);
        
      if (orderError) throw orderError;

      // Update local state
      setOrders(prev => prev.filter(order => order.id !== orderToDelete));
      
      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete purchase order",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setOrderToDelete(null);
    }
  };

  const handleUpdateOrder = async (data: any) => {
    if (!selectedOrder) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalAmount = calculateTotalAmount(data.items);
      const orderData = {
        supplier_name: data.supplier_name,
        supplier_phone: data.supplier_phone,
        order_date: data.order_date,
        total_amount: totalAmount
      };

      // Update the order
      const { error: orderError } = await supabase
        .from("purchase_orders")
        .update(orderData)
        .eq("id", selectedOrder.id)
        .eq("user_id", user.id);
        
      if (orderError) throw orderError;

      toast({
        title: "Success",
        description: "Purchase order updated successfully",
      });

      setShowEditDialog(false);
      setSelectedOrder(null);
      loadOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update purchase order",
        variant: "destructive",
      });
    }
  };

  const handleExportOrders = async () => {
    if (!ordersContainerRef.current) return;
    
    try {
      // Create canvas from the content
      const canvas = await html2canvas(ordersContainerRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Add watermark
      pdf.setFontSize(12);
      pdf.setTextColor(180, 180, 180);
      pdf.text('Victure', pdf.internal.pageSize.getWidth() - 20, 10);
      
      // Save PDF
      pdf.save(`purchase-orders-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Export successful",
        description: "Purchase orders exported as PDF",
      });
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast({
        title: "Export failed",
        description: "Failed to export purchase orders",
        variant: "destructive",
      });
    }
  };

  const handlePrintOrders = () => {
    if (!ordersContainerRef.current) return;
    
    const printContent = ordersContainerRef.current;
    const originalDisplay = document.body.style.display;
    const originalOverflow = document.body.style.overflow;
    
    // Create a style element for print
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
          overflow: visible !important;
        }
        #print-content, #print-content * {
          visibility: visible;
        }
        #print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Add ID to print content
    printContent.setAttribute('id', 'print-content');
    
    // Prepare for printing
    document.body.style.overflow = 'visible';
    
    // Print
    window.print();
    
    // Cleanup
    printContent.removeAttribute('id');
    document.body.style.display = originalDisplay;
    document.body.style.overflow = originalOverflow;
    document.head.removeChild(style);
    
    toast({
      title: "Print job sent",
      description: "The purchase orders have been sent to your printer.",
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportOrders}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={handlePrintOrders}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Order
            </Button>
          </div>
        </div>

        <div ref={ordersContainerRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => (
            <PurchaseOrderCard
              key={order.id}
              order={order}
              onUpdateDelivery={handleUpdateDelivery}
              onPreviewBill={handlePreviewBill}
              onDelete={handleDeleteOrder}
              onEdit={handleEditOrder}
            />
          ))}
        </div>

        <AddPurchaseOrderDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={handleCreateOrder}
        />

        {selectedOrder && (
          <AddPurchaseOrderDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSubmit={handleUpdateOrder}
            initialData={selectedOrder}
            isEditing={true}
          />
        )}

        {selectedBill && (
          <BillPreviewDialog
            open={showBillPreview}
            onOpenChange={setShowBillPreview}
            billData={selectedBill}
            items={selectedBill.items}
          />
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this purchase order? This action cannot be undone.
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
      </div>
    </DashboardLayout>
  );
}
