
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Clock, PackageOpen, Trash2, AlertCircle, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReturnHistoryItem } from "@/types/returns";

interface ReturnItem {
  id: number;
  medicine_name: string;
  returned_quantity: number;
  original_quantity: number;
  return_date: string;
  status: 'inventory' | 'disposed';
  return_value: number;
  reason: string;
}

interface ReturnHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prescriptionId: number | null;
}

export function ReturnHistoryDialog({
  isOpen,
  onClose,
  prescriptionId,
}: ReturnHistoryDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [totalRefundValue, setTotalRefundValue] = useState(0);
  
  useEffect(() => {
    if (isOpen && prescriptionId) {
      fetchReturnHistory();
    } else {
      setReturnItems([]);
      setTotalRefundValue(0);
    }
  }, [isOpen, prescriptionId]);

  const fetchReturnHistory = async () => {
    if (!prescriptionId) return;
    
    setLoading(true);
    try {
      // First, find all the bills associated with this prescription
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('id')
        .eq('prescription_id', prescriptionId);
        
      if (billError) throw billError;
      
      if (!billData || billData.length === 0) {
        setReturnItems([]);
        setLoading(false);
        return;
      }
      
      // Extract the bill IDs
      const billIds = billData.map(bill => bill.id);
      
      // Now query the return_analytics view filtering by these bill IDs
      const { data, error } = await supabase
        .from('return_analytics')
        .select(`
          id,
          bill_id,
          medicine_name,
          returned_quantity,
          original_quantity,
          return_date,
          status,
          return_value,
          reason
        `)
        .in('bill_id', billIds)
        .order('return_date', { ascending: false });

      if (error) throw error;
      
      // Type assertion to avoid TypeScript errors
      const safeData = data || [];
      setReturnItems(safeData as ReturnItem[]);
      
      // Calculate total refund value
      const total = safeData.reduce((acc, item) => acc + (item.return_value || 0), 0);
      setTotalRefundValue(total);
      
      // Show success message when data is loaded
      if (safeData.length > 0) {
        toast({
          title: "Return History Loaded",
          description: `Found ${safeData.length} return records for this prescription.`,
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error("Error fetching return history:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load return history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Return History</DialogTitle>
          <DialogDescription>
            History of all medicine returns for this prescription
          </DialogDescription>
        </DialogHeader>

        {totalRefundValue > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center text-green-700">
              <DollarSign className="h-5 w-5 mr-2" />
              <span className="font-medium">Total Refund Value: ₹{totalRefundValue.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : returnItems.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center text-gray-500">
              <AlertCircle className="h-12 w-12 mb-3 text-gray-400" />
              <div className="font-medium">No return history found</div>
              <p className="text-sm">No returns have been processed for this prescription yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {returnItems.map((item) => (
                <div key={item.id} className="p-4 border rounded-md relative">
                  {/* Watermark for returned items */}
                  <div className="absolute -rotate-12 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10 text-4xl font-bold text-red-500">
                    {item.status === 'disposed' ? 'DISPOSED' : 'RETURNED'}
                  </div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <div className="font-medium">{item.medicine_name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {item.returned_quantity} of {item.original_quantity} units returned
                      </div>
                      {item.reason && (
                        <div className="text-sm text-gray-600 mt-1">
                          Reason: {item.reason}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={item.status === 'inventory' ? 'secondary' : 'destructive'}
                      className="flex items-center"
                    >
                      {item.status === 'inventory' ? (
                        <>
                          <PackageOpen className="w-3 h-3 mr-1" />
                          Returned to Stock
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Disposed
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between relative z-10">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {format(new Date(item.return_date), "MMM d, yyyy - h:mm a")}
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      Refund Value: ₹{item.return_value.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
