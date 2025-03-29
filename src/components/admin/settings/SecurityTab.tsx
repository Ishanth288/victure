
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SecurityTabProps {
  maxLoginAttempts: number;
  setMaxLoginAttempts: (value: number) => void;
  sessionTimeout: number;
  setSessionTimeout: (value: number) => void;
  enableTwoFactor: boolean;
  setEnableTwoFactor: (value: boolean) => void;
  ipRestriction: boolean;
  setIpRestriction: (value: boolean) => void;
  allowedIPs: string;
  setAllowedIPs: (value: string) => void;
}

export function SecurityTab({
  maxLoginAttempts,
  setMaxLoginAttempts,
  sessionTimeout,
  setSessionTimeout,
  enableTwoFactor,
  setEnableTwoFactor,
  ipRestriction,
  setIpRestriction,
  allowedIPs,
  setAllowedIPs
}: SecurityTabProps) {
  return (
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
  );
}
