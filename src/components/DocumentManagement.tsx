
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Trash2 } from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
}

export function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', name: 'Inventory Report', type: 'PDF', date: '2023-06-10', size: '1.2 MB' },
    { id: '2', name: 'Sales Analysis', type: 'XLSX', date: '2023-06-08', size: '843 KB' },
    { id: '3', name: 'Supplier Contract', type: 'DOCX', date: '2023-05-28', size: '1.5 MB' }
  ]);

  const deleteDocument = (docId: string) => {
    setDocuments(documents.filter(doc => doc.id !== docId));
  };

  // This is a placeholder for document download
  const downloadDocument = (docId: string) => {
    console.log(`Download document with ID: ${docId}`);
    // In a real implementation, this would trigger a file download
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Document Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button className="w-full">
            Upload New Document
          </Button>
          
          <div className="overflow-y-auto max-h-[250px]">
            {documents.map(doc => (
              <div 
                key={doc.id}
                className="flex items-center justify-between p-3 border-b last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.type} • {doc.size} • {doc.date}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => downloadDocument(doc.id)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {documents.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No documents available. Upload one to get started!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
