
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

interface SecurityCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SecurityCodeModal({ isOpen, onClose }: SecurityCodeModalProps) {
  const [securityCode, setSecurityCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!securityCode) {
      toast({
        title: "Error",
        description: "Please enter the security code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      // For enhanced security, we'll check the code using a server-side edge function
      const { data, error } = await supabase.functions.invoke('verify-admin-code', {
        body: { code: securityCode }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.verified) {
        toast({
          title: "Success",
          description: "Admin access granted",
        });
        onClose();
        navigate('/admin');
      } else {
        toast({
          title: "Access Denied",
          description: "Invalid security code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast({
        title: "Error",
        description: "Failed to verify security code",
        variant: "destructive",
      });
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
          <Input
            placeholder="Enter security code"
            type="password"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value)}
            className="text-center text-lg tracking-widest"
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
