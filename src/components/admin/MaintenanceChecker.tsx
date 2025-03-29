
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export interface MaintenanceStatus {
  maintenance_mode: boolean;
  maintenance_message: string;
  maintenance_start_date: string;
  maintenance_end_date: string;
}

interface MaintenanceCheckerProps {
  children: React.ReactNode;
  onMaintenance?: (status: boolean) => void;
}

export function MaintenanceChecker({ 
  children,
  onMaintenance 
}: MaintenanceCheckerProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [inMaintenance, setInMaintenance] = useState(false);
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceStatus | null>(null);
  
  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('maintenance_mode, maintenance_message, maintenance_start_date, maintenance_end_date')
        .eq('id', 1)
        .single();

      if (error) {
        console.error("Error checking maintenance status:", error);
        setIsLoading(false);
        return;
      }

      // Check if maintenance mode is active
      if (data && data.maintenance_mode) {
        const now = new Date();
        const startDate = data.maintenance_start_date ? new Date(data.maintenance_start_date) : null;
        const endDate = data.maintenance_end_date ? new Date(data.maintenance_end_date) : null;
        
        // If we're between the start and end dates, or if there are no dates specified
        const isInMaintenancePeriod = 
          !startDate || !endDate || 
          (now >= startDate && now <= endDate);
        
        if (isInMaintenancePeriod) {
          setInMaintenance(true);
          setMaintenanceInfo(data);
          if (onMaintenance) {
            onMaintenance(true);
          }
        }
      }
    } catch (err) {
      console.error("Failed to check maintenance status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Checking system status...</div>;
  }

  if (inMaintenance && maintenanceInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-amber-100 p-3">
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">System Maintenance</h1>
            
            <Alert variant="warning" className="bg-amber-50 text-amber-800 border-amber-200">
              <AlertTitle>Scheduled Maintenance</AlertTitle>
              <AlertDescription>
                {maintenanceInfo.maintenance_message}
              </AlertDescription>
            </Alert>
            
            {maintenanceInfo.maintenance_end_date && (
              <p className="text-sm text-gray-500">
                Expected to be completed by:{' '}
                <span className="font-medium">
                  {new Date(maintenanceInfo.maintenance_end_date).toLocaleString()}
                </span>
              </p>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth')}
              className="mt-4"
            >
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
