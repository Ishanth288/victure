
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, FileText, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface BillingSearchInterfaceProps {
  onPrescriptionFound: (prescriptionData: any) => void;
  onCreateNew: () => void;
}

export function BillingSearchInterface({ onPrescriptionFound, onCreateNew }: BillingSearchInterfaceProps) {
  const [prescriptionNumber, setPrescriptionNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const validatePrescriptionNumber = (number: string): boolean => {
    // Basic validation for prescription number format
    return /^PRE-\d+$/.test(number.trim());
  };

  const handleDirectEntry = async () => {
    if (!prescriptionNumber.trim()) {
      toast({
        title: "Prescription Number Required",
        description: "Please enter a prescription number",
        variant: "destructive",
      });
      return;
    }

    if (!validatePrescriptionNumber(prescriptionNumber)) {
      toast({
        title: "Invalid Format",
        description: "Prescription number should be in format: PRE-123",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          patient:patients(name, phone_number)
        `)
        .eq("prescription_number", prescriptionNumber.trim())
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        onPrescriptionFound(data);
        toast({
          title: "Prescription Found",
          description: `Loaded prescription ${prescriptionNumber}`,
        });
      } else {
        // Create new prescription with this number
        onCreateNew();
        toast({
          title: "Creating New Prescription",
          description: `Prescription ${prescriptionNumber} will be created`,
        });
      }
    } catch (error) {
      console.error("Error processing prescription:", error);
      toast({
        title: "Error",
        description: "Failed to process prescription number",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!prescriptionNumber.trim()) {
      toast({
        title: "Prescription Number Required",
        description: "Please enter a prescription number to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          patient:patients(name, phone_number)
        `)
        .ilike("prescription_number", `%${prescriptionNumber.trim()}%`)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        // For now, take the first match
        onPrescriptionFound(data[0]);
        toast({
          title: "Prescription Found",
          description: `Found ${data.length} matching prescription(s)`,
        });
      } else {
        toast({
          title: "No Prescriptions Found",
          description: "No prescriptions match your search",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching prescriptions:", error);
      toast({
        title: "Search Error",
        description: "Failed to search prescriptions",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDirectEntry();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-xl font-semibold text-gray-800">
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            Start Billing
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Enter prescription number or search existing prescriptions
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prescription-number" className="text-sm font-medium text-gray-700">
              Prescription Number
            </Label>
            <div className="relative">
              <Input
                id="prescription-number"
                value={prescriptionNumber}
                onChange={(e) => setPrescriptionNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter prescription number (e.g., PRE-123)"
                className="pl-10 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                disabled={isLoading || isSearching}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleDirectEntry}
              disabled={isLoading || isSearching || !prescriptionNumber.trim()}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Enter Prescription Number"
              )}
            </Button>

            <Button 
              onClick={handleSearch}
              disabled={isLoading || isSearching || !prescriptionNumber.trim()}
              variant="outline"
              className="w-full h-12 border-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg font-medium"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Prescriptions
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            <Button 
              onClick={onCreateNew}
              variant="outline"
              className="w-full h-12 border-2 border-green-200 text-green-700 hover:bg-green-50 rounded-lg font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Prescription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
