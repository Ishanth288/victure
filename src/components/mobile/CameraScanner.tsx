
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Edit3, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera } from '@capacitor/camera';

interface ScannedData {
  name: string;
  generic_name?: string;
  manufacturer?: string;
  batch_number?: string;
  expiry_date?: string;
  quantity: number;
  unit_cost: number;
  selling_price: number;
  strength?: string;
  category?: string;
}

interface CameraScannerProps {
  onScanComplete: (data: ScannedData) => void;
  onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onScanComplete, onClose }) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData>({
    name: '',
    generic_name: '',
    manufacturer: '',
    batch_number: '',
    expiry_date: '',
    quantity: 1,
    unit_cost: 0,
    selling_price: 0,
    strength: '',
    category: ''
  });
  const [capturedImage, setCapturedImage] = useState<string>('');

  const handleTakePhoto = async () => {
    try {
      setIsScanning(true);
      
      if (Capacitor.isNativePlatform()) {
        // Use native camera on mobile
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: 'base64',
          source: 'camera'
        });
        
        if (image.base64String) {
          setCapturedImage(`data:image/jpeg;base64,${image.base64String}`);
          await processImage(image.base64String);
        }
      } else {
        // Fallback for web - simulate scanning
        simulateScanning();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Error",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const processImage = async (base64Image: string) => {
    try {
      // Simulate AI processing with mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData: ScannedData = {
        name: 'Paracetamol',
        generic_name: 'Acetaminophen',
        manufacturer: 'Generic Pharma',
        batch_number: 'BATCH123',
        expiry_date: '2025-12-31',
        quantity: 10,
        unit_cost: 5.50,
        selling_price: 8.00,
        strength: '500mg',
        category: 'Analgesic'
      };
      
      setScannedData(mockData);
      setShowReviewScreen(true);
      
      toast({
        title: "Success",
        description: "Medicine details extracted successfully!",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const simulateScanning = () => {
    // Simulate scanning process for web
    setTimeout(() => {
      const mockData: ScannedData = {
        name: 'Sample Medicine',
        generic_name: 'Generic Name',
        manufacturer: 'Sample Pharma',
        batch_number: 'BATCH456',
        expiry_date: '2025-06-30',
        quantity: 5,
        unit_cost: 10.00,
        selling_price: 15.00,
        strength: '250mg',
        category: 'Antibiotic'
      };
      
      setScannedData(mockData);
      setShowReviewScreen(true);
      
      toast({
        title: "Demo Mode",
        description: "Sample data loaded for demonstration",
      });
    }, 2000);
  };

  const handleConfirm = () => {
    onScanComplete(scannedData);
  };

  const handleRetake = () => {
    setShowReviewScreen(false);
    setCapturedImage('');
    setScannedData({
      name: '',
      generic_name: '',
      manufacturer: '',
      batch_number: '',
      expiry_date: '',
      quantity: 1,
      unit_cost: 0,
      selling_price: 0,
      strength: '',
      category: ''
    });
  };

  if (showReviewScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-teal-800">Review & Edit</h1>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Captured Image Preview */}
          {capturedImage && (
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <img 
                  src={capturedImage} 
                  alt="Captured medicine" 
                  className="w-full h-32 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {/* Editable Form */}
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-teal-800">
                <Edit3 className="w-5 h-5 mr-2" />
                Medicine Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name *</Label>
                <Input
                  id="name"
                  value={scannedData.name}
                  onChange={(e) => setScannedData({...scannedData, name: e.target.value})}
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="generic_name">Generic Name</Label>
                <Input
                  id="generic_name"
                  value={scannedData.generic_name}
                  onChange={(e) => setScannedData({...scannedData, generic_name: e.target.value})}
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={scannedData.manufacturer}
                  onChange={(e) => setScannedData({...scannedData, manufacturer: e.target.value})}
                  className="rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="batch_number">Batch Number</Label>
                  <Input
                    id="batch_number"
                    value={scannedData.batch_number}
                    onChange={(e) => setScannedData({...scannedData, batch_number: e.target.value})}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={scannedData.expiry_date}
                    onChange={(e) => setScannedData({...scannedData, expiry_date: e.target.value})}
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={scannedData.quantity}
                    onChange={(e) => setScannedData({...scannedData, quantity: parseInt(e.target.value) || 0})}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Cost (₹)</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    value={scannedData.unit_cost}
                    onChange={(e) => setScannedData({...scannedData, unit_cost: parseFloat(e.target.value) || 0})}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selling_price">Price (₹)</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    value={scannedData.selling_price}
                    onChange={(e) => setScannedData({...scannedData, selling_price: parseFloat(e.target.value) || 0})}
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="strength">Strength</Label>
                  <Input
                    id="strength"
                    value={scannedData.strength}
                    onChange={(e) => setScannedData({...scannedData, strength: e.target.value})}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={scannedData.category}
                    onChange={(e) => setScannedData({...scannedData, category: e.target.value})}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleRetake}
              variant="outline"
              className="border-teal-200 text-teal-700 hover:bg-teal-50 rounded-lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white rounded-lg"
              disabled={!scannedData.name}
            >
              <Check className="w-4 h-4 mr-2" />
              Add to Inventory
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-teal-800">Scan Medicine</h1>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scanner Interface */}
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center space-y-6">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-teal-500 to-green-500 rounded-full flex items-center justify-center">
                <Camera className="w-16 h-16 text-white" />
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Capture Medicine Package
                </h2>
                <p className="text-gray-600 text-sm">
                  Position the medicine package clearly in view and tap to capture
                </p>
              </div>

              <Button
                onClick={handleTakePhoto}
                disabled={isScanning}
                className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white py-3 rounded-xl"
              >
                {isScanning ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Capture Medicine
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Scanning Tips:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Ensure good lighting conditions</li>
              <li>• Keep the medicine package flat and stable</li>
              <li>• Make sure text is clearly visible</li>
              <li>• Avoid shadows and reflections</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CameraScanner;
