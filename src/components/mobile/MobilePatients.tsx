
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Users, 
  Phone,
  FileText,
  DollarSign,
  ArrowLeft,
  Plus
} from "lucide-react";
import { hapticFeedback } from "@/utils/mobileUtils";

interface Patient {
  id: number;
  name: string;
  phone_number: string;
  status: string;
  created_at: string;
  total_spent: number;
  prescription_count: number;
}

export function MobilePatients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          prescriptions:prescriptions (
            id,
            bills:bills (
              total_amount
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processedPatients = (data || []).map(patient => {
        const allBills = patient.prescriptions?.flatMap(p => p.bills || []) || [];
        const totalSpent = allBills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
        
        return {
          ...patient,
          total_spent: totalSpent,
          prescription_count: patient.prescriptions?.length || 0
        };
      });

      setPatients(processedPatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchQuery) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone_number.includes(searchQuery)
    );

    setFilteredPatients(filtered);
  };

  const handleBack = async () => {
    await hapticFeedback('light');
    navigate(-1);
  };

  const handleCreatePrescription = async (patientId: number) => {
    await hapticFeedback('medium');
    navigate(`/billing?patientId=${patientId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Patients</h1>
              <p className="text-blue-100">{patients.length} total patients</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/billing')}
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
          />
        </div>
      </div>

      {/* Patients List */}
      <div className="p-6 space-y-4">
        {filteredPatients.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No patients found" : "No patients yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? "Try searching with different keywords" 
                  : "Create your first prescription to add a patient"
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/billing')} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Prescription
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{patient.name}</h3>
                    <div className="flex items-center space-x-1 text-gray-600 mt-1">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{patient.phone_number}</span>
                    </div>
                  </div>
                  <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                    {patient.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Prescriptions</p>
                      <p className="font-semibold">{patient.prescription_count}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Total Spent</p>
                      <p className="font-semibold">₹{patient.total_spent.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/prescriptions?patient=${patient.id}`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCreatePrescription(patient.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Prescription
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
