
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, differenceInHours, differenceInMinutes, format } from "date-fns";
import { AlertCircle, X } from "lucide-react";
import { SystemSettings } from "@/types/database";

export function MaintenanceNotification() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [showNotification, setShowNotification] = useState(true);
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [timeUntilMaintenance, setTimeUntilMaintenance] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('maintenance_mode, maintenance_message, maintenance_start_date, maintenance_end_date, maintenance_announcement')
          .eq('id', 1)
          .single();

        if (error) {
          console.error("Error fetching maintenance status:", error);
          return;
        }

        if (data) {
          const maintenanceStartDate = data.maintenance_start_date ? new Date(data.maintenance_start_date) : null;
          setStartDate(maintenanceStartDate);

          // Set current maintenance mode
          setMaintenanceMode(data.maintenance_mode || false);
          setMaintenanceMessage(data.maintenance_message || "The system is currently undergoing scheduled maintenance. Please try again later.");
          
          // Check if maintenance is upcoming (within 7 days) but not currently active
          if (maintenanceStartDate && !data.maintenance_mode) {
            const now = new Date();
            const daysUntilMaintenance = differenceInDays(maintenanceStartDate, now);
            
            if (daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0) {
              setIsUpcoming(true);
              
              // Calculate time until maintenance
              if (daysUntilMaintenance > 0) {
                setTimeUntilMaintenance(`${daysUntilMaintenance} day${daysUntilMaintenance !== 1 ? 's' : ''}`);
              } else {
                const hoursUntilMaintenance = differenceInHours(maintenanceStartDate, now);
                if (hoursUntilMaintenance > 0) {
                  setTimeUntilMaintenance(`${hoursUntilMaintenance} hour${hoursUntilMaintenance !== 1 ? 's' : ''}`);
                } else {
                  const minutesUntilMaintenance = differenceInMinutes(maintenanceStartDate, now);
                  setTimeUntilMaintenance(`${minutesUntilMaintenance} minute${minutesUntilMaintenance !== 1 ? 's' : ''}`);
                }
              }
            } else {
              setIsUpcoming(false);
            }
          } else {
            setIsUpcoming(false);
          }
        }
      } catch (error) {
        console.error("Error fetching maintenance status:", error);
      }
    };

    fetchMaintenanceStatus();
    
    // Set up an interval to check maintenance status every minute
    const interval = setInterval(fetchMaintenanceStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // If there's no maintenance (current or upcoming), don't show anything
  if (!maintenanceMode && !isUpcoming) {
    return null;
  }

  // If the user has dismissed the notification, don't show it
  if (!showNotification) {
    return null;
  }

  // Handle the close button click
  const handleDismiss = () => {
    setShowNotification(false);
    // Store in localStorage to remember user's preference
    localStorage.setItem('maintenance-dismissed', 'true');
  };

  return (
    <Alert 
      variant={maintenanceMode ? "destructive" : "default"} 
      className={`mb-4 relative shadow-lg border ${
        maintenanceMode 
          ? "bg-red-50 text-red-800 border-red-200" 
          : "bg-yellow-50 text-yellow-800 border-yellow-200"
      } rounded-lg animate-fadeIn z-10`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AlertCircle className="h-4 w-4" />
      <div className="flex-1">
        <AlertTitle className="font-semibold">
          {maintenanceMode 
            ? "System Maintenance" 
            : `Upcoming Maintenance in ${timeUntilMaintenance}`
          }
        </AlertTitle>
        <AlertDescription>
          {maintenanceMode 
            ? maintenanceMessage 
            : startDate 
              ? `The system will be undergoing maintenance on ${format(startDate, "PPP")} at ${format(startDate, "p")}. Please save your work before this time.` 
              : "Scheduled maintenance is upcoming. Please save your work."
          }
        </AlertDescription>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 absolute top-2 right-2 bg-transparent p-1 hover:bg-gray-200 rounded-full text-gray-700"
        onClick={handleDismiss}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    </Alert>
  );
}
