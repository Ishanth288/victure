
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CalendarIcon, Settings, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function SystemSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string | null;
  }>({
    type: null,
    message: null,
  });

  // Maintenance settings state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "The system is currently undergoing scheduled maintenance. Please try again later."
  );
  const [maintenanceStartDate, setMaintenanceStartDate] = useState<Date | undefined>(new Date());
  const [maintenanceEndDate, setMaintenanceEndDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default: 7 days from now
  );

  // System settings state
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [sessionTimeout, setSessionTimeout] = useState(60); // in minutes
  const [enableTwoFactor, setEnableTwoFactor] = useState(false);
  const [ipRestriction, setIpRestriction] = useState(false);
  const [allowedIPs, setAllowedIPs] = useState("");

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setMaintenanceMode(data.maintenance_mode || false);
        setMaintenanceMessage(data.maintenance_message || "The system is currently undergoing scheduled maintenance. Please try again later.");
        setMaintenanceStartDate(data.maintenance_start_date ? new Date(data.maintenance_start_date) : new Date());
        setMaintenanceEndDate(data.maintenance_end_date ? new Date(data.maintenance_end_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setMaxLoginAttempts(data.max_login_attempts || 5);
        setSessionTimeout(data.session_timeout || 60);
        setEnableTwoFactor(data.enable_two_factor || false);
        setIpRestriction(data.ip_restriction || false);
        setAllowedIPs(data.allowed_ips || "");
      }
    } catch (error: any) {
      console.error("Error fetching system settings:", error.message);
      setStatusMessage({
        type: 'error',
        message: `Failed to load system settings: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSystemSettings = async () => {
    setIsLoading(true);
    setStatusMessage({ type: null, message: null });

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1, // Using a single row for system settings
          maintenance_mode: maintenanceMode,
          maintenance_message: maintenanceMessage,
          maintenance_start_date: maintenanceStartDate?.toISOString(),
          maintenance_end_date: maintenanceEndDate?.toISOString(),
          max_login_attempts: maxLoginAttempts,
          session_timeout: sessionTimeout,
          enable_two_factor: enableTwoFactor,
          ip_restriction: ipRestriction,
          allowed_ips: allowedIPs,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setStatusMessage({
        type: 'success',
        message: 'System settings saved successfully'
      });

      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error saving system settings:", error.message);
      setStatusMessage({
        type: 'error',
        message: `Failed to save settings: ${error.message}`
      });

      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelMaintenance = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          maintenance_mode: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;

      setMaintenanceMode(false);
      setStatusMessage({
        type: 'success',
        message: 'Maintenance mode has been cancelled'
      });

      toast({
        title: "Maintenance Cancelled",
        description: "Maintenance mode has been turned off.",
      });
    } catch (error: any) {
      console.error("Error canceling maintenance:", error.message);
      setStatusMessage({
        type: 'error',
        message: `Failed to cancel maintenance: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <Button disabled={isLoading} onClick={saveSystemSettings}>
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {statusMessage.type && (
        <Alert 
          variant={statusMessage.type === 'error' ? 'destructive' : 'default'} 
          className={`mb-4 
            ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : ''} 
            ${statusMessage.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' : ''}
          `}
        >
          {statusMessage.type === 'error' ? (
            <AlertTriangle className="h-4 w-4" />
          ) : statusMessage.type === 'info' ? (
            <Info className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {statusMessage.type === 'error' ? 'Error' : statusMessage.type === 'info' ? 'Information' : 'Success'}
          </AlertTitle>
          <AlertDescription>
            {statusMessage.message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="maintenance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="maintenance">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="security">
            <Settings className="mr-2 h-4 w-4" />
            Security Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
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
                  onClick={cancelMaintenance}
                  disabled={isLoading}
                >
                  Cancel Maintenance
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security settings for the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-login-attempts">Maximum Login Attempts</Label>
                <Input
                  id="max-login-attempts"
                  type="number"
                  min={1}
                  max={10}
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Number of login attempts allowed before temporarily locking the account.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  min={5}
                  max={1440}
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Time in minutes before an inactive session expires.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="two-factor" 
                    checked={enableTwoFactor} 
                    onCheckedChange={setEnableTwoFactor}
                  />
                  <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Require two-factor authentication for all admin users.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="ip-restriction" 
                    checked={ipRestriction} 
                    onCheckedChange={setIpRestriction}
                  />
                  <Label htmlFor="ip-restriction">Enable IP Restriction for Admin Panel</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allowed-ips">Allowed IP Addresses (comma-separated)</Label>
                  <Input
                    id="allowed-ips"
                    value={allowedIPs}
                    onChange={(e) => setAllowedIPs(e.target.value)}
                    placeholder="e.g., 192.168.1.1, 10.0.0.1"
                    disabled={!ipRestriction}
                  />
                  <p className="text-sm text-muted-foreground">
                    Only these IP addresses will be allowed to access the admin panel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
