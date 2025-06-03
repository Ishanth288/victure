
import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useToast } from "@/hooks/use-toast";

interface ScannedMedicine {
  name: string;
  genericName?: string;
  manufacturer?: string;
  strength?: string;
  dosageForm?: string;
  confidence: number;
}

export function useMobileScanner() {
  const { toast } = useToast();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isMobileApp = Capacitor.isNativePlatform();

  const openScanner = () => {
    if (!isMobileApp) {
      toast({
        title: "Feature Unavailable",
        description: "Camera scanning is only available in the mobile app.",
        variant: "destructive",
      });
      return;
    }
    setIsScannerOpen(true);
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
  };

  const processMedicine = async (medicine: ScannedMedicine) => {
    setIsProcessing(true);
    try {
      // Here you would typically save to your inventory
      // For now, we'll just show a success message
      toast({
        title: "Medicine Added",
        description: `${medicine.name} has been added to your inventory.`,
      });
      
      closeScanner();
    } catch (error) {
      console.error('Error processing medicine:', error);
      toast({
        title: "Error",
        description: "Failed to add medicine to inventory.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isScannerOpen,
    isProcessing,
    isMobileApp,
    openScanner,
    closeScanner,
    processMedicine,
  };
}
