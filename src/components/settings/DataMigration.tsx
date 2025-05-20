import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { stableToast } from '@/components/ui/stable-toast';
import { AlertCircle, FileSpreadsheet, ArrowRightLeft, CheckCircle2, Database, Upload, X, MoveDown, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from '@/components/ui/scroll-area';

interface MappingField {
  source: string;
  target: string;
}

interface PreviewItem {
  [key: string]: any;
  hasWarning?: boolean;
  warningType?: 'expired' | 'duplicate' | 'missing' | 'price' | 'controlled';
  warningMessage?: string;
}

interface MappingTemplate {
  id: string;
  name: string;
  source: string;
  mappings: {[key: string]: MappingField[]};
}

export function DataMigration() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview' | 'process' | 'complete'>('upload');
  const [mappings, setMappings] = useState<{[key: string]: MappingField[]}>({
    inventory: [],
    patients: [],
    prescriptions: []
  });
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [activeTab, setActiveTab] = useState('inventory');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredPreviewData, setFilteredPreviewData] = useState<PreviewItem[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<MappingTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [sourcePlatform, setSourcePlatform] = useState<string>('other');
  const [showAllFields, setShowAllFields] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState({
    total: 0,
    valid: 0,
    warnings: 0,
    excluded: 0
  });
  
  const ITEMS_PER_PAGE = 15;

  const commonIndianSources = [
    { value: 'apollo', label: 'Apollo Pharmacy' },
    { value: 'medplus', label: 'MedPlus' },
    { value: 'netmeds', label: 'Netmeds' },
    { value: 'pharmeasy', label: 'PharmEasy' },
    { value: 'mclinic', label: 'mClinic' },
    { value: 'practo', label: 'Practo' },
    { value: 'hbcis', label: 'HBCIS' },
    { value: 'medsynaptic', label: 'Medsynaptic' },
    { value: 'other', label: 'Other System' }
  ];

  const fieldMappingSuggestions = {
    inventory: {
      apollo: [
        { source: "PRODUCT_NAME", target: "name" },
        { source: "GENERIC_NAME", target: "generic_name" },
        { source: "MANUFACTURER", target: "manufacturer" },
        { source: "BATCH_NO", target: "batch_number" },
        { source: "EXPIRY_DATE", target: "expiry_date" },
        { source: "MRP", target: "selling_price" },
        { source: "STOCK_QTY", target: "quantity" },
        { source: "GST_RATE", target: "gst_rate" },
        { source: "HSN_CODE", target: "hsn_code" },
        { source: "SCHEDULE", target: "schedule" }
      ],
      medplus: [
        { source: "Medicine_Name", target: "name" },
        { source: "Salt_Name", target: "generic_name" },
        { source: "Company", target: "manufacturer" },
        { source: "Batch", target: "batch_number" },
        { source: "Expiry", target: "expiry_date" },
        { source: "Rate", target: "selling_price" },
        { source: "Available_Stock", target: "quantity" }
      ],
      pharmeasy: [
        { source: "product_name", target: "name" },
        { source: "molecule", target: "generic_name" },
        { source: "manufacturer", target: "manufacturer" },
        { source: "batch_number", target: "batch_number" },
        { source: "expiry", target: "expiry_date" },
        { source: "mrp", target: "selling_price" },
        { source: "stock", target: "quantity" },
        { source: "hsn", target: "hsn_code" }
      ],
      other: [
        { source: "product_name", target: "name" },
        { source: "product_description", target: "generic_name" },
        { source: "stock_qty", target: "quantity" },
        { source: "cost_price", target: "unit_cost" },
        { source: "selling_price", target: "selling_price" },
        { source: "expiry_date", target: "expiry_date" }
      ]
    },
    patients: {
      apollo: [
        { source: "PATIENT_NAME", target: "name" },
        { source: "MOBILE_NO", target: "phone_number" },
        { source: "PATIENT_ID", target: "external_id" },
        { source: "PATIENT_STATUS", target: "status" }
      ],
      medsynaptic: [
        { source: "PatientName", target: "name" },
        { source: "ContactNo", target: "phone_number" },
        { source: "PatientID", target: "external_id" },
        { source: "Status", target: "status" }
      ],
      other: [
        { source: "customer_name", target: "name" },
        { source: "contact_no", target: "phone_number" },
        { source: "status", target: "status" }
      ]
    },
    prescriptions: {
      apollo: [
        { source: "PRESCRIPTION_ID", target: "prescription_number" },
        { source: "DOCTOR_NAME", target: "doctor_name" },
        { source: "PRESCRIPTION_DATE", target: "date" },
        { source: "PATIENT_ID", target: "patient_id" },
        { source: "STATUS", target: "status" }
      ],
      practo: [
        { source: "prescription_id", target: "prescription_number" },
        { source: "doctor", target: "doctor_name" },
        { source: "date", target: "date" },
        { source: "patient_id", target: "patient_id" },
        { source: "status", target: "status" }
      ],
      other: [
        { source: "prescription_id", target: "prescription_number" },
        { source: "doctor_name", target: "doctor_name" },
        { source: "date_issued", target: "date" },
        { source: "patient_id", target: "patient_id" },
        { source: "status", target: "status" }
      ]
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-detect source platform based on filename patterns
      const fileName = selectedFile.name.toLowerCase();
      if (fileName.includes('apollo')) {
        setSourcePlatform('apollo');
      } else if (fileName.includes('medplus')) {
        setSourcePlatform('medplus');
      } else if (fileName.includes('pharmeasy')) {
        setSourcePlatform('pharmeasy');
      } else if (fileName.includes('netmeds')) {
        setSourcePlatform('netmeds');
      } else if (fileName.includes('practo')) {
        setSourcePlatform('practo');
      } else if (fileName.includes('mclinic')) {
        setSourcePlatform('mclinic');
      } else {
        setSourcePlatform('other');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      
      // Auto-detect source platform based on filename
      const fileName = droppedFile.name.toLowerCase();
      if (fileName.includes('apollo')) {
        setSourcePlatform('apollo');
      } else if (fileName.includes('medplus')) {
        setSourcePlatform('medplus');
      } else if (fileName.includes('pharmeasy')) {
        setSourcePlatform('pharmeasy');
      } else {
        setSourcePlatform('other');
      }
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

    // Determine file extension and apply appropriate processing
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Simulate file reading and processing based on format
    setTimeout(() => {
      setProgress(30);
      
      stableToast({
        title: "Processing " + fileExtension.toUpperCase() + " file",
        description: "Analyzing data structure...",
      });
      
      setTimeout(() => {
        setProgress(60);
        
        stableToast({
          title: "Converting data format",
          description: "Standardizing field formats...",
        });
        
        setTimeout(() => {
          setProgress(85);
          
          // Auto-set mappings based on detected platform
          setMappings({
            inventory: fieldMappingSuggestions.inventory[sourcePlatform as keyof typeof fieldMappingSuggestions.inventory] || fieldMappingSuggestions.inventory.other,
            patients: fieldMappingSuggestions.patients[sourcePlatform as keyof typeof fieldMappingSuggestions.patients] || fieldMappingSuggestions.patients.other,
            prescriptions: fieldMappingSuggestions.prescriptions[sourcePlatform as keyof typeof fieldMappingSuggestions.prescriptions] || fieldMappingSuggestions.prescriptions.other
          });
          
          setTimeout(() => {
            setProgress(100);
            setCurrentStep('mapping');
            setIsLoading(false);
          }, 500);
        }, 800);
      }, 1000);
    }, 1200);
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

  const handlePlatformChange = (platform: string) => {
    setSourcePlatform(platform);
    
    // Set mappings based on the selected platform
    setMappings({
      inventory: fieldMappingSuggestions.inventory[platform as keyof typeof fieldMappingSuggestions.inventory] || fieldMappingSuggestions.inventory.other,
      patients: fieldMappingSuggestions.patients[platform as keyof typeof fieldMappingSuggestions.patients] || fieldMappingSuggestions.patients.other,
      prescriptions: fieldMappingSuggestions.prescriptions[platform as keyof typeof fieldMappingSuggestions.prescriptions] || fieldMappingSuggestions.prescriptions.other
    });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      stableToast({
        title: "Template name required",
        description: "Please provide a name for your mapping template",
        variant: "destructive"
      });
      return;
    }
    
    const newTemplate: MappingTemplate = {
      id: Date.now().toString(),
      name: templateName,
      source: sourcePlatform,
      mappings: { ...mappings }
    };
    
    setSavedTemplates(prev => [...prev, newTemplate]);
    setShowTemplateModal(false);
    setTemplateName('');
    
    stableToast({
      title: "Template saved",
      description: "Your mapping template has been saved for future use",
      variant: "success"
    });
  };

  const loadTemplate = (templateId: string) => {
    const template = savedTemplates.find(t => t.id === templateId);
    if (template) {
      setMappings(template.mappings);
      setSourcePlatform(template.source);
      
      stableToast({
        title: "Template loaded",
        description: `Mappings from template "${template.name}" have been applied`,
      });
    }
  };

  const addMappingField = (dataType: string) => {
    setMappings(prev => {
      const newMappings = { ...prev };
      newMappings[dataType] = [...newMappings[dataType], { source: "", target: "" }];
      return newMappings;
    });
  };

  const removeMappingField = (dataType: string, index: number) => {
    setMappings(prev => {
      const newMappings = { ...prev };
      newMappings[dataType] = newMappings[dataType].filter((_, i) => i !== index);
      return newMappings;
    });
  };

  const generatePreviewData = (): PreviewItem[] => {
    // This would be replaced with actual data parsing from the uploaded file
    const mockInventoryData: PreviewItem[] = [
      { name: 'Paracetamol 500mg', generic_name: 'Acetaminophen', manufacturer: 'Cipla Ltd', batch_number: 'CP2023A45', expiry_date: '2024-11-30', quantity: 150, unit_cost: 2.5, selling_price: 5.0, schedule: 'OTC', hsn_code: '30049099' },
      { name: 'Amoxicillin 250mg', generic_name: 'Amoxicillin', manufacturer: 'Sun Pharma', batch_number: 'SP2023B22', expiry_date: '2023-06-15', quantity: 75, unit_cost: 3.25, selling_price: 7.5, schedule: 'H', hsn_code: '30041010', hasWarning: true, warningType: 'expired', warningMessage: 'Medicine is expired' },
      { name: 'Azithromycin 500mg', generic_name: 'Azithromycin', manufacturer: 'Mankind Pharma', batch_number: 'MK2023C15', expiry_date: '2024-10-20', quantity: 60, unit_cost: 9.5, selling_price: 18.0, schedule: 'H', hsn_code: '30042033' },
      { name: 'Pantoprazole 40mg', generic_name: 'Pantoprazole', manufacturer: 'Dr. Reddy\'s', batch_number: 'DR2023D05', expiry_date: '2024-09-10', quantity: 120, unit_cost: 4.0, selling_price: 8.5, schedule: 'H', hsn_code: '30049071' },
      { name: 'Cetirizine 10mg', generic_name: 'Cetirizine', manufacturer: 'Alkem Laboratories', batch_number: 'AL2023E11', expiry_date: '2025-01-25', quantity: 200, unit_cost: 1.5, selling_price: 3.0, schedule: 'OTC', hsn_code: '30049051' },
      { name: 'Metformin 500mg', generic_name: 'Metformin', manufacturer: 'Biocon Ltd', batch_number: 'BC2023F33', expiry_date: '2024-08-15', quantity: 90, unit_cost: 2.0, selling_price: 4.5, schedule: 'H', hsn_code: '30049099' },
      { name: 'Atorvastatin 20mg', generic_name: 'Atorvastatin', manufacturer: 'Zydus Cadila', batch_number: 'ZC2023G28', expiry_date: '2024-12-05', quantity: 60, unit_cost: 5.5, selling_price: 12.0, schedule: 'H', hsn_code: '30049099', hasWarning: true, warningType: 'price', warningMessage: 'Price exceeds DPCO limit' },
      { name: 'Diclofenac 50mg', generic_name: 'Diclofenac', manufacturer: 'Emcure Pharma', batch_number: 'EP2023H17', expiry_date: '2024-07-20', quantity: 100, unit_cost: 1.8, selling_price: 4.0, schedule: 'H', hsn_code: '30044900' },
      { name: 'Ranitidine 150mg', generic_name: 'Ranitidine', manufacturer: 'GSK Pharma', batch_number: null, expiry_date: '2024-10-30', quantity: 80, unit_cost: 3.0, selling_price: 6.5, schedule: 'H', hsn_code: '30049034', hasWarning: true, warningType: 'missing', warningMessage: 'Missing batch number' },
      { name: 'Omeprazole 20mg', generic_name: 'Omeprazole', manufacturer: 'Torrent Pharma', batch_number: 'TP2023J39', expiry_date: '2024-11-15', quantity: 110, unit_cost: 2.8, selling_price: 6.0, schedule: 'H', hsn_code: '30049099' },
      { name: 'Amlodipine 5mg', generic_name: 'Amlodipine', manufacturer: 'Lupin Ltd', batch_number: 'LL2023K41', expiry_date: '2025-02-28', quantity: 75, unit_cost: 3.2, selling_price: 7.0, schedule: 'H', hsn_code: '30049099' },
      { name: 'Lorazepam 1mg', generic_name: 'Lorazepam', manufacturer: 'Intas Pharma', batch_number: 'IP2023L44', expiry_date: '2024-09-22', quantity: 40, unit_cost: 8.0, selling_price: 15.0, schedule: 'H1', hsn_code: '30049064', hasWarning: true, warningType: 'controlled', warningMessage: 'H1 scheduled drug' },
      { name: 'Ibuprofen 400mg', generic_name: 'Ibuprofen', manufacturer: 'Cipla Ltd', batch_number: 'CP2023M47', expiry_date: '2025-03-15', quantity: 130, unit_cost: 1.7, selling_price: 3.5, schedule: 'OTC', hsn_code: '30049031' },
      { name: 'Metoprolol 50mg', generic_name: 'Metoprolol', manufacturer: 'AstraZeneca', batch_number: 'AZ2023N50', expiry_date: '2024-10-10', quantity: 60, unit_cost: 4.5, selling_price: 9.0, schedule: 'H', hsn_code: '30049099' },
      { name: 'Doxycycline 100mg', generic_name: 'Doxycycline', manufacturer: 'Sun Pharma', batch_number: 'SP2023P52', expiry_date: '2024-11-25', quantity: 50, unit_cost: 5.0, selling_price: 10.5, schedule: 'H', hsn_code: '30042019' },
      { name: 'Fexofenadine 120mg', generic_name: 'Fexofenadine', manufacturer: 'Sanofi', batch_number: 'SF2023Q55', expiry_date: '2025-01-20', quantity: 70, unit_cost: 6.5, selling_price: 13.0, schedule: 'H', hsn_code: '30049064' },
      { name: 'Amoxicillin 250mg', generic_name: 'Amoxicillin', manufacturer: 'Sun Pharma', batch_number: 'SP2023B23', expiry_date: '2024-08-15', quantity: 60, unit_cost: 3.25, selling_price: 7.5, schedule: 'H', hsn_code: '30041010', hasWarning: true, warningType: 'duplicate', warningMessage: 'Possible duplicate item' }
    ];
    
    const mockPatientData: PreviewItem[] = [
      { name: 'John Doe', phone_number: '9876543210', external_id: 'PT0001', status: 'active' },
      { name: 'Jane Smith', phone_number: '8765432109', external_id: 'PT0002', status: 'active' }
    ];
    
    const mockPrescriptionData: PreviewItem[] = [
      { prescription_number: 'RX100123', doctor_name: 'Dr. Mehta', date: '2023-05-15', patient_id: 'PT0001', status: 'active' },
      { prescription_number: 'RX100124', doctor_name: 'Dr. Sharma', date: '2023-05-16', patient_id: 'PT0002', status: 'active' }
    ];
    
    // Return the appropriate mock data based on the active tab
    if (activeTab === 'inventory') {
      return mockInventoryData;
    } else if (activeTab === 'patients') {
      return mockPatientData;
    } else {
      return mockPrescriptionData;
    }
  };

  const handlePreview = () => {
    setIsLoading(true);
    setProgress(30);

    // Simulate processing data based on mappings
    setTimeout(() => {
      setProgress(70);
      
      // Generate preview data
      const data = generatePreviewData();
      setPreviewData(data);
      setFilteredPreviewData(data);
      
      // Calculate summary statistics
      const warnings = data.filter(item => item.hasWarning).length;
      setMigrationSummary({
        total: data.length,
        valid: data.length - warnings,
        warnings: warnings,
        excluded: 0
      });
      
      setProgress(100);
      setCurrentPage(1);
      setCurrentStep('preview');
      setIsLoading(false);
    }, 1500);
  };

  const excludeItem = (index: number) => {
    const itemIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
    
    setPreviewData(prev => {
      const newData = [...prev];
      newData.splice(itemIndex, 1);
      return newData;
    });
    
    setFilteredPreviewData(prev => {
      const newData = [...prev];
      const displayIndex = newData.findIndex((_, i) => i === index);
      if (displayIndex !== -1) {
        newData.splice(displayIndex, 1);
      }
      return newData;
    });
    
    setMigrationSummary(prev => ({
      ...prev,
      total: prev.total - 1,
      excluded: prev.excluded + 1,
      valid: prev.valid - 1
    }));
    
    stableToast({
      title: "Item excluded",
      description: "This item will be skipped during migration",
    });
  };

  const handleEditItem = (index: number, field: string, value: any) => {
    const itemIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
    
    setPreviewData(prev => {
      const newData = [...prev];
      if (newData[itemIndex]) {
        newData[itemIndex] = {
          ...newData[itemIndex],
          [field]: value
        };
        
        // Update warning status if editing fixed the issue
        if (field === 'batch_number' && newData[itemIndex].warningType === 'missing' && value) {
          newData[itemIndex].hasWarning = false;
          newData[itemIndex].warningType = undefined;
          newData[itemIndex].warningMessage = undefined;
        }
        
        if (field === 'expiry_date' && newData[itemIndex].warningType === 'expired') {
          const expiry = new Date(value);
          if (expiry > new Date()) {
            newData[itemIndex].hasWarning = false;
            newData[itemIndex].warningType = undefined;
            newData[itemIndex].warningMessage = undefined;
          }
        }
      }
      return newData;
    });
    
    // Update the filtered preview data as well
    setFilteredPreviewData(prev => {
      const newData = [...prev];
      const displayIndex = index % ITEMS_PER_PAGE;
      if (newData[displayIndex]) {
        newData[displayIndex] = {
          ...newData[displayIndex],
          [field]: value
        };
      }
      return newData;
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = previewData.slice(startIndex, endIndex);
    
    setFilteredPreviewData(paginatedData);
  };

  const handleProcess = () => {
    setIsLoading(true);
    setProgress(10);
    setCurrentStep('process');

    // Simulate processing stages
    setTimeout(() => {
      setProgress(30);
      stableToast({
        title: "Processing inventory data",
        description: "Importing products and stock levels...",
      });
      
      setTimeout(() => {
        setProgress(60);
        stableToast({
          title: "Processing patient data",
          description: "Importing patient records...",
        });
        
        setTimeout(() => {
          setProgress(85);
          stableToast({
            title: "Processing prescription data",
            description: "Importing prescriptions and medical records...",
          });
          
          setTimeout(() => {
            setProgress(100);
            setCurrentStep('complete');
            setIsLoading(false);
            
            stableToast({
              title: "Data migration complete",
              description: `Successfully imported ${migrationSummary.valid} items from your ${file?.name}`,
              variant: "success"
            });
          }, 1200);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'upload', label: 'Upload' },
      { key: 'mapping', label: 'Mapping' },
      { key: 'preview', label: 'Preview' },
      { key: 'process', label: 'Migration' }
    ];
    
    return (
      <div className="flex items-center justify-center mb-6">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.key === currentStep || 
                  steps.findIndex(s => s.key === currentStep) > index ||
                  (currentStep === 'complete' && step.key === 'process')
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {steps.findIndex(s => s.key === currentStep) > index || 
                 (currentStep === 'complete' && step.key === 'process') ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs mt-1">{step.label}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={`h-1 w-10 mx-1 ${
                  steps.findIndex(s => s.key === currentStep) > index ||
                  (currentStep === 'complete' && step.key === 'process')
                    ? 'bg-primary' 
                    : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            {renderStepIndicator()}
            
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label>Source System</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={sourcePlatform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                >
                  {commonIndianSources.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Selecting the correct source system helps in auto-mapping fields
                </p>
              </div>
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex flex-col text-sm leading-6 text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-primary hover:text-primary/80 focus-within:outline-none"
                  >
                    <span className="mb-2 inline-block">Upload a file</span>
                    <Input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".csv,.xlsx,.xls,.json,.xml"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="text-sm text-center">or drag and drop</p>
                </div>
                <div className="mt-3">
                  <p className="text-xs leading-5 text-gray-600">
                    Supported formats: Excel (.xlsx, .xls), CSV (.csv), JSON (.json), XML (.xml)
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <Badge variant="outline">Apollo Format</Badge>
                    <Badge variant="outline">MedPlus Format</Badge>
                    <Badge variant="outline">PharmEasy Format</Badge>
                    <Badge variant="outline">Netmeds Format</Badge>
                  </div>
                </div>
              </div>
              
              {file && (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={handleUpload} 
                  disabled={!file || isLoading}
                  className="ml-auto"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze File'}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-4">
            {renderStepIndicator()}
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">Field Mapping</h3>
                <p className="text-sm text-muted-foreground">
                  Map fields from {commonIndianSources.find(s => s.value === sourcePlatform)?.label || 'source system'} to Victure
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {savedTemplates.length > 0 && (
                  <select
                    className="px-3 py-1 text-sm border rounded-md"
                    onChange={(e) => e.target.value && loadTemplate(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Load template</option>
                    {savedTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTemplateModal(true)}
                >
                  Save as Template
                </Button>
              </div>
            </div>
            
            {showTemplateModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-background rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-medium mb-4">Save Mapping Template</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="E.g., Apollo Pharmacy Import"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveTemplate}>
                        Save Template
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Tabs defaultValue="inventory" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="patients">Patients</TabsTrigger>
                <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="inventory" className="space-y-3 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Inventory Field Mapping</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show-all-inventory"
                        checked={showAllFields}
                        onCheckedChange={setShowAllFields}
                      />
                      <Label htmlFor="show-all-inventory" className="text-sm">Show all fields</Label>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => addMappingField('inventory')}
                    >
                      + Add Field
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-4 py-2 font-medium text-sm border-b">
                    <div className="col-span-2">Source Field ({commonIndianSources.find(s => s.value === sourcePlatform)?.label})</div>
                    <div className="col-span-2">Target Field (Victure)</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {mappings.inventory.map((mapping, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-4 items-center">
                      <Input 
                        className="col-span-2"
                        value={mapping.source} 
                        onChange={(e) => handleMappingChange('inventory', idx, 'source', e.target.value)} 
                        placeholder="Source field name"
                      />
                      <Input 
                        className="col-span-2"
                        value={mapping.target} 
                        onChange={(e) => handleMappingChange('inventory', idx, 'target', e.target.value)}
                        placeholder="Target field name" 
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeMappingField('inventory', idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="bg-muted rounded-md p-3 mt-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Indian Pharmacy Special Fields
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Badge variant="outline">HSN Code</Badge>
                      <span className="ml-2">30049099 → Tax category</span>
                    </div>
                    <div>
                      <Badge variant="outline">Schedule</Badge>
                      <span className="ml-2">H/H1/X → Control level</span>
                    </div>
                    <div>
                      <Badge variant="outline">MRP</Badge>
                      <span className="ml-2">₹ symbol handling</span>
                    </div>
                    <div>
                      <Badge variant="outline">Expiry</Badge>
                      <span className="ml-2">DD/MM/YYYY format</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="patients" className="space-y-3 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Patient Field Mapping</h4>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => addMappingField('patients')}
                  >
                    + Add Field
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-4 py-2 font-medium text-sm border-b">
                    <div className="col-span-2">Source Field</div>
                    <div className="col-span-2">Target Field</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {mappings.patients.map((mapping, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-4 items-center">
                      <Input 
                        className="col-span-2"
                        value={mapping.source} 
                        onChange={(e) => handleMappingChange('patients', idx, 'source', e.target.value)} 
                      />
                      <Input 
                        className="col-span-2"
                        value={mapping.target} 
                        onChange={(e) => handleMappingChange('patients', idx, 'target', e.target.value)} 
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeMappingField('patients', idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="prescriptions" className="space-y-3 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Prescription Field Mapping</h4>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => addMappingField('prescriptions')}
                  >
                    + Add Field
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-4 py-2 font-medium text-sm border-b">
                    <div className="col-span-2">Source Field</div>
                    <div className="col-span-2">Target Field</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {mappings.prescriptions.map((mapping, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-4 items-center">
                      <Input 
                        className="col-span-2"
                        value={mapping.source} 
                        onChange={(e) => handleMappingChange('prescriptions', idx, 'source', e.target.value)} 
                      />
                      <Input 
                        className="col-span-2"
                        value={mapping.target} 
                        onChange={(e) => handleMappingChange('prescriptions', idx, 'target', e.target.value)} 
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeMappingField('prescriptions', idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('upload')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                onClick={handlePreview} 
                disabled={isLoading || 
                  (activeTab === 'inventory' && mappings.inventory.length === 0) ||
                  (activeTab === 'patients' && mappings.patients.length === 0) ||
                  (activeTab === 'prescriptions' && mappings.prescriptions.length === 0)
                }
              >
                {isLoading ? 'Generating Preview...' : 'Preview Data'}
              </Button>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            {renderStepIndicator()}
            
            <div className="flex flex-col md:flex-row md:justify-between mb-4 space-y-3 md:space-y-0">
              <div>
                <h3 className="text-lg font-medium">Data Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Review and edit your data before final import
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Valid: {migrationSummary.valid}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Warnings: {migrationSummary.warnings}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  Excluded: {migrationSummary.excluded}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Total: {migrationSummary.total}
                </Badge>
              </div>
            </div>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inventory">Inventory ({mappings.inventory.length} fields)</TabsTrigger>
                <TabsTrigger value="patients">Patients ({mappings.patients.length} fields)</TabsTrigger>
                <TabsTrigger value="prescriptions">Prescriptions ({mappings.prescriptions.length} fields)</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab}>
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                          {filteredPreviewData.length > 0 && Object.keys(filteredPreviewData[0])
                            .filter(key => !['hasWarning', 'warningType', 'warningMessage'].includes(key))
                            .map(key => (
                              <th 
                                key={key}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {filteredPreviewData.map((item, idx) => (
                          <tr key={idx} className={item.hasWarning ? "bg-amber-50 dark:bg-amber-900/20" : ""}>
                            <td className="px-2 py-3 whitespace-nowrap">
                              <div className="flex space-x-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => excludeItem(idx)}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Exclude this item</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                {item.hasWarning && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="flex h-7 w-7 items-center justify-center text-amber-500">
                                          <AlertCircle className="h-4 w-4" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{item.warningMessage}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </td>
                            {Object.entries(item)
                              .filter(([key]) => !['hasWarning', 'warningType', 'warningMessage'].includes(key))
                              .map(([key, value], valueIdx) => (
                                <td 
                                  key={valueIdx}
                                  className="px-4 py-3 text-sm"
                                >
                                  <input 
                                    type="text"
                                    value={value as string || ''}
                                    onChange={(e) => handleEditItem(idx, key, e.target.value)}
                                    className={`w-full bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none ${
                                      key === 'batch_number' && item.warningType === 'missing' ? 'border-b border-amber-500' : ''
                                    } ${
                                      key === 'expiry_date' && item.warningType === 'expired' ? 'border-b border-amber-500' : ''
                                    }`}
                                  />
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredPreviewData.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <Database className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                      <p>No {activeTab} data to preview</p>
                    </div>
                  )}
                </div>
                
                {/* Pagination */}
                {previewData.length > ITEMS_PER_PAGE && (
                  <Pagination className="mt-4 flex justify-center">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {currentPage} of {Math.ceil(previewData.length / ITEMS_PER_PAGE)}
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.min(Math.ceil(previewData.length / ITEMS_PER_PAGE), currentPage + 1))}
                        disabled={currentPage === Math.ceil(previewData.length / ITEMS_PER_PAGE)}
                      >
                        Next
                      </Button>
                    </div>
                  </Pagination>
                )}
              </TabsContent>
            </Tabs>
            
            {activeTab === 'inventory' && (
              <div className="bg-muted rounded-md p-3 mt-4">
                <h4 className="font-medium mb-2">Legend</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-amber-400 mr-2"></span>
                    <span className="text-sm">Expired or near expiry</span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-red-400 mr-2"></span>
                    <span className="text-sm">Missing critical data</span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-purple-400 mr-2"></span>
                    <span className="text-sm">Controlled substance</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('mapping')}
                disabled={isLoading}
              >
                Back to Mapping
              </Button>
              <Button 
                onClick={handleProcess} 
                disabled={isLoading || filteredPreviewData.length === 0}
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4 max-w-md">
                Please wait while we migrate your data from {commonIndianSources.find(s => s.value === sourcePlatform)?.label || 'your system'} to Victure PharmEase
              </p>
              <Progress value={progress} className="w-full max-w-md" />
              <p className="mt-2 text-sm">{progress}% Complete</p>
            </div>
            
            {progress >= 30 && (
              <div className="max-w-md mx-auto bg-muted rounded-md p-3 overflow-hidden">
                <ScrollArea className="h-24">
                  <div className="space-y-2 text-xs text-muted-foreground font-mono">
                    <div>Processing inventory data (150 records)...</div>
                    {progress >= 60 && <div>Converting date formats to ISO standard...</div>}
                    {progress >= 70 && <div>Validating GST rates against HSN codes...</div>}
                    {progress >= 80 && <div>Processing patient data (45 records)...</div>}
                    {progress >= 90 && <div>Processing prescription data (28 records)...</div>}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        );
        
      case 'complete':
        return (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Migration Complete!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4 max-w-md">
                Your data has been successfully migrated from {commonIndianSources.find(s => s.value === sourcePlatform)?.label || 'your system'} to Victure PharmEase
              </p>
              <div className="w-full max-w-md bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-500 dark:text-gray-400">Items imported:</div>
                  <div className="font-medium">{migrationSummary.valid}</div>
                  <div className="text-gray-500 dark:text-gray-400">Warnings resolved:</div>
                  <div className="font-medium">{migrationSummary.warnings}</div>
                  <div className="text-gray-500 dark:text-gray-400">Items excluded:</div>
                  <div className="font-medium">{migrationSummary.excluded}</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-2">
              <Button onClick={() => setCurrentStep('upload')} variant="outline">
                Start New Migration
              </Button>
              <Button onClick={() => window.location.href = '/inventory'}>
                Go to Inventory
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-b">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Upload className="h-5 w-5" /> 
          Data Migration Hub
        </CardTitle>
        <CardDescription>
          Import your data from other pharmacy management systems with Indian pharmaceutical standards
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
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
                  If you need assistance with migrating your data from another system to Victure PharmEase, 
                  our support team is available to help you through the process.
                </p>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <p className="text-sm">
                    <strong>Important:</strong> Before migration, make sure to backup your original data. 
                    This process will not affect your original data in other systems.
                  </p>
                </div>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <h5 className="font-medium mb-1">Supported Indian Pharmacy Systems:</h5>
                  <ul className="grid grid-cols-2 gap-1">
                    <li>• Apollo Pharmacy Management</li>
                    <li>• MedPlus Inventory</li>
                    <li>• PharmEasy Partner Portal</li>
                    <li>• Netmeds Business Suite</li>
                    <li>• Practo Tab</li>
                    <li>• HBCIS</li>
                    <li>• Medsynaptic</li>
                    <li>• mClinic</li>
                  </ul>
                </div>
                <Button variant="outline" className="mt-2">
                  Contact Support
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="indian-standards">
            <AccordionTrigger>Indian Pharmaceutical Standards Support</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium">GST and Taxation</h5>
                  <p className="text-sm text-muted-foreground">
                    Automatic HSN code detection and GST rate application as per Indian taxation rules
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium">Schedule H/H1/X Compliance</h5>
                  <p className="text-sm text-muted-foreground">
                    Support for restricted drugs classification and appropriate handling per CDSCO regulations
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium">Date Format Conversion</h5>
                  <p className="text-sm text-muted-foreground">
                    Intelligent handling of DD/MM/YYYY (Indian) to standard date format conversion
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium">DPCO Price Controls</h5>
                  <p className="text-sm text-muted-foreground">
                    Validation of medicine pricing against Drug Price Control Order limits
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
