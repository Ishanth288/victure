
import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PrescriptionStatusControlProps {
  prescriptionId: number;
  currentStatus: string;
  onStatusChange: () => void;
}

export default function PrescriptionStatusControl({
  prescriptionId,
  currentStatus,
  onStatusChange
}: PrescriptionStatusControlProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleStatusChange = async () => {
    try {
      setIsUpdating(true);
      
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to update prescription status",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase
        .from("prescriptions")
        .update({ status: newStatus })
        .eq("id", prescriptionId)
        .eq("user_id", user.id); // Ensure the user can only modify their own prescriptions
        
      if (error) throw error;
      
      toast({
        title: "Status Updated",
        description: `Prescription marked as ${newStatus}`,
      });
      
      onStatusChange();
    } catch (error) {
      console.error("Error updating prescription status:", error);
      toast({
        title: "Error",
        description: "Failed to update prescription status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const isActive = currentStatus === 'active';
  
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={handleStatusChange}
      disabled={isUpdating}
      className={isActive ? "bg-green-600 hover:bg-green-700" : "text-gray-500"}
    >
      {isActive ? (
        <>
          <Check className="h-4 w-4 mr-1" /> Active
        </>
      ) : (
        <>
          <X className="h-4 w-4 mr-1" /> Inactive
        </>
      )}
    </Button>
  );
}
