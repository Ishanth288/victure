
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrintableBill } from "./PrintableBill";
import { CartItem } from "@/types/billing";

interface BillPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billData: any;
  items: CartItem[];
}

export function BillPreviewDialog({
  open,
  onOpenChange,
  billData,
  items,
}: BillPreviewDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bill Preview</span>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Bill
            </Button>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-auto">
          {billData && <PrintableBill billData={billData} items={items} />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
