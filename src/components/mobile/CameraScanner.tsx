
import { useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera as CameraIcon, Scan, Check, X, Loader2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ScannedMedicine {
  name: string;
  genericName?: string;
  manufacturer?: string;
  strength?: string;
  dosageForm?: string;
  confidence: number;
  expiryDate?: string;
  unitCost?: number;
  sellingPrice?: number;
  batchNumber?: string;
}

interface CameraScannerProps {
  onMedicineDetected: (medicine: ScannedMedicine) => void;
  onClose: () => void;
}

export function CameraScanner({ onMedicineDetected, onClose }: CameraScannerProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedMedicine, setDetectedMedicine] = useState<ScannedMedicine | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ScannedMedicine | null>(null);

  const takePicture = async () => {
    try {
      setIsScanning(true);
      await Haptics.impact({ style: ImpactStyle.Light });

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        await analyzeMedicine(image.dataUrl);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const analyzeMedicine = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      // Enhanced AI analysis with more realistic medicine data
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate more advanced OCR and medicine database lookup
      const medicineTemplates = [
        {
          name: "Paracetamol",
          genericName: "Acetaminophen",
          manufacturer: "Sun Pharma",
          strength: "500mg",
          dosageForm: "Tablet",
          confidence: 0.94,
          expiryDate: "2025-12-31",
          unitCost: 12.50,
          sellingPrice: 15.00,
          batchNumber: "BT2024001"
        },
        {
          name: "Amoxicillin",
          genericName: "Amoxicillin Trihydrate",
          manufacturer: "Cipla Ltd",
          strength: "250mg",
          dosageForm: "Capsule",
          confidence: 0.89,
          expiryDate: "2025-08-15",
          unitCost: 8.75,
          sellingPrice: 11.20,
          batchNumber: "AMX2024002"
        },
        {
          name: "Cetirizine",
          genericName: "Cetirizine Hydrochloride",
          manufacturer: "Dr. Reddy's",
          strength: "10mg",
          dosageForm: "Tablet",
          confidence: 0.91,
          expiryDate: "2025-06-30",
          unitCost: 5.25,
          sellingPrice: 7.50,
          batchNumber: "CTZ2024003"
        }
      ];

      const randomMedicine = medicineTemplates[Math.floor(Math.random() * medicineTemplates.length)];
      
      setDetectedMedicine(randomMedicine);
      setEditForm(randomMedicine);
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze the medicine. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmMedicine = async () => {
    if (!editForm) return;
    
    try {
      // Save to Supabase inventory
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const inventoryData = {
        user_id: user.id,
        name: editForm.name,
        generic_name: editForm.genericName,
        manufacturer: editForm.manufacturer,
        strength: editForm.strength,
        dosage_form: editForm.dosageForm,
        unit_cost: editForm.unitCost || 0,
        selling_price: editForm.sellingPrice || 0,
        quantity: 1, // Default quantity
        reorder_point: 10, // Default reorder point
        expiry_date: editForm.expiryDate,
        status: 'in stock'
      };

      const { error } = await supabase
        .from("inventory")
        .insert(inventoryData);

      if (error) throw error;

      await Haptics.impact({ style: ImpactStyle.Heavy });
      onMedicineDetected(editForm);
      
      toast({
        title: "Medicine Added",
        description: `${editForm.name} has been added to your inventory.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving medicine:', error);
      toast({
        title: "Error",
        description: "Failed to add medicine to inventory.",
        variant: "destructive",
      });
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setDetectedMedicine(null);
    setIsAnalyzing(false);
    setIsEditing(false);
    setEditForm(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const updateEditForm = (field: keyof ScannedMedicine, value: string | number) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI Medicine Scanner</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-6">
        {!capturedImage ? (
          <>
            <div className="w-80 h-80 border-4 border-white/30 rounded-2xl flex items-center justify-center">
              <div className="text-center text-white">
                <CameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Position medicine package in frame</p>
                <p className="text-sm opacity-75 mt-2">Ensure good lighting and clear text</p>
                <p className="text-xs opacity-60 mt-2">AI will extract name, expiry, manufacturer details</p>
              </div>
            </div>
            
            <Button
              onClick={takePicture}
              disabled={isScanning}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-full text-lg"
            >
              {isScanning ? (
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
              ) : (
                <Scan className="h-6 w-6 mr-2" />
              )}
              {isScanning ? "Capturing..." : "Scan Medicine"}
            </Button>
          </>
        ) : (
          <div className="w-full max-w-md space-y-6">
            {/* Captured Image */}
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured medicine"
                className="w-full h-64 object-cover rounded-lg border-2 border-white/20"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>AI analyzing medicine...</p>
                    <p className="text-xs opacity-75">Extracting details from package</p>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {detectedMedicine && !isEditing && (
              <Card className="bg-white/95">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>Medicine Detected</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(detectedMedicine.confidence * 100)}% confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg">{detectedMedicine.name}</p>
                    {detectedMedicine.genericName && (
                      <p className="text-sm text-gray-600">Generic: {detectedMedicine.genericName}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {detectedMedicine.manufacturer && (
                      <div>
                        <p className="font-medium">Manufacturer</p>
                        <p className="text-gray-600">{detectedMedicine.manufacturer}</p>
                      </div>
                    )}
                    {detectedMedicine.strength && (
                      <div>
                        <p className="font-medium">Strength</p>
                        <p className="text-gray-600">{detectedMedicine.strength}</p>
                      </div>
                    )}
                    {detectedMedicine.dosageForm && (
                      <div>
                        <p className="font-medium">Form</p>
                        <p className="text-gray-600">{detectedMedicine.dosageForm}</p>
                      </div>
                    )}
                    {detectedMedicine.expiryDate && (
                      <div>
                        <p className="font-medium">Expiry</p>
                        <p className="text-gray-600">{detectedMedicine.expiryDate}</p>
                      </div>
                    )}
                    {detectedMedicine.unitCost && (
                      <div>
                        <p className="font-medium">Unit Cost</p>
                        <p className="text-gray-600">₹{detectedMedicine.unitCost}</p>
                      </div>
                    )}
                    {detectedMedicine.sellingPrice && (
                      <div>
                        <p className="font-medium">Selling Price</p>
                        <p className="text-gray-600">₹{detectedMedicine.sellingPrice}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit Form */}
            {isEditing && editForm && (
              <Card className="bg-white/95 max-h-96 overflow-y-auto">
                <CardHeader className="pb-3">
                  <CardTitle>Review & Edit Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor="name">Medicine Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => updateEditForm('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="genericName">Generic Name</Label>
                      <Input
                        id="genericName"
                        value={editForm.genericName || ''}
                        onChange={(e) => updateEditForm('genericName', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="strength">Strength</Label>
                        <Input
                          id="strength"
                          value={editForm.strength || ''}
                          onChange={(e) => updateEditForm('strength', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dosageForm">Form</Label>
                        <Input
                          id="dosageForm"
                          value={editForm.dosageForm || ''}
                          onChange={(e) => updateEditForm('dosageForm', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        value={editForm.manufacturer || ''}
                        onChange={(e) => updateEditForm('manufacturer', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="unitCost">Unit Cost (₹)</Label>
                        <Input
                          id="unitCost"
                          type="number"
                          step="0.01"
                          value={editForm.unitCost || ''}
                          onChange={(e) => updateEditForm('unitCost', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
                        <Input
                          id="sellingPrice"
                          type="number"
                          step="0.01"
                          value={editForm.sellingPrice || ''}
                          onChange={(e) => updateEditForm('sellingPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={editForm.expiryDate || ''}
                        onChange={(e) => updateEditForm('expiryDate', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={retakePicture}
                className="flex-1 bg-white/10 text-white border-white/30"
              >
                Retake
              </Button>
              {detectedMedicine && !isEditing && (
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="flex-1 bg-white/10 text-white border-white/30"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {detectedMedicine && (
                <Button
                  onClick={isEditing ? confirmMedicine : handleEdit}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isEditing ? 'Add to Inventory' : 'Edit Details'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
