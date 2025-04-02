
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
import { Clock, PackageOpen, Trash2, AlertCircle } from "lucide-react";
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
  
  useEffect(() => {
    if (isOpen && prescriptionId) {
      fetchReturnHistory();
    } else {
      setReturnItems([]);
    }
  }, [isOpen, prescriptionId]);

  const fetchReturnHistory = async () => {
    if (!prescriptionId) return;
    
    setLoading(true);
    try {
      // Using direct query with type assertion to avoid TypeScript errors
      const { data, error } = await (supabase as any)
        .from('return_analytics')
        .select(`
          id,
          medicine_name,
          returned_quantity,
          original_quantity,
          return_date,
          status,
          return_value,
          reason
        `)
        .eq('prescription_id', prescriptionId)
        .order('return_date', { ascending: false });

      if (error) throw error;
      
      // Type assertion to avoid TypeScript errors
      const safeData = data || [];
      setReturnItems(safeData as ReturnItem[]);
      
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
                    <div className="text-sm font-medium">
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
