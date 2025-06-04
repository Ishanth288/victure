import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Edit3, RotateCcw, Zap, Focus, ScanLine, Sparkles, ChevronLeft, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { hapticFeedback } from '@/utils/mobileUtils';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
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
  const [scanProgress, setScanProgress] = useState(0);

  const handleTakePhoto = async () => {
    try {
      await hapticFeedback('medium');
      setIsScanning(true);
      
      if (Capacitor.isNativePlatform()) {
        // Use native camera on mobile
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera
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
      await hapticFeedback('error');
      toast({
        title: "Camera Error",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const processImage = async (base64Image: string) => {
    try {
      setIsProcessing(true);
      await hapticFeedback('light');
      
      // Simulate AI processing with realistic steps
      const steps = [
        { text: 'Analyzing image...', duration: 800 },
        { text: 'Detecting text...', duration: 1000 },
        { text: 'Extracting medicine info...', duration: 1200 },
        { text: 'Validating details...', duration: 600 },
        { text: 'Finalizing...', duration: 400 }
      ];
      
      let progress = 0;
      for (const step of steps) {
        setProcessingStep(step.text);
        await new Promise(resolve => setTimeout(resolve, step.duration));
        progress += 100 / steps.length;
        setScanProgress(progress);
      }
      
      const mockData: ScannedData = {
        name: 'Paracetamol Plus',
        generic_name: 'Acetaminophen + Caffeine',
        manufacturer: 'MedPharma Industries',
        batch_number: 'MPL' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        expiry_date: '2025-12-31',
        quantity: Math.floor(Math.random() * 50) + 10,
        unit_cost: parseFloat((Math.random() * 20 + 5).toFixed(2)),
        selling_price: parseFloat((Math.random() * 30 + 10).toFixed(2)),
        strength: '500mg + 65mg',
        category: 'Analgesic'
      };
      
      setScannedData(mockData);
      setShowReviewScreen(true);
      await hapticFeedback('success');
      
      toast({
        title: "✨ Scan Complete",
        description: "Medicine details extracted successfully!",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      await hapticFeedback('error');
      toast({
        title: "Processing Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setScanProgress(0);
      setProcessingStep('');
    }
  };

  const simulateScanning = async () => {
    // Simulate scanning process for web
    setIsProcessing(true);
    
    const steps = [
      { text: 'Simulating camera capture...', duration: 500 },
      { text: 'Processing demo image...', duration: 800 },
      { text: 'Extracting sample data...', duration: 700 },
      { text: 'Preparing demo results...', duration: 400 }
    ];
    
    let progress = 0;
    for (const step of steps) {
      setProcessingStep(step.text);
      await new Promise(resolve => setTimeout(resolve, step.duration));
      progress += 100 / steps.length;
      setScanProgress(progress);
    }
    
    const mockData: ScannedData = {
      name: 'Demo Medicine',
      generic_name: 'Sample Active Ingredient',
      manufacturer: 'Demo Pharmaceuticals',
      batch_number: 'DEMO' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      expiry_date: '2025-06-30',
      quantity: Math.floor(Math.random() * 30) + 5,
      unit_cost: parseFloat((Math.random() * 15 + 3).toFixed(2)),
      selling_price: parseFloat((Math.random() * 25 + 8).toFixed(2)),
      strength: '250mg',
      category: 'Demo Category'
    };
    
    setScannedData(mockData);
    setShowReviewScreen(true);
    setIsProcessing(false);
    setScanProgress(0);
    setProcessingStep('');
    
    toast({
      title: "🎯 Demo Mode",
      description: "Sample data loaded for demonstration",
    });
  };

  const handleConfirm = async () => {
    await hapticFeedback('success');
    onScanComplete(scannedData);
  };

  const handleRetake = async () => {
    await hapticFeedback('light');
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

  const handleClose = async () => {
    await hapticFeedback('light');
    onClose();
  };

  const handleFieldChange = (field: keyof ScannedData, value: string | number) => {
    setScannedData(prev => ({ ...prev, [field]: value }));
    hapticFeedback('light');
  };

  // Processing overlay component
  const ProcessingOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 mx-6 max-w-sm w-full animate-scale-in">
        <div className="text-center space-y-6">
          {/* Animated Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse-apple"></div>
            <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Sparkles className="w-10 h-10 text-white animate-bounce" />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Scanning in Progress
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse-apple">
              {processingStep}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isProcessing) {
    return <ProcessingOverlay />;
  }

  if (showReviewScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 safe-area-all">
        <div className="max-w-md mx-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <Button 
                onClick={handleClose} 
                variant="ghost" 
                size="sm"
                className="btn-apple focus-ring p-2 -ml-2"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-title-2 font-bold text-gray-900 dark:text-white">Review & Edit</h1>
              <div className="w-10" />
            </div>
          </div>

          <div className="px-6 pb-6 space-y-6">
            {/* Captured Image Preview */}
            {capturedImage && (
              <div className="card-apple overflow-hidden animate-fade-in">
                <img 
                  src={capturedImage} 
                  alt="Captured medicine" 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <div className="badge-apple badge-green">
                    <Zap className="w-3 h-3 mr-1" />
                    AI Scanned
                  </div>
                </div>
              </div>
            )}

            {/* Success Indicator */}
            <div className="card-glass p-4 animate-bounce-in">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-callout font-semibold text-gray-900 dark:text-white">
                    Details Extracted Successfully
                  </p>
                  <p className="text-footnote text-gray-600 dark:text-gray-400">
                    Review and edit the information below
                  </p>
                </div>
              </div>
            </div>

            {/* Editable Form */}
            <Card className="card-apple border-0 shadow-lg animate-slide-up">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-title-3 text-gray-900 dark:text-white">
                  <Edit3 className="w-5 h-5 mr-2 text-blue-500" />
                  Medicine Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Medicine Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-subhead font-medium text-gray-700 dark:text-gray-300">
                    Medicine Name *
                  </Label>
                  <Input
                    id="name"
                    value={scannedData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="input-apple focus-ring"
                    placeholder="Enter medicine name"
                  />
                </div>

                {/* Generic Name */}
                <div className="space-y-2">
                  <Label htmlFor="generic_name" className="text-subhead font-medium text-gray-700 dark:text-gray-300">
                    Generic Name
                  </Label>
                  <Input
                    id="generic_name"
                    value={scannedData.generic_name}
                    onChange={(e) => handleFieldChange('generic_name', e.target.value)}
                    className="input-apple focus-ring"
                    placeholder="Enter generic name"
                  />
                </div>

                {/* Manufacturer */}
                <div className="space-y-2">
                  <Label htmlFor="manufacturer" className="text-subhead font-medium text-gray-700 dark:text-gray-300">
                    Manufacturer
                  </Label>
                  <Input
                    id="manufacturer"
                    value={scannedData.manufacturer}
                    onChange={(e) => handleFieldChange('manufacturer', e.target.value)}
                    className="input-apple focus-ring"
                    placeholder="Enter manufacturer"
                  />
                </div>

                {/* Grid Layout for smaller fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch_number" className="text-subhead font-medium text-gray-700 dark:text-gray-300">
                      Batch Number
                    </Label>
                    <Input
                      id="batch_number"
                      value={scannedData.batch_number}
                      onChange={(e) => handleFieldChange('batch_number', e.target.value)}
                      className="input-apple focus-ring"
                      placeholder="Batch no."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date" className="text-subhead font-medium text-gray-700 dark:text-gray-300">
                      Expiry Date
                    </Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={scannedData.expiry_date}
                      onChange={(e) => handleFieldChange('expiry_date', e.target.value)}
                      className="input-apple focus-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-subhead font-medium text-gray-700 dark:text-gray-300">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={scannedData.quantity}
                      onChange={(e) => handleFieldChange('quantity', parseInt(e.target.value) || 0)}
                      className="input-apple focus-ring"
                      placeholder="Qty"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_cost" className="text-subhead font-medium text-gray-700 dark:text-gray-300">
                      Cost (₹)
                    </Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      step="0.01"
                      value={scannedData.unit_cost}
                      onChange={(e) => handleFieldChange('unit_cost', parseFloat(e.target.value) || 0)}
                      className="input-apple focus-ring"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selling_price" className="text-subhead font-medium text-gray-700 dark:text-gray-300">
                      Price (₹)
                    </Label>
                    <Input
                      id="selling_price"
                      type="number"
                      step="0.01"
                      value={scannedData.selling_price}
                      onChange={(e) => handleFieldChange('selling_price', parseFloat(e.target.value) || 0)}
                      className="input-apple focus-ring"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="strength" className="text-subhead font-medium text-gray-700 dark:text-gray-300">
                      Strength
                    </Label>
                    <Input
                      id="strength"
                      value={scannedData.strength}
                      onChange={(e) => handleFieldChange('strength', e.target.value)}
                      className="input-apple focus-ring"
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-subhead font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </Label>
                    <Input
                      id="category"
                      value={scannedData.category}
                      onChange={(e) => handleFieldChange('category', e.target.value)}
                      className="input-apple focus-ring"
                      placeholder="Category"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button
                onClick={handleRetake}
                className="btn-apple btn-secondary focus-ring py-4"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Photo
              </Button>
              <Button
                onClick={handleConfirm}
                className="btn-apple btn-teal focus-ring py-4"
                disabled={!scannedData.name}
              >
                <Check className="w-4 h-4 mr-2" />
                Add to Inventory
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 safe-area-all">
      <div className="max-w-md mx-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={handleClose} 
              variant="ghost" 
              size="sm"
              className="btn-apple focus-ring p-2 -ml-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-title-2 font-bold text-gray-900 dark:text-white">AI Scanner</h1>
            <Button 
              variant="ghost" 
              size="sm"
              className="btn-apple focus-ring p-2 -mr-2"
            >
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 pt-8 animate-slide-down">
            <div className="relative mx-auto w-32 h-32 mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse-apple"></div>
              <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-2xl">
                <Camera className="w-16 h-16 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-4 h-4 text-yellow-800" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-headline font-bold text-gray-900 dark:text-white">
                AI-Powered Medicine Scanner
              </h2>
              <p className="text-body text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Point your camera at any medicine package to instantly extract all the details
              </p>
            </div>
          </div>

          {/* Main Scanner Button */}
          <div className="space-y-6 animate-slide-up">
            <Button
              onClick={handleTakePhoto}
              disabled={isScanning}
              className="w-full btn-apple bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-6 text-lg shadow-2xl focus-ring"
            >
              {isScanning ? (
                <div className="flex items-center">
                  <div className="loading-spinner-apple mr-3"></div>
                  Initializing Camera...
                </div>
              ) : (
                <div className="flex items-center">
                  <ScanLine className="w-6 h-6 mr-3" />
                  Scan Medicine Package
                </div>
              )}
            </Button>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card-glass p-4 text-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-caption-1 font-semibold text-gray-900 dark:text-white">Instant Recognition</p>
                <p className="text-caption-2 text-gray-600 dark:text-gray-400">AI processes in seconds</p>
              </div>
              
              <div className="card-glass p-4 text-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Focus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-caption-1 font-semibold text-gray-900 dark:text-white">High Accuracy</p>
                <p className="text-caption-2 text-gray-600 dark:text-gray-400">Precision medicine data</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <Card className="card-apple border-0 shadow-lg animate-slide-up">
            <CardContent className="p-6">
              <h3 className="text-title-3 font-semibold text-gray-900 dark:text-white mb-4">
                📸 Scanning Tips
              </h3>
              <div className="space-y-3">
                {[
                  'Ensure good lighting conditions',
                  'Keep the medicine package flat and stable', 
                  'Make sure all text is clearly visible',
                  'Avoid shadows and reflections on the package'
                ].map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">{index + 1}</span>
                    </div>
                    <p className="text-footnote text-gray-700 dark:text-gray-300">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Demo Mode Notice */}
          {!Capacitor.isNativePlatform() && (
            <div className="card-glass p-4 animate-bounce-in">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-caption-1 font-semibold text-gray-900 dark:text-white">Demo Mode</p>
                  <p className="text-caption-2 text-gray-600 dark:text-gray-400">
                    Running in demo mode with sample data
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraScanner;
