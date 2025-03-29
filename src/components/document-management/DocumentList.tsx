
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { FileText, Download, BarChart2, Package, FileBarChart, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentType, SystemDocument } from "./types";
import { useDocumentUpdates } from "./useDocumentUpdates";

interface DocumentListProps {
  documents: SystemDocument[];
  onDownload: (docType: DocumentType, docName: string) => void;
}

export function DocumentList({ documents, onDownload }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 flex flex-col items-center justify-center">
        <AlertCircle className="h-8 w-8 mb-2 text-gray-400" />
        <p>No system documents available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[250px]">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className="flex items-center justify-between p-3 border-b last:border-b-0"
        >
          <div className="flex items-center space-x-3">
            {doc.icon || <FileText className="h-5 w-5 text-blue-500" />}
            <div>
              <p className="font-medium text-sm">{doc.name}</p>
              <p className="text-xs text-gray-500">
                {doc.lastUpdated 
                  ? `Updated: ${format(doc.lastUpdated, 'MMM dd, yyyy • HH:mm')}` 
                  : 'No data available'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDownload(doc.type, doc.name)}
              disabled={doc.isLoading}
            >
              {doc.isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
