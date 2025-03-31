
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { stableToast } from '@/components/ui/stable-toast';
import { AlertCircle, FileSpreadsheet, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MappingField {
  source: string;
  target: string;
}

export function DataMigration() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview' | 'process' | 'complete'>('upload');
  const [mappings, setMappings] = useState<{[key: string]: MappingField[]}>({
    inventory: [],
    patients: [],
    bills: []
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('inventory');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      stableToast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setProgress(10);

    // Simulate file reading
    setTimeout(() => {
      setProgress(50);
      setTimeout(() => {
        setProgress(100);
        setCurrentStep('mapping');
        setIsLoading(false);

        // Generate sample mappings
        setMappings({
          inventory: [
            { source: "product_name", target: "name" },
            { source: "product_description", target: "generic_name" },
            { source: "stock_qty", target: "quantity" },
            { source: "cost_price", target: "unit_cost" },
            { source: "selling_price", target: "selling_price" },
            { source: "expiry_date", target: "expiry_date" }
          ],
          patients: [
            { source: "customer_name", target: "name" },
            { source: "contact_no", target: "phone_number" },
            { source: "status", target: "status" }
          ],
          bills: [
            { source: "invoice_date", target: "date" },
            { source: "invoice_total", target: "total_amount" },
            { source: "tax_amount", target: "gst_amount" },
            { source: "customer_id", target: "patient_id" },
            { source: "discount", target: "discount_amount" }
          ]
        });
      }, 1000);
    }, 1500);
  };

  const handleMappingChange = (dataType: string, index: number, field: string, value: string) => {
    setMappings(prev => {
      const newMappings = { ...prev };
      newMappings[dataType][index] = {
        ...newMappings[dataType][index],
        [field]: value
      };
      return newMappings;
    });
  };

  const handlePreview = () => {
    setIsLoading(true);
    setProgress(40);

    // Simulate generating preview data
    setTimeout(() => {
      setProgress(100);
      setCurrentStep('preview');
      setIsLoading(false);

      // Generate sample preview data based on the active tab
      if (activeTab === 'inventory') {
        setPreviewData([
          { name: 'Paracetamol 500mg', generic_name: 'Acetaminophen', quantity: 150, unit_cost: 2.5, selling_price: 5.0 },
          { name: 'Amoxicillin 250mg', generic_name: 'Amoxicillin', quantity: 75, unit_cost: 3.25, selling_price: 7.5 }
        ]);
      } else if (activeTab === 'patients') {
        setPreviewData([
          { name: 'John Doe', phone_number: '9876543210', status: 'active' },
          { name: 'Jane Smith', phone_number: '8765432109', status: 'active' }
        ]);
      } else {
        setPreviewData([
          { date: '2023-05-15', total_amount: 550.75, gst_amount: 55.08, patient_id: 1, discount_amount: 10 },
          { date: '2023-05-16', total_amount: 325.00, gst_amount: 32.50, patient_id: 2, discount_amount: 0 }
        ]);
      }
    }, 1500);
  };

  const handleProcess = () => {
    setIsLoading(true);
    setProgress(20);
    setCurrentStep('process');

    // Simulate processing stages
    setTimeout(() => {
      setProgress(40);
      stableToast({
        title: "Processing inventory data",
        description: "Importing products and stock levels...",
      });
      
      setTimeout(() => {
        setProgress(70);
        stableToast({
          title: "Processing patient data",
          description: "Importing patient records...",
        });
        
        setTimeout(() => {
          setProgress(90);
          stableToast({
            title: "Processing sales data",
            description: "Importing bills and invoices...",
          });
          
          setTimeout(() => {
            setProgress(100);
            setCurrentStep('complete');
            setIsLoading(false);
            
            stableToast({
              title: "Data migration complete",
              description: "Your Profit Maker data has been successfully imported",
              variant: "success"
            });
          }, 1500);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4 flex text-sm leading-6 text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md bg-white font-semibold text-primary hover:text-primary/80 focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <Input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-gray-600">
                CSV, XLS, or XLSX up to 10MB
              </p>
            </div>
            
            {file && (
              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/30 rounded-md">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={handleUpload} 
                disabled={!file || isLoading}
                className="ml-auto"
              >
                {isLoading ? 'Analyzing...' : 'Upload & Analyze'}
              </Button>
            </div>
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-4">
            <Tabs defaultValue="inventory" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="patients">Patients</TabsTrigger>
                <TabsTrigger value="bills">Billing</TabsTrigger>
              </TabsList>
              <TabsContent value="inventory">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 py-2 font-medium text-sm">
                    <div>Source Field (Profit Maker)</div>
                    <div>Target Field (Victure)</div>
                  </div>
                  {mappings.inventory.map((mapping, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-4">
                      <Input 
                        value={mapping.source} 
                        onChange={(e) => handleMappingChange('inventory', idx, 'source', e.target.value)} 
                      />
                      <Input 
                        value={mapping.target} 
                        onChange={(e) => handleMappingChange('inventory', idx, 'target', e.target.value)} 
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="patients">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 py-2 font-medium text-sm">
                    <div>Source Field (Profit Maker)</div>
                    <div>Target Field (Victure)</div>
                  </div>
                  {mappings.patients.map((mapping, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-4">
                      <Input 
                        value={mapping.source} 
                        onChange={(e) => handleMappingChange('patients', idx, 'source', e.target.value)} 
                      />
                      <Input 
                        value={mapping.target} 
                        onChange={(e) => handleMappingChange('patients', idx, 'target', e.target.value)} 
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="bills">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 py-2 font-medium text-sm">
                    <div>Source Field (Profit Maker)</div>
                    <div>Target Field (Victure)</div>
                  </div>
                  {mappings.bills.map((mapping, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-4">
                      <Input 
                        value={mapping.source} 
                        onChange={(e) => handleMappingChange('bills', idx, 'source', e.target.value)} 
                      />
                      <Input 
                        value={mapping.target} 
                        onChange={(e) => handleMappingChange('bills', idx, 'target', e.target.value)} 
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('upload')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                onClick={handlePreview} 
                disabled={isLoading}
              >
                {isLoading ? 'Generating Preview...' : 'Preview Data'}
              </Button>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="patients">Patients</TabsTrigger>
                <TabsTrigger value="bills">Billing</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab}>
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {previewData.length > 0 && Object.keys(previewData[0]).map(key => (
                            <th 
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {previewData.map((item, idx) => (
                          <tr key={idx}>
                            {Object.values(item).map((value: any, valIdx) => (
                              <td 
                                key={valIdx}
                                className="px-6 py-4 whitespace-nowrap text-sm"
                              >
                                {value.toString()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('mapping')}
                disabled={isLoading}
              >
                Back to Mapping
              </Button>
              <Button 
                onClick={handleProcess} 
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Start Migration'}
              </Button>
            </div>
          </div>
        );
        
      case 'process':
        return (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center">
              <ArrowRightLeft className="h-16 w-16 text-primary animate-pulse mb-4" />
              <h3 className="text-lg font-medium">Data Migration in Progress</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
                Please wait while we migrate your data from Profit Maker to Victure PharmEase
              </p>
              <Progress value={progress} className="w-full" />
              <p className="mt-2 text-sm">{progress}% Complete</p>
            </div>
          </div>
        );
        
      case 'complete':
        return (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Migration Complete!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
                Your data has been successfully migrated from Profit Maker to Victure PharmEase
              </p>
              <div className="w-full max-w-md bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-500 dark:text-gray-400">Items imported:</div>
                  <div className="font-medium">152</div>
                  <div className="text-gray-500 dark:text-gray-400">Patients imported:</div>
                  <div className="font-medium">87</div>
                  <div className="text-gray-500 dark:text-gray-400">Bills imported:</div>
                  <div className="font-medium">213</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button onClick={() => setCurrentStep('upload')}>
                Start New Migration
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Data Migration</CardTitle>
        <CardDescription>
          Import your data from Profit Maker or other pharmacy management systems
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading && currentStep !== 'process' && (
          <div className="mb-4">
            <Progress value={progress} className="w-full" />
          </div>
        )}
        
        {renderStep()}
        
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="help">
            <AccordionTrigger>Need help with migration?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p>
                  If you need assistance with migrating your data from Profit Maker to Victure PharmEase, 
                  our support team is available to help you through the process.
                </p>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <p className="text-sm">
                    <strong>Important:</strong> Before migration, make sure to backup your Profit Maker data. 
                    This process will not affect your original data in Profit Maker.
                  </p>
                </div>
                <Button variant="outline" className="mt-2">
                  Contact Support
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
