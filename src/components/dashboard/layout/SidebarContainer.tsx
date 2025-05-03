
import React, { useState, useEffect } from "react";
import { SidebarLinks } from "@/components/dashboard/SidebarLinks";
import { ChevronLeft, Bell, Home, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { format, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export function SidebarContainer() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(0);
  const [maintenanceNotice, setMaintenanceNotice] = useState<string | null>(null);
  const [maintenanceDate, setMaintenanceDate] = useState<Date | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [dismissedNotices, setDismissedNotices] = useState<string[]>([]);
  
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
        
        if (error) {
          console.error("Failed to check maintenance status:", error);
          return;
        }
        
        let notificationCount = 0;
        
        // Check if there's upcoming maintenance
        if (data && data.maintenance_start_date) {
          const now = new Date();
          const startDate = new Date(data.maintenance_start_date);
          setMaintenanceDate(startDate);
          
          // Calculate days difference
          const diffDays = differenceInDays(startDate, now);
          
          // Set notification if within 7 days or if there's a new announcement
          const noticeId = `maintenance-${data.maintenance_start_date}`;
          
          if ((diffDays <= 7 && diffDays >= 0) || data.maintenance_announcement) {
            if (!dismissedNotices.includes(noticeId)) {
              notificationCount++;
              setMaintenanceNotice(
                data.maintenance_announcement || 
                `Scheduled maintenance on ${format(startDate, "PPP")} at ${format(startDate, "p")}`
              );
            }
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
  }, [dismissedNotices]);

  const dismissNotification = (noticeId: string) => {
    // Store the dismissed notifications in state
    setDismissedNotices(prev => [...prev, noticeId]);
    
    // Decrease notification count
    if (notifications > 0) {
      setNotifications(prev => prev - 1);
    }
    
    // If notification popup is open, close it
    if (isPopoverOpen) {
      setIsPopoverOpen(false);
    }
  };
  
  return (
    <div className="w-64 h-screen bg-[#15202b] text-white border-r border-gray-800 flex-shrink-0 overflow-y-auto">
      <div className="flex flex-col h-full p-3">
        <div className="mb-8 pt-3 pl-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-primary-light" />
              <h2 className="text-xl font-bold text-white">
                Victure
              </h2>
            </div>
            
            {notifications > 0 && (
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button 
                    className="relative cursor-pointer p-1 rounded-full hover:bg-gray-700"
                    aria-label={`${notifications} notifications`}
                  >
                    <Bell className="h-5 w-5 text-gray-300" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs shadow-sm"
                    >
                      {notifications}
                    </Badge>
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 p-0 shadow-xl border border-gray-200 bg-white rounded-lg z-50" 
                  align="end" 
                  sideOffset={5}
                >
                  <div className="p-1">
                    <div className="flex items-center justify-between border-b border-gray-100 p-3">
                      <h4 className="font-medium text-gray-900">Notifications</h4>
                      {notifications > 0 && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                          {notifications} new
                        </Badge>
                      )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto py-1">
                      {maintenanceNotice && (
                        <div className="p-3 m-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm relative">
                          <button 
                            onClick={() => dismissNotification(`maintenance-${maintenanceDate?.toISOString()}`)}
                            className="absolute top-2 right-2 text-yellow-700 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-100"
                            aria-label="Dismiss notification"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <p className="font-medium text-yellow-800 pr-6">Scheduled Maintenance</p>
                          <p className="text-yellow-700 mt-1">{maintenanceNotice}</p>
                          {maintenanceDate && (
                            <p className="text-xs text-yellow-600 mt-2">
                              {format(maintenanceDate, "PPP 'at' p")}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {notifications === 0 && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No new notifications
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          
          <div className="mt-6 border-b border-gray-700 pb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-2">
              Victure Healthcare Solutions
            </h3>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <SidebarLinks />
        </div>
      </div>
    </div>
  );
}
