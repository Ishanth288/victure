
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateSystemReport, downloadPDF, generatePDFFromElement } from "@/utils/documentUtils";
import { format } from 'date-fns';
import { DocumentList } from "./DocumentList";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { initialDocuments } from "./documentData";
import { useDataFetching } from "./useDataFetching";
import { useDocumentUpdates } from "./useDocumentUpdates";
import { DocumentType } from "./types";
import { 
  createInventoryReport, 
  createSalesReport, 
  createPurchaseOrdersReport, 
  createPatientsReport 
} from "./ReportRenderers";

export function DocumentManagement() {
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentDocType, setCurrentDocType] = useState<DocumentType | null>(null);
  const [currentDocName, setCurrentDocName] = useState<string>("");
  const [reportData, setReportData] = useState<any[]>([]);
  
  // Get initial data
  const { documents: initialFetchedDocs, currentUserId } = useDataFetching(initialDocuments);
  
  // Setup real-time updates
  const { 
    documents, 
    setDocumentLoading 
  } = useDocumentUpdates(currentUserId, initialFetchedDocs);

  const handlePreview = async (docType: DocumentType, docName: string) => {
    try {
      // Set loading state
      setDocumentLoading(docType, true);
      
      // Generate report data
      const data = await generateSystemReport(docType);
      
      if (!data || data.length === 0) {
        toast({
          title: "No data available",
          description: `There is no data available for ${docName} yet.`,
          variant: "destructive"
        });
        
        setDocumentLoading(docType, false);
        return;
      }
      
      // Store data for preview
      setReportData(data);
      setCurrentDocType(docType);
      setCurrentDocName(docName);
      
      // Open preview modal
      setPreviewOpen(true);
      
      // Reset loading state
      setDocumentLoading(docType, false);
      
      // After the modal is open, render the report
      setTimeout(() => {
        renderReportPreview(docType, data);
      }, 100);
      
    } catch (error) {
      console.error(`Error previewing ${docName}:`, error);
      toast({
        title: "Error generating preview",
        description: "An error occurred while generating the preview.",
        variant: "destructive"
      });
      setDocumentLoading(docType, false);
    }
  };

  const renderReportPreview = (docType: DocumentType, data: any[]) => {
    if (!reportContainerRef.current) return;
    
    // Clear previous content
    reportContainerRef.current.innerHTML = '';
    
    // Style the report
    const reportDiv = document.createElement('div');
    reportDiv.style.padding = '20px';
    reportDiv.style.fontFamily = 'Arial, sans-serif';
    
    const doc = documents.find(d => d.id === docType);
    
    // Create report header
    const header = document.createElement('h1');
    header.textContent = currentDocName;
    header.style.fontSize = '24px';
    header.style.marginBottom = '10px';
    reportDiv.appendChild(header);
    
    const description = document.createElement('p');
    description.textContent = doc?.description || '';
    description.style.fontSize = '14px';
    description.style.marginBottom = '20px';
    description.style.color = '#666';
    reportDiv.appendChild(description);
    
    // Create report content based on document type
    switch (docType) {
      case 'inventory':
        createInventoryReport(reportDiv, data);
        break;
      case 'sales':
        createSalesReport(reportDiv, data);
        break;
      case 'purchase_orders':
        createPurchaseOrdersReport(reportDiv, data);
        break;
      case 'patients':
        createPatientsReport(reportDiv, data);
        break;
    }
    
    // Append to the container
    reportContainerRef.current.appendChild(reportDiv);
  };

  const handleDownload = async (docType: DocumentType, docName: string) => {
    try {
      // Set loading state
      setDocumentLoading(docType, true);
      toast({
        title: "Generating report",
        description: `Preparing ${docName} for download...`,
      });
      
      // Generate report data
      const reportData = await generateSystemReport(docType);
      
      if (!reportData || reportData.length === 0) {
        toast({
          title: "No data available",
          description: `There is no data available for ${docName} yet.`,
          variant: "destructive"
        });
        
        setDocumentLoading(docType, false);
        return;
      }
      
      // Create temporary container for the report
      const tempContainer = document.createElement('div');
      tempContainer.style.padding = '20px';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      
      const doc = documents.find(d => d.id === docType);
      
      // Create report header
      const header = document.createElement('h1');
      header.textContent = docName;
      header.style.fontSize = '24px';
      header.style.marginBottom = '10px';
      tempContainer.appendChild(header);
      
      const description = document.createElement('p');
      description.textContent = doc?.description || '';
      description.style.fontSize = '14px';
      description.style.marginBottom = '20px';
      description.style.color = '#666';
      tempContainer.appendChild(description);
      
      // Create report content based on document type
      switch (docType) {
        case 'inventory':
          createInventoryReport(tempContainer, reportData);
          break;
        case 'sales':
          createSalesReport(tempContainer, reportData);
          break;
        case 'purchase_orders':
          createPurchaseOrdersReport(tempContainer, reportData);
          break;
        case 'patients':
          createPatientsReport(tempContainer, reportData);
          break;
      }
      
      // Generate PDF
      const pdfDataUrl = await generatePDFFromElement(tempContainer, {
        title: docName,
        description: doc?.description,
        lastUpdated: doc?.lastUpdated || new Date()
      });
      
      if (pdfDataUrl) {
        // Download the PDF
        downloadPDF(pdfDataUrl, docName);
        
        toast({
          title: "Report downloaded",
          description: `${docName} has been generated and downloaded.`
        });
      } else {
        throw new Error("Failed to generate PDF");
      }
    } catch (error) {
      console.error(`Error downloading ${docName}:`, error);
      toast({
        title: "Error generating report",
        description: "An error occurred while generating the report.",
        variant: "destructive"
      });
    } finally {
      // Reset loading state
      setDocumentLoading(docType, false);
    }
  };

  const handleDownloadFromPreview = () => {
    if (currentDocType && currentDocName) {
      handleDownload(currentDocType, currentDocName);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Document Management</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-70px)] overflow-hidden">
        <div className="h-full overflow-auto">
          <DocumentList 
            documents={documents}
            onDownload={handleDownload}
            onPreview={handlePreview}
          />
        </div>
        
        <DocumentPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          documentName={currentDocName}
          documentType={currentDocType as DocumentType}
          reportData={reportData}
          onDownload={handleDownloadFromPreview}
          previewRef={reportContainerRef}
        />
        
        {/* Hidden container for report generation */}
        <div 
          ref={reportContainerRef} 
          className="hidden" 
          style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
        ></div>
      </CardContent>
    </Card>
  );
}
