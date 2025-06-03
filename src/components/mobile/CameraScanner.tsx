
import { useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera as CameraIcon, Scan, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScannedMedicine {
  name: string;
  genericName?: string;
  manufacturer?: string;
  strength?: string;
  dosageForm?: string;
  confidence: number;
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
      // Simulate AI analysis - in real implementation, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock medicine detection result
      const mockResult: ScannedMedicine = {
        name: "Paracetamol",
        genericName: "Acetaminophen",
        manufacturer: "ABC Pharmaceuticals",
        strength: "500mg",
        dosageForm: "Tablet",
        confidence: 0.92
      };

      setDetectedMedicine(mockResult);
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

  const confirmMedicine = () => {
    if (detectedMedicine) {
      onMedicineDetected(detectedMedicine);
      onClose();
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setDetectedMedicine(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scan Medicine</h2>
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
                <p className="text-lg">Position medicine label in frame</p>
                <p className="text-sm opacity-75 mt-2">Ensure good lighting and clear text</p>
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
                    <p>Analyzing medicine...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {detectedMedicine && (
              <Card className="bg-white/95">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>Medicine Detected</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(detectedMedicine.confidence * 100)}% confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-semibold text-lg">{detectedMedicine.name}</p>
                    {detectedMedicine.genericName && (
                      <p className="text-sm text-gray-600">Generic: {detectedMedicine.genericName}</p>
                    )}
                  </div>
                  {detectedMedicine.manufacturer && (
                    <p className="text-sm"><strong>Manufacturer:</strong> {detectedMedicine.manufacturer}</p>
                  )}
                  {detectedMedicine.strength && (
                    <p className="text-sm"><strong>Strength:</strong> {detectedMedicine.strength}</p>
                  )}
                  {detectedMedicine.dosageForm && (
                    <p className="text-sm"><strong>Form:</strong> {detectedMedicine.dosageForm}</p>
                  )}
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
              {detectedMedicine && (
                <Button
                  onClick={confirmMedicine}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Add to Inventory
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
