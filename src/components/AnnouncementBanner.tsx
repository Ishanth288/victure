
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/database";

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching announcements:", error);
          return;
        }

        if (data) {
          // Cast the data to the correct type
          setAnnouncements(data as unknown as Announcement[]);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    fetchAnnouncements();
    
    // Set up interval to check for new announcements every 5 minutes
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Get the current announcement (if any) and not dismissed
  const currentAnnouncement = announcements.length > 0 && currentAnnouncementIndex < announcements.length
    ? announcements[currentAnnouncementIndex]
    : null;

  if (!currentAnnouncement || dismissedAnnouncements.has(currentAnnouncement.id)) {
    return null;
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string): "success" | "default" | "warning" | "info" | "error" => {
    return type === 'error' ? "error" : 
           type === 'success' ? "success" :
           type === 'warning' ? "warning" :
           type === 'info' ? "info" : "default";
  };

  const handleDismiss = () => {
    setDismissedAnnouncements(prev => {
      const newSet = new Set(prev);
      newSet.add(currentAnnouncement.id);
      return newSet;
    });
    
    if (currentAnnouncementIndex < announcements.length - 1) {
      setCurrentAnnouncementIndex(currentAnnouncementIndex + 1);
    }
  };

  return (
    <Alert 
      variant={getAlertVariant(currentAnnouncement.type)} 
      className="mb-4 animate-fadeIn"
    >
      {getAlertIcon(currentAnnouncement.type)}
      <div className="flex-1">
        <AlertTitle>
          {currentAnnouncement.title}
        </AlertTitle>
        <AlertDescription>
          {currentAnnouncement.message}
        </AlertDescription>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6" 
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    </Alert>
  );
}
