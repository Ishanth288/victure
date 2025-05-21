
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, differenceInHours, differenceInMinutes, format } from "date-fns";
import { AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MaintenanceNotification() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [showNotification, setShowNotification] = useState(true);
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [timeUntilMaintenance, setTimeUntilMaintenance] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [permanentlyDismissed, setPermanentlyDismissed] = useState(false);
  const [maintenanceId, setMaintenanceId] = useState<string | null>(null);

  // Generate a unique persistent dismissal key
  const getDismissalKey = (userId: string | null, notificationId: string | null) => {
    if (userId && notificationId) {
      return `maintenance-dismissed-${userId}-${notificationId}`;
    } else if (userId) {
      return `maintenance-dismissed-${userId}`;
    } else if (notificationId) {
      return `maintenance-dismissed-notification-${notificationId}`;
    }
    return 'maintenance-permanently-dismissed';
  };

  useEffect(() => {
    // Check if this notification was previously permanently dismissed
    const checkDismissalStatus = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        const userId = user?.id || null;
        const dismissedKey = getDismissalKey(userId, maintenanceId);
        
        // Check local storage for dismissal status
        const isDismissed = localStorage.getItem(dismissedKey) === 'true';
        
        setPermanentlyDismissed(isDismissed);
        setShowNotification(!isDismissed);
      } catch (error) {
        console.error("Error checking dismissal status:", error);
      }
    };

    checkDismissalStatus();

    const fetchMaintenanceStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('maintenance_mode, maintenance_message, maintenance_start_date, maintenance_end_date, maintenance_announcement, id')
          .eq('id', 1)
          .single();

        if (error) throw error;

        if (data) {
          setMaintenanceId(data.id?.toString() || null);
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
    
    // Set up an interval to check maintenance status every minute, but only if not dismissed
    const interval = setInterval(fetchMaintenanceStatus, 60000);
    
    return () => clearInterval(interval);
  }, [maintenanceId]);

  // If there's no maintenance (current or upcoming), don't show anything
  if (!maintenanceMode && !isUpcoming) {
    return null;
  }

  // If the user has dismissed the notification, don't show it
  if (permanentlyDismissed || !showNotification) {
    return null;
  }

  const handleDismiss = async () => {
    // Add smooth exit animation
    setShowNotification(false);
    setPermanentlyDismissed(true);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      
      // Generate dismissal key and store in localStorage
      const dismissedKey = getDismissalKey(userId, maintenanceId);
      localStorage.setItem(dismissedKey, 'true');
      
      // If this is a specific maintenance, also set a general flag to prevent similar notices
      if (userId && maintenanceId) {
        localStorage.setItem(`maintenance-type-dismissed-${userId}`, 'true');
      }
    } catch (error) {
      console.error("Error handling notification dismissal:", error);
      // Even if there's an error, keep the local dismissal
    }
    
    // Dispatch custom event for other components to react to dismissal
    window.dispatchEvent(new CustomEvent('maintenance-notification-dismissed'));
  };

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Alert 
            variant={maintenanceMode ? "error" : "warning"} 
            className={`mb-4 relative shadow-lg border ${
              maintenanceMode 
                ? "bg-red-50 text-red-800 border-red-200" 
                : "bg-yellow-50 text-yellow-800 border-yellow-200"
            } rounded-lg z-10`}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
