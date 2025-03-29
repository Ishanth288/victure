
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, AlertTriangle } from "lucide-react";
import { typecastQuery } from "@/utils/safeSupabaseQueries";
import { MaintenanceTab } from "@/components/admin/settings/MaintenanceTab";
import { SecurityTab } from "@/components/admin/settings/SecurityTab";
import { StatusMessage } from "@/components/admin/settings/StatusMessage";

interface SystemSettingsData {
  maintenance_mode: boolean;
  maintenance_message: string;
  maintenance_start_date: string | null;
  maintenance_end_date: string | null;
  max_login_attempts: number;
  session_timeout: number;
  enable_two_factor: boolean;
  ip_restriction: boolean;
  allowed_ips: string | null;
}

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
      const { data, error } = await typecastQuery('system_settings')
        .select('*')
        .eq('id', 1)
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
      const { error } = await typecastQuery('system_settings')
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
      const { error } = await typecastQuery('system_settings')
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

      <StatusMessage type={statusMessage.type} message={statusMessage.message} />

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
          <MaintenanceTab 
            maintenanceMode={maintenanceMode}
            setMaintenanceMode={setMaintenanceMode}
            maintenanceMessage={maintenanceMessage}
            setMaintenanceMessage={setMaintenanceMessage}
            maintenanceStartDate={maintenanceStartDate}
            setMaintenanceStartDate={setMaintenanceStartDate}
            maintenanceEndDate={maintenanceEndDate}
            setMaintenanceEndDate={setMaintenanceEndDate}
            isLoading={isLoading}
            onCancelMaintenance={cancelMaintenance}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab 
            maxLoginAttempts={maxLoginAttempts}
            setMaxLoginAttempts={setMaxLoginAttempts}
            sessionTimeout={sessionTimeout}
            setSessionTimeout={setSessionTimeout}
            enableTwoFactor={enableTwoFactor}
            setEnableTwoFactor={setEnableTwoFactor}
            ipRestriction={ipRestriction}
            setIpRestriction={setIpRestriction}
            allowedIPs={allowedIPs}
            setAllowedIPs={setAllowedIPs}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
