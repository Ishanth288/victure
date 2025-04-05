
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceInfo {
  maintenance_mode: boolean;
  maintenance_message: string;
  maintenance_start_date: string | null;
  maintenance_end_date: string | null;
}

export function MaintenanceNotification() {
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [isImminentMaintenance, setIsImminentMaintenance] = useState(false);
  
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('maintenance_mode, maintenance_message, maintenance_start_date, maintenance_end_date')
          .eq('id', 1)
          .single();
        
        if (error) throw error;
        
        if (data && data.maintenance_mode && data.maintenance_start_date) {
          setMaintenanceInfo(data);
          
          const now = new Date();
          const startDate = new Date(data.maintenance_start_date);
          
          // Calculate days difference
          const diffTime = startDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Show notification if within 7 days
          if (diffDays <= 7 && diffDays > 0) {
            setShowNotification(true);
            
            // Check if maintenance is within 24 hours
            if (diffDays <= 1) {
              setIsImminentMaintenance(true);
            }
          }
        }
      } catch (error) {
        console.error("Error checking maintenance:", error);
      }
    };
    
    checkMaintenance();
    
    // Check every hour
    const interval = setInterval(checkMaintenance, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!showNotification || !maintenanceInfo) {
    return null;
  }
  
  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return (
    <Alert 
      variant={isImminentMaintenance ? "destructive" : "default"}
      className={isImminentMaintenance 
        ? "bg-red-50 border-red-200 text-red-800 mb-4" 
        : "bg-amber-50 border-amber-200 text-amber-800 mb-4"
      }
    >
      <div className="flex items-start gap-3">
        {isImminentMaintenance 
          ? <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          : <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
        }
        <div>
          <AlertTitle className="text-base font-medium">
            {isImminentMaintenance 
              ? "Upcoming Maintenance in Less Than 24 Hours" 
              : "Scheduled Maintenance Notice"
            }
          </AlertTitle>
          <AlertDescription className="mt-1">
            <p className="mb-1">
              {maintenanceInfo.maintenance_message}
            </p>
            <p className="text-sm">
              <strong>Start:</strong> {maintenanceInfo.maintenance_start_date ? formatDateTime(maintenanceInfo.maintenance_start_date) : 'Not specified'}
              <br />
              <strong>End:</strong> {maintenanceInfo.maintenance_end_date ? formatDateTime(maintenanceInfo.maintenance_end_date) : 'Not specified'}
            </p>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
