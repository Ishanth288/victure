
import React, { useEffect, useState } from "react";
import { SidebarLinks } from "@/components/dashboard/SidebarLinks";
import { cn } from "@/lib/utils";
import { useProfileData } from "@/components/dashboard/ProfileSection";
import { Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TextSkeleton, PharmacyNameSkeleton } from "@/components/ui/loading-skeleton";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { format, differenceInDays } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  date?: Date;
}

export function SidebarContainer() {
  const { profileData, isLoading: profileLoading } = useProfileData();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(0);
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [pharmacyNameVisible, setPharmacyNameVisible] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  
  // Control pharmacy name visibility with animation
  useEffect(() => {
    if (!profileLoading && profileData?.pharmacy_name) {
      // Add a small delay to ensure a smooth transition
      setTimeout(() => setPharmacyNameVisible(true), 100);
    } else {
      setPharmacyNameVisible(false);
    }
  }, [profileLoading, profileData]);
  
  // Load dismissed notifications from localStorage
  useEffect(() => {
    const loadDismissedNotifications = async () => {
      // Get locally dismissed notifications
      const localDismissed = localStorage.getItem('dismissed-notifications');
      const localDismissedSet = new Set<string>(localDismissed ? JSON.parse(localDismissed) : []);
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check for user-specific dismissed notifications in localStorage
          const userDismissedKeys = Object.keys(localStorage)
            .filter(key => key.startsWith(`user-${user.id}-dismissed-`));
          
          // Add these to our set
          userDismissedKeys.forEach(key => {
            const noticeId = key.replace(`user-${user.id}-dismissed-`, '');
            localDismissedSet.add(noticeId);
          });
        }
      } catch (error) {
        console.error("Error loading dismissed notifications:", error);
      }
      
      // Update the state with our set
      setDismissedIds(localDismissedSet);
    };
    
    loadDismissedNotifications();
  }, []);
  
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
        
        let newNotificationItems: NotificationItem[] = [];
        
        // Check if there's upcoming maintenance
        if (data && data.maintenance_start_date) {
          const now = new Date();
          const startDate = new Date(data.maintenance_start_date);
          
          // Calculate days difference
          const diffDays = differenceInDays(startDate, now);
          
          // Set notification if within 7 days or if there's a new announcement
          const noticeId = `maintenance-${data.maintenance_start_date}`;
          
          if (!dismissedIds.has(noticeId) && 
              ((diffDays <= 7 && diffDays >= 0) || data.maintenance_announcement)) {
            const message = data.maintenance_announcement || 
              `Scheduled maintenance on ${format(startDate, "PPP")} at ${format(startDate, "p")}`;
            
            newNotificationItems.push({
              id: noticeId,
              type: 'maintenance',
              message,
              date: startDate
            });
          }
        }
        
        // Update notifications count and items
        setNotificationItems(newNotificationItems);
        setNotifications(newNotificationItems.length);
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };
    
    checkNotifications();
    
    // Check every 5 minutes
    const interval = setInterval(checkNotifications, 5 * 60 * 1000);
    
    // Set up event listener for notification dismissal
    const handleNotificationDismissal = () => {
      // Reset everything on dismiss from other components
      setDismissedIds(prev => new Set([...prev, 'maintenance-permanently-dismissed']));
      setNotificationItems([]);
      setNotifications(0);
    };
    
    window.addEventListener('maintenance-notification-dismissed', handleNotificationDismissal);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('maintenance-notification-dismissed', handleNotificationDismissal);
    };
  }, [dismissedIds]);

  const dismissNotification = async (noticeId: string) => {
    try {
      // Add to locally dismissed set
      const newDismissedIds = new Set(dismissedIds);
      newDismissedIds.add(noticeId);
      setDismissedIds(newDismissedIds);
      
      // Update localStorage
      localStorage.setItem('dismissed-notifications', JSON.stringify([...newDismissedIds]));
      
      // Try to save to localStorage for cross-session persistence
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        localStorage.setItem(`user-${user.id}-dismissed-${noticeId}`, 'true');
      }
      
      // Remove from current notifications
      setNotificationItems(notificationItems.filter(item => item.id !== noticeId));
      setNotifications(prev => prev - 1);
      
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };
  
  return (
    <div className="w-60 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-y-auto">
      <div className="flex flex-col h-full p-3">
        <div className="mb-4 flex items-center justify-between pl-2">
          <div className="flex items-center space-x-2">
            {profileLoading ? (
              <PharmacyNameSkeleton />
            ) : (
              <motion.h2 
                className="text-xl font-medium text-primary truncate"
                initial={{ opacity: 0 }}
                animate={{ opacity: pharmacyNameVisible ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {profileData?.pharmacy_name || 'My Pharmacy'}
              </motion.h2>
            )}
          </div>
          
          {notifications > 0 && (
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="relative cursor-pointer p-1 rounded-full hover:bg-gray-100"
                  aria-label={`${notifications} notifications`}
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs shadow-sm"
                  >
                    {notifications}
                  </Badge>
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-0 shadow-xl border border-gray-200 bg-white rounded-lg" 
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
                    <AnimatePresence>
                      {notificationItems.map((item) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="p-3 m-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm relative"
                        >
                          <button 
                            onClick={() => dismissNotification(item.id)}
                            className="absolute top-2 right-2 text-yellow-700 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-100"
                            aria-label="Dismiss notification"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <p className="font-medium text-yellow-800 pr-6">
                            {item.type === 'maintenance' ? 'Scheduled Maintenance' : 'Notification'}
                          </p>
                          <p className="text-yellow-700 mt-1">{item.message}</p>
                          {item.date && (
                            <p className="text-xs text-yellow-600 mt-2">
                              {format(item.date, "PPP 'at' p")}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
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
        <div className="flex-1 overflow-y-auto">
          <SidebarLinks />
        </div>
      </div>
    </div>
  );
}
