
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
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
              className="ml-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogTitle>
          <DialogDescription className="sr-only">Preview and download your {documentName}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4">
          <div ref={previewRef}></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
