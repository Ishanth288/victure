
import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { NotificationList } from "./NotificationList";
import { fetchNotifications, Notification } from "@/utils/notificationUtils";
import { useToast } from "@/hooks/use-toast";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchNotifications();
      if (error) {
        console.error('Error fetching notifications:', error);
      } else if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error in notification component:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications on first render
  useEffect(() => {
    loadNotifications();
  }, []);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel('notification-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications'
        }, 
        (payload) => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative p-2" 
          aria-label="Open notifications"
          onClick={() => setIsOpen(true)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 min-w-[18px] h-5 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[380px] max-h-[500px] p-0" 
        align="end"
      >
        <NotificationList 
          notifications={notifications}
          isLoading={isLoading}
          onNotificationRead={() => {
            loadNotifications();
          }}
          onRefresh={loadNotifications}
        />
      </PopoverContent>
    </Popover>
  );
}
