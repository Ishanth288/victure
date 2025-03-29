
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { CalendarIcon, AlertTriangle } from "lucide-react";

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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {maintenanceStartDate ? format(maintenanceStartDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={maintenanceStartDate}
                  onSelect={setMaintenanceStartDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {maintenanceEndDate ? format(maintenanceEndDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={maintenanceEndDate}
                  onSelect={setMaintenanceEndDate}
                  disabled={(date) => 
                    date < new Date() || 
                    (maintenanceStartDate ? date < maintenanceStartDate : false)
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Enabling maintenance mode will prevent all users from logging in or registering until the maintenance period ends or is manually cancelled.
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
