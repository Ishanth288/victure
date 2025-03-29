
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentType } from "./types";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  documentType: DocumentType;
  reportData: any[];
  onDownload: () => void;
  previewRef: React.RefObject<HTMLDivElement>;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  documentName,
  documentType,
  reportData,
  onDownload,
  previewRef
}: DocumentPreviewModalProps) {
  if (!reportData || reportData.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{documentName} Preview</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDownload}
              className="ml-auto mr-2"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-auto">
          <div ref={previewRef} className="p-4">
            {/* Report content will be populated programmatically */}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
