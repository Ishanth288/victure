
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Clock, PackageOpen, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      // Using the return_analytics view we created
      const { data, error } = await supabase
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
      
      setReturnItems(data || []);
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
            <div className="py-4 text-center text-gray-500">
              No return history found for this prescription
            </div>
          ) : (
            <div className="space-y-4">
              {returnItems.map((item) => (
                <div key={item.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start">
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
                  <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between">
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
