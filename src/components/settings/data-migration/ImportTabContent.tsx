import React, { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertCircle } from "lucide-react";
import { stableToast } from "@/components/ui/stable-toast";
import { PreviewItem, MappingTemplate } from "@/types/dataMigration";
import { FileUpload } from "./FileUpload";
import { DataPreview } from "./DataPreview";
import { ImportControls } from "./ImportControls";
import { ResultSummary } from "./ResultSummary";
import { ModeSelector } from "./ModeSelector";
import { MappingTemplateManager } from "./MappingTemplateManager";
import { MigrationMode } from "./types";
import { 
  processInventoryItems, 
  processPatients, 
  processPrescriptions,
  autoDetectFieldMappings,
  previewMappedData
} from "@/utils/migration";
import * as XLSX from 'xlsx';

interface ImportTabContentProps {
  user: any;
  loadMigrationHistory: () => void;
}

export const ImportTabContent: React.FC<ImportTabContentProps> = ({ user, loadMigrationHistory }) => {
  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [selectedFields, setSelectedFields] = useState<Record<string, string>>({});
  const [migrationMode, setMigrationMode] = useState<MigrationMode>("Inventory");
  const [importResults, setImportResults] = useState<{
    success: boolean;
    added: number;
    skipped: number;
    issues: Array<{ row: number; reason: string }>;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [rawData, setRawData] = useState<any[]>([]);

  // Process file upload
  useEffect(() => {
    if (selectedFile) {
      processFile(selectedFile);
    } else {
      setFileHeaders([]);
      setPreviewItems([]);
      setSelectedFields({});
      setImportResults(null);
      setRawData([]);
    }
  }, [selectedFile]);

  // Update preview when field mappings change
  useEffect(() => {
    if (rawData.length > 0 && Object.keys(selectedFields).length > 0) {
      updatePreview();
    }
  }, [selectedFields]);

  const processFile = async (file: File) => {
    try {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      let data: any[] = [];
      
      if (fileType === 'csv') {
        const text = await file.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet);
      }
      
      if (data.length === 0) {
        setUploadError("The file appears to be empty");
        return;
      }
      
      // Store raw data for later transformation
      setRawData(data);
      
      // Get headers
      const headers = Object.keys(data[0]);
      setFileHeaders(headers);
      
      // Auto-detect field mappings
      const mappings = autoDetectFieldMappings(headers);
      setSelectedFields(mappings);
      
      // Create initial preview
      updatePreviewFromData(data, mappings);
      
    } catch (err) {
      console.error('File processing error:', err);
      setUploadError("Failed to process file");
    }
  };

  const updatePreviewFromData = (data: any[], mappings: Record<string, string>) => {
    // Create preview items
    const preview = data.slice(0, 5).map(row => {
      const item: Record<string, any> = {};
      
      // Apply mappings to transform the data
      Object.entries(mappings).forEach(([sourceField, targetField]) => {
        if (row[sourceField] !== undefined) {
          item[targetField] = row[sourceField];
        }
      });
      
      return item as PreviewItem;
    });
    
    setPreviewItems(preview);
  };

  const updatePreview = () => {
    if (rawData.length > 0) {
      updatePreviewFromData(rawData, selectedFields);
    }
  };

  const handleApplyTemplate = (template: MappingTemplate) => {
    setSelectedFields(template.mappings);
  };

  const handleStartImport = async () => {
    if (!selectedFile || rawData.length === 0) return;
    
    setIsImporting(true);
    setImportResults(null);
    
    try {
      const transformedData = transformData(rawData, selectedFields);
      
      let result;
      if (migrationMode === "Inventory") {
        result = await processInventoryItems(transformedData);
      } else if (migrationMode === "Patients") {
        if (!user) {
          throw new Error("User not authenticated");
        }
        // Add user_id to each patient
        const patientsWithUserId = transformedData.map(patient => ({
          ...patient,
          user_id: user.uid
        }));
        result = await processPatients(patientsWithUserId);
      } else if (migrationMode === "Prescriptions") {
        if (!user) {
          throw new Error("User not authenticated");
        }
        // Add user_id to each prescription
        const prescriptionsWithUserId = transformedData.map(prescription => ({
          ...prescription,
          user_id: user.uid
        }));
        result = await processPrescriptions(prescriptionsWithUserId);
      }
      
      setImportResults(result);
      
      if (result && result.success) {
        stableToast({
          title: "Import Successful",
          description: `Successfully imported ${result.added} items`,
          variant: "success",
        });
        
        // Refresh migration history
        loadMigrationHistory();
      } else {
        stableToast({
          title: "Import Failed",
          description: "Failed to import data. Please check the logs.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Import error:", err);
      setImportResults({
        success: false,
        added: 0,
        skipped: 0,
        issues: [{ row: 0, reason: String(err) }]
      });
      
      stableToast({
        title: "Import Failed",
        description: `Error: ${err}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const transformData = (data: any[], fieldMappings: Record<string, string>): PreviewItem[] => {
    return data.map(row => {
      const transformedRow: Record<string, any> = {};
      
      // Map fields according to selected mappings
      Object.keys(row).forEach(key => {
        const mappedField = fieldMappings[key];
        if (mappedField) {
          transformedRow[mappedField] = row[key];
        }
      });
      
      return transformedRow as PreviewItem;
    });
  };

  return (
    <div className="space-y-6">
      {!user && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to use this feature
          </AlertDescription>
        </Alert>
      )}
      
      <Alert variant="info" className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-600" />
        <AlertTitle>Import Guidelines</AlertTitle>
        <AlertDescription className="text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>Make sure your CSV/Excel file has headers</li>
            <li>Data should be consistently formatted</li>
            <li>Dates should be in YYYY-MM-DD format</li>
            <li>Numbers should not contain currency symbols</li>
            <li>You can save field mappings as templates for future use</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Step 1: Select Data Type</h3>
        <ModeSelector migrationMode={migrationMode} setMigrationMode={setMigrationMode} />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Step 2: Upload File</h3>
        <FileUpload setSelectedFile={setSelectedFile} setUploadError={setUploadError} />
        
        {uploadError && (
          <Alert variant="error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Error</AlertTitle>
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        
        {selectedFile && (
          <div className="py-2 px-3 bg-gray-50 border rounded flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-gray-500 ml-2">
                ({(selectedFile.size / 1024).toFixed(2)} KB)
              </span>
            </div>
            <button 
              onClick={() => setSelectedFile(null)} 
              className="text-gray-500 hover:text-gray-700"
            >
              Remove
            </button>
          </div>
        )}
      </div>
      
      {selectedFile && fileHeaders.length > 0 && (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 3: Map Fields</h3>
            
            {user && (
              <MappingTemplateManager
                selectedFields={selectedFields}
                fileHeaders={fileHeaders}
                migrationMode={migrationMode}
                onApplyTemplate={handleApplyTemplate}
              />
            )}
            
            <DataPreview 
              previewItems={previewItems}
              selectedFields={selectedFields}
              setSelectedFields={setSelectedFields}
              fileHeaders={fileHeaders}
              migrationMode={migrationMode}
            />
            
            <ImportControls 
              onStartImport={handleStartImport}
              previewItems={previewItems}
              isImporting={isImporting}
              selectedFields={selectedFields}
              migrationMode={migrationMode}
            />
          </div>
          
          {importResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Import Results</h3>
              <ResultSummary importResults={importResults} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
