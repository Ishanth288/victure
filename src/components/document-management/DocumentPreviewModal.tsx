
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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
  if (!reportData || reportData.length === 0) {
    return null;
  }

  const handleDownload = () => {
    try {
      onDownload();
      toast({
        title: "Download started",
        description: `Your ${documentName} is being downloaded.`,
        duration: 3000
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Download failed",
        description: "There was a problem downloading your document.",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{documentName} Preview</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
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
