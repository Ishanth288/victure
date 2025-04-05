import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceTabProps {
  maintenanceMode: boolean;
  setMaintenanceMode: (value: boolean) => void;
  maintenanceMessage: string;
  setMaintenanceMessage: (value: string) => void;
  maintenanceStartDate: Date | undefined;
  setMaintenanceStartDate: (value: Date | undefined) => void;
  maintenanceEndDate: Date | undefined;
  setMaintenanceEndDate: (value: Date | undefined) => void;
  isLoading: boolean;
  onCancelMaintenance: () => void;
}

export function MaintenanceTab({
  maintenanceMode,
  setMaintenanceMode,
  maintenanceMessage,
  setMaintenanceMessage,
  maintenanceStartDate,
  setMaintenanceStartDate,
  maintenanceEndDate,
  setMaintenanceEndDate,
  isLoading,
  onCancelMaintenance
}: MaintenanceTabProps) {
  const { toast } = useToast();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [announcementMessage, setAnnouncementMessage] = useState(
    "We will be performing scheduled maintenance on " + 
    (maintenanceStartDate ? format(maintenanceStartDate, "PPP") : "")
  );
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  const getFullDateTime = (date: Date | undefined, timeString: string): Date | undefined => {
    if (!date) return undefined;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setMaintenanceStartDate(date);
    if (date) {
      setAnnouncementMessage(
        "We will be performing scheduled maintenance on " + format(date, "PPP") + 
        ` at ${startTime}. Please save your work before this time.`
      );
    }
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    if (maintenanceStartDate) {
      const fullDate = getFullDateTime(maintenanceStartDate, time);
      setMaintenanceStartDate(fullDate);
      
      setAnnouncementMessage(
        "We will be performing scheduled maintenance on " + 
        format(maintenanceStartDate, "PPP") + 
        ` at ${time}. Please save your work before this time.`
      );
    }
  };

  const handleEndTimeChange = (time: string) => {
    setEndTime(time);
    if (maintenanceEndDate) {
      const fullDate = getFullDateTime(maintenanceEndDate, time);
      setMaintenanceEndDate(fullDate);
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter an announcement message",
        variant: "destructive",
      });
      return;
    }

    setSendingAnnouncement(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          maintenance_announcement: announcementMessage,
          maintenance_announced_at: new Date().toISOString()
        } as SystemSettings)
        .eq('id', 1);

      if (error) throw error;

      toast({
        title: "Announcement Sent",
        description: "Maintenance announcement has been sent to all users",
      });
    } catch (error: any) {
      console.error("Error sending announcement:", error);
      toast({
        title: "Error",
        description: `Failed to send announcement: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSendingAnnouncement(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
        <CardDescription>
          When maintenance mode is enabled, users will not be able to access the system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="maintenance-mode"
            checked={maintenanceMode}
            onCheckedChange={setMaintenanceMode}
          />
          <Label htmlFor="maintenance-mode">Enable Maintenance Mode</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance-message">Maintenance Message</Label>
          <Textarea
            id="maintenance-message"
            placeholder="Enter a message to display to users during maintenance..."
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Maintenance Start</Label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left w-full",
                      !maintenanceStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {maintenanceStartDate ? format(maintenanceStartDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={maintenanceStartDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <div className="flex-1 relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Maintenance End</Label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left w-full",
                      !maintenanceEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {maintenanceEndDate ? format(maintenanceEndDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={maintenanceEndDate}
                    onSelect={setMaintenanceEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <div className="flex-1 relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  type="time"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-message">Maintenance Announcement</Label>
            <Textarea
              id="announcement-message"
              placeholder="Enter an announcement message to send to all users..."
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              This message will be displayed to all users as a notification.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAnnouncementMessage(
                "We will be performing scheduled maintenance on " + 
                (maintenanceStartDate ? format(maintenanceStartDate, "PPP") : "") +
                ` at ${startTime}. Please save your work before this time.`
              )}
            >
              Reset Message
            </Button>
            <Button 
              size="sm"
              disabled={sendingAnnouncement}
              onClick={sendAnnouncement}
            >
              <Send className="mr-2 h-4 w-4" />
              {sendingAnnouncement ? "Sending..." : "Send Announcement"}
            </Button>
          </div>
        </div>

        {maintenanceMode && (
          <Button
            variant="destructive"
            onClick={onCancelMaintenance}
            disabled={isLoading}
            className="w-full mt-4"
          >
            Cancel Maintenance Mode
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
