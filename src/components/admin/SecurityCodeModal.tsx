
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";

interface SecurityCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (verified: boolean) => void;
}

export function SecurityCodeModal({ isOpen, onClose, onVerified }: SecurityCodeModalProps) {
  const [securityCode, setSecurityCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!securityCode) {
      setError("Please enter the security code");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // For enhanced security, we'll check the code using a server-side edge function
      const { data, error: functionError } = await supabase.functions.invoke('verify-admin-code', {
        body: { code: securityCode }
      });

      if (functionError) {
        console.error("Function error:", functionError);
        throw new Error(functionError.message || "Failed to verify code");
      }

      if (data?.verified) {
        toast({
          title: "Success",
          description: "Admin access granted",
        });
        
        if (onVerified) {
          onVerified(true);
        } else {
          onClose();
          navigate('/admin');
        }
      } else {
        setError("Invalid security code. Please try again.");
        toast({
          title: "Access Denied",
          description: "Invalid security code",
          variant: "destructive",
        });
        
        if (onVerified) {
          onVerified(false);
        }
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setError("Failed to verify code. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to verify security code",
        variant: "destructive",
      });
      
      if (onVerified) {
        onVerified(false);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Access Verification
          </DialogTitle>
          <DialogDescription>
            Please enter the admin security code to access the admin portal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Input
            placeholder="Enter security code"
            type="password"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value)}
            className="text-center text-lg tracking-widest"
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isVerifying}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={isVerifying}>
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
