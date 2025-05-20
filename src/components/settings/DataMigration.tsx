import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { stableToast } from '@/components/ui/stable-toast';
import * as XLSX from 'xlsx';
import { DataTable } from "@/components/ui/data-table";
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, X, Check, Download, Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { 
  processInventoryItems, 
  processPatients, 
  processPrescriptions,
  rollbackMigration,
  getRecentMigrations,
  autoDetectFieldMappings
} from '@/utils/migrationUtils';
import { autoFixData, hasTooManyInvalidItems } from '@/utils/dataValidation';
import { PreviewItem, WarningType } from '@/types/dataMigration';

export function DataMigration() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [filteredPreviewItems, setFilteredPreviewItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [recentMigrations, setRecentMigrations] = useState<any[]>([]);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [selectedRollbackMigration, setSelectedRollbackMigration] = useState<any>(null);
  const [summaryDialog, setSummaryDialog] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState<any>(null);

  // Load recent migrations on component mount
  useEffect(() => {
    if (user) {
      loadRecentMigrations();
    }
  }, [user]);

  const loadRecentMigrations = async () => {
    const migrations = await getRecentMigrations();
    setRecentMigrations(migrations);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    setLoading(true);
    setProgress(10);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        setProgress(30);
        
        let parsedData: any[] = [];
        let headers: string[] = [];
        
        // Parse based on file type
        if (file.name.endsWith('.csv')) {
          const result = parseCSV(data as string);
          parsedData = result.data;
          headers = result.headers;
        } 
        else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const result = parseExcel(data as ArrayBuffer);
          parsedData = result.data;
          headers = result.headers;
        }
        else if (file.name.endsWith('.json')) {
          const result = parseJSON(data as string);
          parsedData = result.data;
          headers = result.headers;
        }
        else {
          throw new Error('Unsupported file format. Please upload CSV, Excel, or JSON file.');
        }
        
        setFileData(parsedData);
        setColumns(headers);
        setProgress(60);
        
        // Auto-detect mappings
        const detectedMappings = autoDetectFieldMappings(headers);
        setMappings(detectedMappings);
        
        setProgress(100);
        setStep(2);
        stableToast({
          title: "File Processed Successfully",
          description: `${parsedData.length} records found.`,
          variant: "success",
        });
      } catch (err: any) {
        setError(err.message || 'Failed to parse file');
        stableToast({
          title: "Error Processing File",
          description: err.message || 'Failed to parse file',
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setLoading(false);
      stableToast({
        title: "Error",
        description: "Failed to read the file.",
        variant: "destructive",
      });
    };

    if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const parseCSV = (data: string) => {
    const lines = data.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const parsedData = lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, any> = {};
      
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      
      return row;
    });
    
    return { data: parsedData, headers };
  };

  const parseExcel = (data: ArrayBuffer) => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const parsedData = XLSX.utils.sheet_to_json(worksheet);
    
    // Extract headers
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const headers: string[] = [];
    
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
      headers.push(cell?.v || `Column${C}`);
    }
    
    return { data: parsedData, headers };
  };

  const parseJSON = (data: string) => {
    const parsedData = JSON.parse(data);
    
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error('Invalid JSON format. Expected an array of objects.');
    }
    
    const headers = Object.keys(parsedData[0]);
    return { data: parsedData, headers };
  };

  const handleDragStart = (column: string, e: React.DragEvent) => {
    e.dataTransfer.setData('column', column);
  };

  const handleDrop = (field: string, e: React.DragEvent) => {
    e.preventDefault();
    const column = e.dataTransfer.getData('column');
    
    setMappings(prev => ({
      ...prev,
      [column]: field
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMapField = (column: string, field: string) => {
    setMappings(prev => ({
      ...prev,
      [column]: field
    }));
  };

  const createPreviewItems = () => {
    setLoading(true);
    
    try {
      let previewItems: PreviewItem[] = [];
      
      // Map data based on user-defined mappings
      fileData.forEach((row) => {
        const item: Record<string, any> = {};
        
        Object.entries(mappings).forEach(([column, field]) => {
          item[field] = row[column];
        });
        
        // Add as PreviewItem
        previewItems.push(item as PreviewItem);
      });
      
      // Apply automatic fixes
      previewItems = autoFixData(previewItems);
      
      // Generate warnings based on data type
      if (activeTab === 'inventory') {
        previewItems = validateInventoryItems(previewItems);
      } else if (activeTab === 'patients') {
        previewItems = validatePatientItems(previewItems);
      } else if (activeTab === 'prescriptions') {
        previewItems = validatePrescriptionItems(previewItems);
      }
      
      setPreviewItems(previewItems);
      setFilteredPreviewItems(previewItems);
      setStep(3);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create preview');
      stableToast({
        title: "Error",
        description: err.message || 'Failed to create preview',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const validateInventoryItems = (items: PreviewItem[]): PreviewItem[] => {
    return items.map(item => {
      const warnings: {hasWarning: boolean, warningType?: WarningType, warningMessage?: string} = {hasWarning: false};
      
      // Check expiry date
      if (item.expiry_date) {
        const expiryDate = new Date(item.expiry_date);
        if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
          warnings.hasWarning = true;
          warnings.warningType = "expired";
          warnings.warningMessage = "Medicine is expired";
        }
      } else if (!item.name) {
        warnings.hasWarning = true;
        warnings.warningType = "missing";
        warnings.warningMessage = "Missing medicine name";
      }
      
      // Check price
      if (item.selling_price === undefined || isNaN(Number(item.selling_price)) || Number(item.selling_price) <= 0) {
        warnings.hasWarning = true;
        warnings.warningType = "price";
        warnings.warningMessage = "Invalid price";
      }
      
      return { ...item, ...warnings };
    });
  };
  
  const validatePatientItems = (items: PreviewItem[]): PreviewItem[] => {
    return items.map(item => {
      const warnings: {hasWarning: boolean, warningType?: WarningType, warningMessage?: string} = {hasWarning: false};
      
      // Check for name
      if (!item.name) {
        warnings.hasWarning = true;
        warnings.warningType = "missing";
        warnings.warningMessage = "Missing patient name";
      }
      
      // Check phone number
      if (!item.phone_number) {
        warnings.hasWarning = true;
        warnings.warningType = "missing";
        warnings.warningMessage = "Missing phone number";
      }
      
      return { ...item, ...warnings };
    });
  };
  
  const validatePrescriptionItems = (items: PreviewItem[]): PreviewItem[] => {
    return items.map(item => {
      const warnings: {hasWarning: boolean, warningType?: WarningType, warningMessage?: string} = {hasWarning: false};
      
      // Check for prescription number
      if (!item.prescription_number) {
        warnings.hasWarning = true;
        warnings.warningType = "missing";
        warnings.warningMessage = "Missing prescription number";
      }
      
      // Check for doctor name
      if (!item.doctor_name) {
        warnings.hasWarning = true;
        warnings.warningType = "missing";
        warnings.warningMessage = "Missing doctor name";
      }
      
      return { ...item, ...warnings };
    });
  };

  const handleRemoveItem = (index: number) => {
    setFilteredPreviewItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = () => {
    setConfirmDialogOpen(true);
  };

  const handleExecuteImport = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    
    try {
      let result: any;
      
      if (activeTab === 'inventory') {
        result = await processInventoryItems(filteredPreviewItems);
      } else if (activeTab === 'patients') {
        result = await processPatients(filteredPreviewItems);
      } else if (activeTab === 'prescriptions') {
        result = await processPrescriptions(filteredPreviewItems);
      }
      
      if (result && result.success) {
        setMigrationSummary(result);
        setSummaryDialog(true);
        await loadRecentMigrations(); // Refresh the migrations list
        setStep(4);
      } else {
        throw new Error('Import failed');
      }
      
    } catch (err: any) {
      setError(err.message || 'Import failed');
      stableToast({
        title: "Import Failed",
        description: err.message || 'An error occurred during import',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = (migration: any) => {
    setSelectedRollbackMigration(migration);
    setRollbackDialogOpen(true);
  };

  const executeRollback = async () => {
    setRollbackDialogOpen(false);
    setLoading(true);
    
    try {
      const success = await rollbackMigration(
        selectedRollbackMigration.migration_id, 
        selectedRollbackMigration.type
      );
      
      if (success) {
        stableToast({
          title: "Rollback Successful",
          description: `Successfully rolled back ${selectedRollbackMigration.type} migration`,
          variant: "success",
        });
        await loadRecentMigrations();
      } else {
        throw new Error('Rollback failed');
      }
    } catch (err: any) {
      setError(err.message || 'Rollback failed');
      stableToast({
        title: "Rollback Failed",
        description: err.message || 'An error occurred during rollback',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetProcess = () => {
    setStep(1);
    setFile(null);
    setFileData([]);
    setColumns([]);
    setMappings({});
    setPreviewItems([]);
    setFilteredPreviewItems([]);
    setError(null);
  };

  // Mapping fields based on the selected data type
  const getDataFields = () => {
    if (activeTab === 'inventory') {
      return [
        { key: 'name', label: 'Medicine Name' },
        { key: 'generic_name', label: 'Generic Name' },
        { key: 'manufacturer', label: 'Manufacturer' },
        { key: 'batch_number', label: 'Batch Number' },
        { key: 'expiry_date', label: 'Expiry Date' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'unit_cost', label: 'Unit Cost' },
        { key: 'selling_price', label: 'Selling Price' },
        { key: 'schedule', label: 'Schedule' },
        { key: 'hsn_code', label: 'HSN Code' }
      ];
    } else if (activeTab === 'patients') {
      return [
        { key: 'name', label: 'Patient Name' },
        { key: 'phone_number', label: 'Phone Number' },
        { key: 'external_id', label: 'External ID' },
        { key: 'status', label: 'Status' },
        { key: 'visit_count', label: 'Visit Count' },
        { key: 'is_first_visit', label: 'Is First Visit' },
        { key: 'chronic_diseases', label: 'Chronic Diseases' },
        { key: 'recent_prescription_count', label: 'Recent Prescriptions' }
      ];
    } else if (activeTab === 'prescriptions') {
      return [
        { key: 'prescription_number', label: 'Prescription Number' },
        { key: 'doctor_name', label: 'Doctor Name' },
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Status' },
        { key: 'patient_id', label: 'Patient ID' }
      ];
    }
    return [];
  };

  const renderStepIndicator = () => {
    return (
      <div className="w-full mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex-1 text-center">
            <div className={`rounded-full w-8 h-8 mx-auto flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-xs mt-1 block">Upload</span>
          </div>
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="flex-1 text-center">
            <div className={`rounded-full w-8 h-8 mx-auto flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="text-xs mt-1 block">Map</span>
          </div>
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="flex-1 text-center">
            <div className={`rounded-full w-8 h-8 mx-auto flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="text-xs mt-1 block">Preview</span>
          </div>
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="flex-1 text-center">
            <div className={`rounded-full w-8 h-8 mx-auto flex items-center justify-center ${step >= 4 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              4
            </div>
            <span className="text-xs mt-1 block">Confirm</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <CardTitle>Data Migration</CardTitle>
            <CardDescription>Import and migrate data from various pharmacy systems</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="history">Migration History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="space-y-4">
            {renderStepIndicator()}
            
            {step === 1 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <h3 className="font-medium text-lg mb-1">Upload Inventory File</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Supported formats: CSV, Excel (.xlsx, .xls), JSON
                    </p>
                    
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={handleFileChange}
                    />
                    <div className="flex space-x-2">
                      <Button onClick={() => document.getElementById('file-upload')?.click()}>
                        Select File
                      </Button>
                    </div>
                    {file && (
                      <div className="mt-4 p-3 bg-gray-100 rounded-md flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                    )}
                    {loading && <Progress value={progress} className="mt-4 w-1/2" />}
                    {error && (
                      <Alert variant="warning" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Map Columns to Fields</CardTitle>
                    <CardDescription>
                      Drag columns from your file to map them to the correct fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-medium">Source Columns</h3>
                        <div className="space-y-2">
                          {columns.map((column) => (
                            <div
                              key={column}
                              className={cn(
                                "p-2 bg-gray-100 rounded-md cursor-move flex justify-between items-center",
                                mappings[column] && "border-l-4 border-green-500 pl-2"
                              )}
                              draggable
                              onDragStart={(e) => handleDragStart(column, e)}
                            >
                              <span>{column}</span>
                              {mappings[column] && (
                                <Badge variant="outline" className="bg-green-50">
                                  {mappings[column]}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-medium">Target Fields</h3>
                        <div className="space-y-2">
                          {getDataFields().map((field) => (
                            <div
                              key={field.key}
                              className={cn(
                                "p-2 bg-gray-50 border border-gray-200 rounded-md",
                                Object.values(mappings).includes(field.key) && "bg-green-50 border-green-300"
                              )}
                              onDrop={(e) => handleDrop(field.key, e)}
                              onDragOver={handleDragOver}
                            >
                              {field.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetProcess}>Back</Button>
                  <Button onClick={createPreviewItems} disabled={loading || Object.keys(mappings).length === 0}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : 'Preview Data'}
                  </Button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Data Preview</CardTitle>
                      <Badge variant={hasTooManyInvalidItems(filteredPreviewItems) ? "destructive" : "default"}>
                        {filteredPreviewItems.filter(item => item.hasWarning).length} issues
                      </Badge>
                    </div>
                    <CardDescription>
                      Review your data before importing. Click "-" to exclude items.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            {getDataFields().filter(field => Object.values(mappings).includes(field.key)).map((field) => (
                              <th key={field.key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {field.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredPreviewItems.slice(0, 20).map((item, index) => (
                            <tr key={index} className={item.hasWarning ? "bg-red-50" : ""}>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {item.hasWarning ? (
                                  <Badge variant="destructive">
                                    {item.warningMessage}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50">
                                    Valid
                                  </Badge>
                                )}
                              </td>
                              {getDataFields().filter(field => Object.values(mappings).includes(field.key)).map((field) => (
                                <td key={field.key} className="px-3 py-2 whitespace-nowrap text-sm">
                                  {String(item[field.key] || '-')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredPreviewItems.length > 20 && (
                        <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                          Showing 20 of {filteredPreviewItems.length} items
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {hasTooManyInvalidItems(filteredPreviewItems) && (
                  <Alert variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Too many invalid items</AlertTitle>
                    <AlertDescription>
                      More than 10% of items have issues. Please fix them before proceeding.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button 
                    onClick={handleConfirmImport} 
                    disabled={loading || filteredPreviewItems.length === 0 || hasTooManyInvalidItems(filteredPreviewItems)}
                  >
                    Import Data
                  </Button>
                </div>
              </div>
            )}
            
            {step === 4 && (
              <div className="space-y-4">
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Data migration completed successfully
                  </AlertDescription>
                </Alert>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Migration Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Total Items</div>
                          <div className="text-2xl font-semibold">
                            {migrationSummary?.added + migrationSummary?.skipped || 0}
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Successfully Added</div>
                          <div className="text-2xl font-semibold text-green-600">
                            {migrationSummary?.added || 0}
                          </div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Skipped Items</div>
                          <div className="text-2xl font-semibold text-amber-600">
                            {migrationSummary?.skipped || 0}
                          </div>
                        </div>
                      </div>
                      
                      {migrationSummary?.issues && migrationSummary.issues.length > 0 && (
                        <div className="mt-4">
                          <h3 className="font-medium mb-2">Issues</h3>
                          <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {migrationSummary.issues.slice(0, 5).map((issue: any, index: number) => (
                                  <tr key={index}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">{issue.row}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">{issue.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {migrationSummary.issues.length > 5 && (
                              <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                                Showing 5 of {migrationSummary.issues.length} issues
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetProcess}>Start New Import</Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="patients" className="space-y-4">
            {renderStepIndicator()}
            
            {step === 1 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <h3 className="font-medium text-lg mb-1">Upload Patient Data File</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Supported formats: CSV, Excel (.xlsx, .xls), JSON
                    </p>
                    
                    <Input
                      id="patient-file-upload"
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={handleFileChange}
                    />
                    <div className="flex space-x-2">
                      <Button onClick={() => document.getElementById('patient-file-upload')?.click()}>
                        Select File
                      </Button>
                    </div>
                    {file && (
                      <div className="mt-4 p-3 bg-gray-100 rounded-md flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                    )}
                    {loading && <Progress value={progress} className="mt-4 w-1/2" />}
                    {error && (
                      <Alert variant="warning" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Map Columns to Fields</CardTitle>
                    <CardDescription>
                      Drag columns from your file to map them to the correct fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-medium">Source Columns</h3>
                        <div className="space-y-2">
                          {columns.map((column) => (
                            <div
                              key={column}
                              className={cn(
                                "p-2 bg-gray-100 rounded-md cursor-move flex justify-between items-center",
                                mappings[column] && "border-l-4 border-green-500 pl-2"
                              )}
                              draggable
                              onDragStart={(e) => handleDragStart(column, e)}
                            >
                              <span>{column}</span>
                              {mappings[column] && (
                                <Badge variant="outline" className="bg-green-50">
                                  {mappings[column]}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-medium">Target Fields</h3>
                        <div className="space-y-2">
                          {getDataFields().map((field) => (
                            <div
                              key={field.key}
                              className={cn(
                                "p-2 bg-gray-50 border border-gray-200 rounded-md",
                                Object.values(mappings).includes(field.key) && "bg-green-50 border-green-300"
                              )}
                              onDrop={(e) => handleDrop(field.key, e)}
                              onDragOver={handleDragOver}
                            >
                              {field.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetProcess}>Back</Button>
                  <Button onClick={createPreviewItems} disabled={loading || Object.keys(mappings).length === 0}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : 'Preview Data'}
                  </Button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Data Preview</CardTitle>
                      <Badge variant={hasTooManyInvalidItems(filteredPreviewItems) ? "destructive" : "default"}>
                        {filteredPreviewItems.filter(item => item.hasWarning).length} issues
                      </Badge>
                    </div>
                    <CardDescription>
                      Review your data before importing. Click "-" to exclude items.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            {getDataFields().filter(field => Object.values(mappings).includes(field.key)).map((field) => (
                              <th key={field.key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {field.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredPreviewItems.slice(0, 20).map((item, index) => (
                            <tr key={index} className={item.hasWarning ? "bg-red-50" : ""}>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {item.hasWarning ? (
                                  <Badge variant="destructive">
                                    {item.warningMessage}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50">
                                    Valid
                                  </Badge>
                                )}
                              </td>
                              {getDataFields().filter(field => Object.values(mappings).includes(field.key)).map((field) => (
                                <td key={field.key} className="px-3 py-2 whitespace-nowrap text-sm">
                                  {String(item[field.key] || '-')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredPreviewItems.length > 20 && (
                        <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                          Showing 20 of {filteredPreviewItems.length} items
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {hasTooManyInvalidItems(filteredPreviewItems) && (
                  <Alert variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Too many invalid items</AlertTitle>
                    <AlertDescription>
                      More than 10% of items have issues. Please fix them before proceeding.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button 
                    onClick={handleConfirmImport} 
                    disabled={loading || filteredPreviewItems.length === 0 || hasTooManyInvalidItems(filteredPreviewItems)}
                  >
                    Import Data
                  </Button>
                </div>
              </div>
            )}
            
            {step === 4 && (
              <div className="space-y-4">
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Data migration completed successfully
                  </AlertDescription>
                </Alert>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Migration Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Total Items</div>
                          <div className="text-2xl font-semibold">
                            {migrationSummary?.added + migrationSummary?.skipped || 0}
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Successfully Added</div>
                          <div className="text-2xl font-semibold text-green-600">
                            {migrationSummary?.added || 0}
                          </div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Skipped Items</div>
                          <div className="text-2xl font-semibold text-amber-600">
                            {migrationSummary?.skipped || 0}
                          </div>
                        </div>
                      </div>
                      
                      {migrationSummary?.issues && migrationSummary.issues.length > 0 && (
                        <div className="mt-4">
                          <h3 className="font-medium mb-2">Issues</h3>
                          <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {migrationSummary.issues.slice(0, 5).map((issue: any, index: number) => (
                                  <tr key={index}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">{issue.row}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">{issue.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {migrationSummary.issues.length > 5 && (
                              <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                                Showing 5 of {migrationSummary.issues.length} issues
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetProcess}>Start New Import</Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="prescriptions" className="space-y-4">
            {renderStepIndicator()}
            
            {step === 1 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <h3 className="font-medium text-lg mb-1">Upload Prescription Data File</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Supported formats: CSV, Excel (.xlsx, .xls), JSON
                    </p>
                    
                    <Input
                      id="prescription-file-upload"
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={handleFileChange}
                    />
                    <div className="flex space-x-2">
                      <Button onClick={() => document.getElementById('prescription-file-upload')?.click()}>
                        Select File
                      </Button>
                    </div>
                    {file && (
                      <div className="mt-4 p-3 bg-gray-100 rounded-md flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                    )}
                    {loading && <Progress value={progress} className="mt-4 w-1/2" />}
                    {error && (
                      <Alert variant="warning" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Map Columns to Fields</CardTitle>
                    <CardDescription>
                      Drag columns from your file to map them to the correct fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-medium">Source Columns</h3>
                        <div className="space-y-2">
                          {columns.map((column) => (
                            <div
                              key={column}
                              className={cn(
                                "p-2 bg-gray-100 rounded-md cursor-move flex justify-between items-center",
                                mappings[column] && "border-l-4 border-green-500 pl-2"
                              )}
                              draggable
                              onDragStart={(e) => handleDragStart(column, e)}
                            >
                              <span>{column}</span>
                              {mappings[column] && (
                                <Badge variant="outline" className="bg-green-50">
                                  {mappings[column]}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-medium">Target Fields</h3>
                        <div className="space-y-2">
                          {getDataFields().map((field) => (
                            <div
                              key={field.key}
                              className={cn(
                                "p-2 bg-gray-50 border border-gray-200 rounded-md",
                                Object.values(mappings).includes(field.key) && "bg-green-50 border-green-300"
                              )}
                              onDrop={(e) => handleDrop(field.key, e)}
                              onDragOver={handleDragOver}
                            >
                              {field.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetProcess}>Back</Button>
                  <Button onClick={createPreviewItems} disabled={loading || Object.keys(mappings).length === 0}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : 'Preview Data'}
                  </Button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Data Preview</CardTitle>
                      <Badge variant={hasTooManyInvalidItems(filteredPreviewItems) ? "destructive" : "default"}>
                        {filteredPreviewItems.filter(item => item.hasWarning).length} issues
                      </Badge>
                    </div>
                    <CardDescription>
                      Review your data before importing. Click "-" to exclude items.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            {getDataFields().filter(field => Object.values(mappings).includes(field.key)).map((field) => (
                              <th key={field.key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {field.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredPreviewItems.slice(0, 20).map((item, index) => (
                            <tr key={index} className={item.hasWarning ? "bg-red-50" : ""}>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {item.hasWarning ? (
                                  <Badge variant="destructive">
                                    {item.warningMessage}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50">
                                    Valid
                                  </Badge>
                                )}
                              </td>
                              {getDataFields().filter(field => Object.values(mappings).includes(field.key)).map((field) => (
                                <td key={field.key} className="px-3 py-2 whitespace-nowrap text-sm">
                                  {String(item[field.key] || '-')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredPreviewItems.length > 20 && (
                        <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                          Showing 20 of {filteredPreviewItems.length} items
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {hasTooManyInvalidItems(filteredPreviewItems) && (
                  <Alert variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Too many invalid items</AlertTitle>
                    <AlertDescription>
                      More than 10% of items have issues. Please fix them before proceeding.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button 
                    onClick={handleConfirmImport} 
                    disabled={loading || filteredPreviewItems.length === 0 || hasTooManyInvalidItems(filteredPreviewItems)}
                  >
                    Import Data
                  </Button>
                </div>
              </div>
            )}
            
            {step === 4 && (
              <div className="space-y-4">
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Data migration completed successfully
                  </AlertDescription>
                </Alert>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Migration Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Total Items</div>
                          <div className="text-2xl font-semibold">
                            {migrationSummary?.added + migrationSummary?.skipped || 0}
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Successfully Added</div>
                          <div className="text-2xl font-semibold text-green-600">
                            {migrationSummary?.added || 0}
                          </div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Skipped Items</div>
                          <div className="text-2xl font-semibold text-amber-600">
                            {migrationSummary?.skipped || 0}
                          </div>
                        </div>
                      </div>
                      
                      {migrationSummary?.issues && migrationSummary.issues.length > 0 && (
                        <div className="mt-4">
                          <h3 className="font-medium mb-2">Issues</h3>
                          <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {migrationSummary.issues.slice(0, 5).map((issue: any, index: number) => (
                                  <tr key={index}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">{issue.row}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">{issue.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {migrationSummary.issues.length > 5 && (
                              <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                                Showing 5 of {migrationSummary.issues.length} issues
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetProcess}>Start New Import</Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Migration History</CardTitle>
                <CardDescription>
                  View and manage your previous data migrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentMigrations.length > 0 ? (
                  <div className="border rounded-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Skipped</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentMigrations.map((migration, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              {new Date(migration.timestamp).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              <Badge variant="outline">{migration.type}</Badge>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              {migration.added_count}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              {migration.skipped_count}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              {migration.issues?.length || 0}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRollback(migration)}
                              >
                                Rollback
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No migration history found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to import {filteredPreviewItems.length} {activeTab} items.
              This action will add the data to your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExecuteImport}>
              Confirm Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rollback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rollback this {selectedRollbackMigration?.type} migration?
              This will remove all data imported during this migration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeRollback}>
              Confirm Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={summaryDialog} onOpenChange={setSummaryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Summary</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="py-2">
                <div className="flex justify-between mb-2">
                  <span>Successfully imported:</span>
                  <span className="font-medium text-green-600">{migrationSummary?.added || 0} items</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Skipped items:</span>
                  <span className="font-medium text-amber-600">{migrationSummary?.skipped || 0} items</span>
                </div>
                {migrationSummary?.issues && migrationSummary.issues.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-1">Issues:</h4>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {migrationSummary.issues.slice(0, 3).map((issue: any, index: number) => (
                        <li key={index}>Row {issue.row}: {issue.reason}</li>
                      ))}
                      {migrationSummary.issues.length > 3 && (
                        <li>And {migrationSummary.issues.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
