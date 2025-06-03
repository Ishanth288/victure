import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, Flashlight, RotateCcw, CheckCircle, AlertCircle, Scan } from 'lucide-react';
import Quagga from 'quagga';
import { createWorker } from 'tesseract.js';

// Types for medicine scanning
interface ScannedMedicine {
  id?: string;
  name: string;
  manufacturer?: string;
  batchNumber?: string;
  expiryDate?: string;
  mrp?: number;
  composition?: string;
  strength?: string;
  packSize?: string;
  barcode?: string;
  confidence: number;
  source: 'barcode' | 'ocr' | 'manual';
}

interface CameraScannerProps {
  onClose: () => void;
  onMedicineDetected: (medicine: ScannedMedicine) => void;
  existingMedicines?: any[];
}

const INDIAN_MANUFACTURERS = [
  'Sun Pharma', 'Cipla', 'Dr. Reddy\'s', 'Lupin', 'Aurobindo', 'Cadila', 'Alkem',
  'Torrent', 'Abbott', 'GSK', 'Pfizer', 'Novartis', 'Sanofi', 'Mankind',
  'Hetero', 'Glenmark', 'Intas', 'Emcure', 'Wockhardt', 'Elder'
];

const MEDICINE_PATTERNS = {
  batchNumber: /(?:BATCH|B\.NO|LOT|MFG)[:\s]*([A-Z0-9]+)/i,
  expiryDate: /(?:EXP|EXPIRY)[:\s]*((?:0[1-9]|1[0-2])\/(?:20)?[0-9]{2}|(?:0[1-9]|1[0-2])-(?:20)?[0-9]{2})/i,
  mrp: /(?:MRP|PRICE)[:\s]*(?:RS\.?|₹)\s*([0-9]+(?:\.[0-9]{2})?)/i,
  composition: /(?:COMPOSITION|COMP)[:\s]*([A-Za-z\s]+(?:\d+(?:mg|mcg|g|ml))?)/i,
  strength: /(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|%))/gi
};

const CameraScanner: React.FC<CameraScannerProps> = ({
  onClose,
  onMedicineDetected,
  existingMedicines = []
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [detectedMedicine, setDetectedMedicine] = useState<ScannedMedicine | null>(null);
  const [scanningMode, setScanningMode] = useState<'barcode' | 'text'>('barcode');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startScanning = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(() => {
      if (scanningMode === 'barcode') {
        scanBarcode();
      } else {
        performOCR();
      }
    }, 1000);
  };

  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: 'continuous' }] as any[]
        }
      };      
      if (flashEnabled) {
        constraints.video.advanced.push({ torch: true } as any);
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        startScanning(); // moved startScanning AFTER its definition
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      console.error('Camera initialization error:', err);
    }
  }, [cameraFacing]);

  const simulateBarcodeScanning = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const mockBarcodeResult = await simulateBarcodeScanning();

      const barcodeResult = await mockBarcodeResult;
      if (barcodeResult) {
        const medicine = await lookupMedicineByBarcode(barcodeResult.code);
        if (medicine) {
          setDetectedMedicine(medicine);
          stopScanning();
        }
      }
    } catch (error) {
      console.error('Barcode scanning error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const performOCR = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const text = await performTextRecognition(blob);
          if (text) {
            const medicine = extractMedicineInfo(text);
            if (medicine && medicine.confidence > 0.6) {
              setDetectedMedicine(medicine);
              stopScanning();
            }
          }
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('OCR error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const scanBarcode = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      Quagga.decodeSingle({
        src: canvas.toDataURL('image/jpeg'),
        numOfWorkers: 0,
        locate: true,
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader"]
        }
      }, async (result) => {
        if (result && result.code) {
          const medicine = await lookupMedicineByBarcode(result.code);
          if (medicine) {
            setDetectedMedicine(medicine);
            stopScanning();
          }
        } else {
          console.log("No barcode detected.");
        }
        setIsProcessing(false);
      });
    } catch (error) {
      console.error('Barcode scanning error:', error);
      setIsProcessing(false);
    }
  };

  const performTextRecognition = async (imageBlob: Blob): Promise<string | null> => {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(imageBlob);
    await worker.terminate();
    return text;
  };

  const lookupMedicineByBarcode = async (barcode: string): Promise<ScannedMedicine | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const found = existingMedicines.find(med => med.barcode === barcode);
    if (found) {
      return { ...found, confidence: 0.95, source: 'barcode' };
    }
    const mockData: { [key: string]: ScannedMedicine } = {
      '8901024017007': { name: 'Paracetamol 500mg', manufacturer: 'Cipla', barcode: '8901024017007', confidence: 0.95, source: 'barcode' },
      '8901024017014': { name: 'Amoxicillin 250mg', manufacturer: 'Sun Pharma', barcode: '8901024017014', confidence: 0.95, source: 'barcode' },
      '8901024017021': { name: 'Ibuprofen 400mg', manufacturer: 'Dr. Reddy\'s', barcode: '8901024017021', confidence: 0.95, source: 'barcode' },
    };
    return mockData[barcode] || null;
  };

  const extractMedicineInfo = (text: string): ScannedMedicine | null => {
    const nameMatch = text.match(/^([A-Z0-9\s]+?)(?:\s\d+MG|\s\d+ML|\s\d+%|\sBATCH|\sLOT|\sEXP|\sMRP|\sPRICE|$)/i);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown Medicine';

    const batchNumberMatch = text.match(MEDICINE_PATTERNS.batchNumber);
    const expiryDateMatch = text.match(MEDICINE_PATTERNS.expiryDate);
    const mrpMatch = text.match(MEDICINE_PATTERNS.mrp);
    const compositionMatch = text.match(MEDICINE_PATTERNS.composition);
    const strengthMatch = text.match(MEDICINE_PATTERNS.strength);

    let manufacturer: string | undefined;
    for (const manf of INDIAN_MANUFACTURERS) {
      if (text.toLowerCase().includes(manf.toLowerCase())) {
        manufacturer = manf;
        break;
      }
    }

    return {
      name,
      manufacturer,
      batchNumber: batchNumberMatch?.[1],
      expiryDate: expiryDateMatch?.[1],
      mrp: mrpMatch ? parseFloat(mrpMatch[1]) : undefined,
      composition: compositionMatch?.[1],
      strength: strengthMatch?.[0],
      confidence: 0.7,
      source: 'ocr'
    };
  };

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    initializeCamera();
    return () => {
      stopScanning();
    };
  }, [initializeCamera, stopScanning]);

  const toggleFlash = async () => {
    if (videoRef.current && streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashEnabled } as MediaTrackConstraintSet]
          } as MediaTrackConstraints);
          setFlashEnabled(!flashEnabled);
        } catch (err) {
          console.error('Flashlight toggle failed:', err);
          alert('Flashlight not supported or failed to toggle.');
        }
      }
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing(prev => (prev === 'user' ? 'environment' : 'user'));
    stopScanning();
  };

  const handleConfirmDetection = () => {
    if (detectedMedicine) {
      onMedicineDetected(detectedMedicine);
      onClose();
    }
  };

  const handleRetake = () => {
    setDetectedMedicine(null);
    initializeCamera();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-md flex items-center space-x-2 z-50">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        <div className="relative w-full max-w-md aspect-video bg-gray-800 rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      <div className="absolute top-4 right-4">
        <button onClick={onClose} className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600">
          <X size={24} />
        </button>
      </div>

      <div className="absolute bottom-4 w-full max-w-md flex justify-around items-center p-4">
        <button
          onClick={toggleFlash}
          className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Toggle Flash"
        >
          {flashEnabled ? <Flashlight size={28} /> : <Flashlight size={28} />}
        </button>
        <button
          onClick={toggleCameraFacing}
          className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Switch Camera"
        >
          <RotateCcw size={28} />
        </button>
        <button
          onClick={() => setScanningMode(prev => (prev === 'barcode' ? 'text' : 'barcode'))}
          className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Toggle Scan Mode"
        >
          {scanningMode === 'barcode' ? 'Text' : 'Barcode'}
        </button>
      </div>

      {detectedMedicine && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Medicine Detected!</h2>
            <p className="text-gray-700 text-lg font-semibold">{detectedMedicine.name}</p>
            {detectedMedicine.manufacturer && <p className="text-gray-600 text-sm">{detectedMedicine.manufacturer}</p>}
            {detectedMedicine.strength && <p className="text-gray-600 text-sm">Strength: {detectedMedicine.strength}</p>}
            {detectedMedicine.batchNumber && <p className="text-gray-600 text-sm">Batch: {detectedMedicine.batchNumber}</p>}
            {detectedMedicine.expiryDate && <p className="text-gray-600 text-sm">Expiry: {detectedMedicine.expiryDate}</p>}
            {detectedMedicine.mrp && <p className="text-gray-600 text-sm">MRP: ₹{detectedMedicine.mrp.toFixed(2)}</p>}
            {detectedMedicine.barcode && <p className="text-gray-600 text-sm">Barcode: {detectedMedicine.barcode}</p>}
            <p className="text-gray-500 text-xs mt-2">Source: {detectedMedicine.source} (Confidence: {(detectedMedicine.confidence * 100).toFixed(0)}%)</p>

            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={handleRetake}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Retake
              </button>
              <button
                onClick={handleConfirmDetection}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CameraScanner;
