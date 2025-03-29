
import React from "react";
import { Check, RefreshCw, Bell, Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Notification, markAllNotificationsAsRead, markNotificationAsRead } from "@/utils/notificationUtils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onNotificationRead: () => void;
  onRefresh: () => void;
}

export function NotificationList({
  notifications,
  isLoading,
  onNotificationRead,
  onRefresh
}: NotificationListProps) {
  const { toast } = useToast();

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await markAllNotificationsAsRead();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to mark notifications as read",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
        onNotificationRead();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await markNotificationAsRead(id);
      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        onNotificationRead();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-sm font-medium">Notifications</h2>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            disabled={isLoading || notifications.filter(n => !n.read).length === 0}
          >
            <Check className="h-4 w-4 mr-1" />
            <span className="text-xs">Mark all as read</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="py-1">
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <div 
                  className={cn(
                    "flex p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer",
                    notification.read ? "opacity-70" : "bg-gray-50 dark:bg-gray-800/50"
                  )}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="mr-3 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <p className={cn(
                        "text-sm",
                        !notification.read && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500">
                        {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {notification.message}
                    </p>
                    {notification.action_link && (
                      <a 
                        href={notification.action_link} 
                        className="text-xs text-primary hover:underline block mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View details
                      </a>
                    )}
                  </div>
                </div>
                <Separator />
              </React.Fragment>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
