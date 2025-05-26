
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, FileText, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionLookupProps {
  onPrescriptionFound: (prescriptionData: any) => void;
  onCreateNew: () => void;
}

export function PrescriptionLookup({ onPrescriptionFound, onCreateNew }: PrescriptionLookupProps) {
  const [prescriptionNumber, setPrescriptionNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

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
        .eq("prescription_number", prescriptionNumber.trim())
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Prescription Not Found",
            description: "No prescription found with this number. You can create a new one.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      onPrescriptionFound(data);
    } catch (error) {
      console.error("Error searching prescription:", error);
      toast({
        title: "Search Error",
        description: "Failed to search for prescription",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-xl font-semibold text-gray-800">
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            Prescription Lookup
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Enter prescription number to continue billing
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
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !prescriptionNumber.trim()}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              {isSearching ? "Searching..." : "Search Prescription"}
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
