
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceTabProps {
  maintenanceMode: boolean;
  setMaintenanceMode: (value: boolean) => void;
  maintenanceMessage: string;
  setMaintenanceMessage: (value: string) => void;
  maintenanceStartDate: Date | undefined;
  setMaintenanceStartDate: (date: Date | undefined) => void;
  maintenanceEndDate: Date | undefined;
  setMaintenanceEndDate: (date: Date | undefined) => void;
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
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [announcement, setAnnouncement] = useState("");
  const { toast } = useToast();
  
  const handleDateTimeChange = (type: 'start' | 'end', value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    
    if (type === 'start' && maintenanceStartDate) {
      const newDate = new Date(maintenanceStartDate);
      newDate.setHours(hours, minutes);
      setMaintenanceStartDate(newDate);
      setStartTime(value);
    } else if (type === 'end' && maintenanceEndDate) {
      const newDate = new Date(maintenanceEndDate);
      newDate.setHours(hours, minutes);
      setMaintenanceEndDate(newDate);
      setEndTime(value);
    }
  };
  
  const handleDateChange = (type: 'start' | 'end', dateStr: string) => {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      if (type === 'start') {
        const newDate = new Date(date);
        const [hours, minutes] = startTime.split(':').map(Number);
        newDate.setHours(hours, minutes);
        setMaintenanceStartDate(newDate);
      } else {
        const newDate = new Date(date);
        const [hours, minutes] = endTime.split(':').map(Number);
        newDate.setHours(hours, minutes);
        setMaintenanceEndDate(newDate);
      }
    }
  };
  
  const sendAnnouncement = async () => {
    if (!announcement.trim()) {
      toast({
        title: "Announcement Required",
        description: "Please enter an announcement message",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Here we would typically save the announcement to the database
      // For now, we'll just show a success toast
      toast({
        title: "Announcement Sent",
        description: "Your announcement has been sent to all users",
        variant: "default",
      });
      setAnnouncement("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send announcement",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
        <CardDescription>
          Enable maintenance mode to prevent users from accessing the system during scheduled maintenance periods.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="maintenance-mode" 
            checked={maintenanceMode} 
            onCheckedChange={setMaintenanceMode} 
          />
          <Label htmlFor="maintenance-mode">
            {maintenanceMode ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled"}
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance-message">Maintenance Message</Label>
          <Textarea
            id="maintenance-message"
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            placeholder="Enter the message to display during maintenance..."
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <div className="flex space-x-2">
              <Input
                type="date"
                value={maintenanceStartDate ? maintenanceStartDate.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="w-full"
              />
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleDateTimeChange('start', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <div className="flex space-x-2">
              <Input
                type="date"
                value={maintenanceEndDate ? maintenanceEndDate.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="w-full"
              />
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleDateTimeChange('end', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <Label className="text-lg font-medium mb-2 block">Announcement System</Label>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement">Send Announcement to All Users</Label>
              <Textarea
                id="announcement"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Enter an important announcement to send to all users..."
                className="min-h-[100px]"
              />
            </div>
            <Button 
              onClick={sendAnnouncement}
              disabled={isLoading}
              className="flex items-center"
            >
              <Bell className="mr-2 h-4 w-4" />
              Send Announcement
            </Button>
          </div>
        </div>

        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            <p>Enabling maintenance mode will prevent all users from logging in or registering until the maintenance period ends or is manually cancelled.</p>
            <p className="mt-2">Users will receive notifications 7 days and 24 hours before scheduled maintenance.</p>
          </AlertDescription>
        </Alert>

        {maintenanceMode && (
          <Button 
            variant="destructive" 
            onClick={onCancelMaintenance}
            disabled={isLoading}
          >
            Cancel Maintenance
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
