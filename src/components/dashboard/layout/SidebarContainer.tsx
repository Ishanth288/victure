
import React, { useEffect, useState } from "react";
import { SidebarLinks } from "@/components/dashboard/SidebarLinks";
import { cn } from "@/lib/utils";
import { useProfileData } from "@/components/dashboard/ProfileSection";
import { ChevronLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { format, differenceInDays } from "date-fns";

export function SidebarContainer() {
  const { profileData } = useProfileData();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(0);
  const [maintenanceNotice, setMaintenanceNotice] = useState<string | null>(null);
  const [maintenanceDate, setMaintenanceDate] = useState<Date | null>(null);
  
  // Check for notifications
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        // Check for maintenance notices
        const { data, error } = await supabase
          .from('system_settings')
          .select('maintenance_mode, maintenance_start_date, maintenance_announcement, maintenance_announced_at')
          .eq('id', 1)
          .single();
        
        if (error) throw error;
        
        let notificationCount = 0;
        
        // Check if there's upcoming maintenance
        if (data && data.maintenance_start_date) {
          const now = new Date();
          const startDate = new Date(data.maintenance_start_date);
          setMaintenanceDate(startDate);
          
          // Calculate days difference
          const diffDays = differenceInDays(startDate, now);
          
          // Set notification if within 7 days or if there's a new announcement
          if ((diffDays <= 7 && diffDays >= 0) || data.maintenance_announcement) {
            notificationCount++;
            setMaintenanceNotice(
              data.maintenance_announcement || 
              `Scheduled maintenance on ${format(startDate, "PPP")} at ${format(startDate, "p")}`
            );
          }
        }
        
        setNotifications(notificationCount);
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };
    
    checkNotifications();
    
    // Check every 5 minutes
    const interval = setInterval(checkNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="w-60 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-y-auto">
      <div className="flex flex-col h-full p-3">
        <div className="mb-4 flex items-center justify-between pl-2">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate(-1)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-medium text-primary truncate">
              {profileData?.pharmacy_name || 'Medplus'}
            </h2>
          </div>
          
          {notifications > 0 && (
            <Popover>
              <PopoverTrigger>
                <div className="relative cursor-pointer">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {notifications}
                  </Badge>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Notifications</h4>
                  {maintenanceNotice && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                      <p className="font-medium text-yellow-800">Scheduled Maintenance</p>
                      <p className="text-yellow-700 mt-1">{maintenanceNotice}</p>
                      {maintenanceDate && (
                        <p className="text-xs text-yellow-600 mt-2">
                          {format(maintenanceDate, "PPP 'at' p")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarLinks />
        </div>
      </div>
    </div>
  );
}
