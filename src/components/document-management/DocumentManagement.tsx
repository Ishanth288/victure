
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateSystemReport, downloadPDF, generatePDFFromElement } from "@/utils/documentUtils";
import { DocumentList } from "./DocumentList";
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
  
  // Get initial data
  const { documents: initialFetchedDocs, currentUserId } = useDataFetching(initialDocuments);
  
  // Setup real-time updates
  const { 
    documents, 
    setDocumentLoading 
  } = useDocumentUpdates(currentUserId, initialFetchedDocs);

  const handleDownload = async (docType: DocumentType, docName: string) => {
    try {
      // Set loading state
      setDocumentLoading(docType, true);
      
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
      
      // Create temporary report container
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
      header.textContent = docName;
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
          createInventoryReport(reportDiv, reportData);
          break;
        case 'sales':
          createSalesReport(reportDiv, reportData);
          break;
        case 'purchase_orders':
          createPurchaseOrdersReport(reportDiv, reportData);
          break;
        case 'patients':
          createPatientsReport(reportDiv, reportData);
          break;
      }
      
      // Append to the container
      reportContainerRef.current.appendChild(reportDiv);
      
      // Generate PDF
      const pdfDataUrl = await generatePDFFromElement(reportContainerRef.current, {
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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Document Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <DocumentList 
            documents={documents}
            onDownload={handleDownload}
          />
        </div>
        
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
