
import React, { useEffect, useState } from "react";
import { SidebarLinks } from "@/components/dashboard/SidebarLinks";
import { cn } from "@/lib/utils";
import { useProfileData } from "@/components/dashboard/ProfileSection";
import { ChevronLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export function SidebarContainer() {
  const { profileData } = useProfileData();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(0);
  
  // Check for notifications
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        // This would typically fetch notifications from a database
        // For now, we'll simulate this with a check for maintenance notices
        const { data, error } = await supabase
          .from('system_settings')
          .select('maintenance_mode, maintenance_start_date')
          .eq('id', 1)
          .single();
        
        if (error) throw error;
        
        if (data && data.maintenance_mode && data.maintenance_start_date) {
          const now = new Date();
          const startDate = new Date(data.maintenance_start_date);
          
          // Calculate days difference
          const diffTime = startDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Set notification if within 7 days
          if (diffDays <= 7 && diffDays > 0) {
            setNotifications(1);
          }
        }
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };
    
    checkNotifications();
    
    // Check every 30 minutes
    const interval = setInterval(checkNotifications, 30 * 60 * 1000);
    
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
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {notifications}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarLinks />
        </div>
      </div>
    </div>
  );
}
