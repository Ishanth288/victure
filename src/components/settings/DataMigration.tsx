
import React, { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertCircle } from "lucide-react";
import { stableToast } from "@/components/ui/stable-toast";
import { PreviewItem } from "@/types/dataMigration";
import { FileUpload } from "./data-migration/FileUpload";
import { DataPreview } from "./data-migration/DataPreview";
import { ImportControls } from "./data-migration/ImportControls";
import { ResultSummary } from "./data-migration/ResultSummary";
import { MigrationHistory } from "./data-migration/MigrationHistory";
import { ModeSelector } from "./data-migration/ModeSelector";
import { MigrationMode } from "./data-migration/types";
import { 
  processInventoryItems, 
  processPatients, 
  processPrescriptions, 
  getRecentMigrations, 
  rollbackMigration 
} from "@/utils/migrationUtils";
import * as XLSX from 'xlsx';

export function DataMigration() {
  const { user } = useAuth();
  
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
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [recentMigrations, setRecentMigrations] = useState<any[]>([]);

  // Load migration history
  useEffect(() => {
    loadMigrationHistory();
  }, []);

  const loadMigrationHistory = async () => {
    try {
      const migrations = await getRecentMigrations();
      setRecentMigrations(migrations);
    } catch (err) {
      console.error('Failed to load migration history:', err);
      stableToast({
        title: "Error",
        description: "Could not load migration history",
        variant: "destructive",
      });
    }
  };

  // Process file upload
  useEffect(() => {
    if (selectedFile) {
      processFile(selectedFile);
    } else {
      setFileHeaders([]);
      setPreviewItems([]);
      setSelectedFields({});
      setImportResults(null);
    }
  }, [selectedFile]);

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
      
      // Get headers
      const headers = Object.keys(data[0]);
      setFileHeaders(headers);
      
      // Create preview items
      const preview = data.slice(0, 5).map(row => {
        const item: Record<string, any> = {};
        headers.forEach(header => {
          item[header] = row[header];
        });
        return item as PreviewItem;
      });
      
      setPreviewItems(preview);
      
      // Auto-detect field mappings
      const mappings = autoDetectFieldMappings(headers);
      setSelectedFields(mappings);
      
    } catch (err) {
      console.error('File processing error:', err);
      setUploadError("Failed to process file");
    }
  };

  const autoDetectFieldMappings = (headers: string[]): Record<string, string> => {
    const mappings: Record<string, string> = {};
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      // Inventory mappings
      if (/med(icine)?[\s_-]?name|product[\s_-]?name|drug[\s_-]?name|item[\s_-]?name/i.test(lowerHeader)) {
        mappings[header] = 'name';
      } 
      else if (/generic/i.test(lowerHeader)) {
        mappings[header] = 'generic_name';
      }
      else if (/mfg|manufacturer|company|maker/i.test(lowerHeader)) {
        mappings[header] = 'manufacturer';
      }
      else if (/batch|lot[\s_-]?no|batch[\s_-]?number|ndc/i.test(lowerHeader)) {
        mappings[header] = 'batch_number';
      }
      else if (/exp|expir(y|ation)|valid[\s_-]?until/i.test(lowerHeader)) {
        mappings[header] = 'expiry_date';
      }
      else if (/qty|quant(ity)?|stock/i.test(lowerHeader)) {
        mappings[header] = 'quantity';
      }
      else if (/cost|buy[\s_-]?price|purchase[\s_-]?price/i.test(lowerHeader)) {
        mappings[header] = 'unit_cost';
      }
      else if (/mrp|sell[\s_-]?price|retail[\s_-]?price|price/i.test(lowerHeader)) {
        mappings[header] = 'selling_price';
      }
      
      // Patient mappings
      else if (/patient[\s_-]?name|name/i.test(lowerHeader)) {
        mappings[header] = 'name';
      }
      else if (/phone|mobile|contact/i.test(lowerHeader)) {
        mappings[header] = 'phone_number';
      }
      
      // Prescription mappings
      else if (/rx[\s_-]?(no|number)|prescription[\s_-]?(no|number)/i.test(lowerHeader)) {
        mappings[header] = 'prescription_number';
      }
      else if (/doctor|physician|prescribed[\s_-]?by/i.test(lowerHeader)) {
        mappings[header] = 'doctor_name';
      }
      else if (/date|rx[\s_-]?date|prescribed[\s_-]?on/i.test(lowerHeader)) {
        mappings[header] = 'date';
      }
    });
    
    return mappings;
  };

  const handleStartImport = async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    setImportResults(null);
    
    try {
      const rawData = await readFileData(selectedFile);
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

  const readFileData = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Failed to read file"));
            return;
          }
          
          let workbook;
          if (typeof data === 'string') {
            workbook = XLSX.read(data, { type: 'string' });
          } else {
            workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });
          }
          
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
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

  const handleRollback = async (migrationId: string, type: 'Inventory' | 'Patients' | 'Prescriptions') => {
    setIsRollingBack(true);
    
    try {
      const success = await rollbackMigration(migrationId, type);
      
      if (success) {
        stableToast({
          title: "Rollback Successful",
          description: `Successfully rolled back ${type} migration`,
          variant: "success",
        });
        
        // Refresh migration history
        loadMigrationHistory();
      } else {
        stableToast({
          title: "Rollback Failed",
          description: `Failed to roll back ${type} migration`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Rollback error:', err);
      stableToast({
        title: "Rollback Failed",
        description: `Error: ${err}`,
        variant: "destructive",
      });
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <Card className="overflow-visible">
      <CardHeader>
        <CardTitle>Data Migration</CardTitle>
        <CardDescription>
          Import data from other pharmacy systems
        </CardDescription>
      </CardHeader>
      
      <CardContent className="overflow-visible">
        <Tabs defaultValue="import" className="overflow-visible">
          <TabsList>
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="history">Migration History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-6 overflow-visible">
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
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-6 overflow-visible">
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
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Step 3: Map Fields</h3>
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
              )}
              
              {importResults && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Import Results</h3>
                  <ResultSummary importResults={importResults} />
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="overflow-visible">
            <MigrationHistory 
              recentMigrations={recentMigrations} 
              onRollback={handleRollback}
              isRollingBack={isRollingBack}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
