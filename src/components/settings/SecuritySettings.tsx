
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | null; message: string | null }>({
    type: null,
    message: null
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage({ type: null, message: null });
    
    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      setStatusMessage({
        type: 'error',
        message: "New passwords don't match"
      });
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setStatusMessage({
        type: 'error',
        message: "New password must be at least 6 characters long"
      });
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // First verify current password by trying to sign in
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getSession()).data.session?.user?.email || "",
        password: currentPassword
      });

      if (signInError) {
        setStatusMessage({
          type: 'error',
          message: "Current password is incorrect"
        });
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (updateError) throw updateError;

      setStatusMessage({
        type: 'success',
        message: "Password updated successfully"
      });
      toast({
        title: "Success",
        description: "Password updated successfully"
      });
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
    } catch (error: any) {
      console.error("Password update error:", error);
      setStatusMessage({
        type: 'error',
        message: error.message
      });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Update your password and security preferences</CardDescription>
      </CardHeader>
      <CardContent>
        {statusMessage.type && (
          <Alert 
            variant={statusMessage.type === 'error' ? 'destructive' : 'default'} 
            className={`mb-4 ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : ''}`}
          >
            {statusMessage.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {statusMessage.type === 'error' ? 'Error' : 'Success'}
            </AlertTitle>
            <AlertDescription>
              {statusMessage.message}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
