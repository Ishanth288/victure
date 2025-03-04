import { useState, useEffect } from "react";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User, FileText, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function Prescriptions() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("active");

  useEffect(() => {
    checkAuth();
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [searchQuery, prescriptions, activeTab]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login to view prescriptions",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          patient:patients (name),
          bills (id, total_amount)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      
      const prescriptionsWithTotal = data?.map(prescription => {
        const totalAmount = prescription.bills?.reduce((sum: number, bill: any) => 
          sum + (bill.total_amount || 0), 0);
        
        return {
          ...prescription,
          total_amount: totalAmount || 0
        };
      }) || [];

      setPrescriptions(prescriptionsWithTotal);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    const filtered = prescriptions.filter((prescription) => {
      if (activeTab !== "all" && prescription.status !== activeTab) {
        return false;
      }

      const matchesSearch =
        searchQuery === "" ||
        prescription.prescription_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.patient?.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    setFilteredPrescriptions(filtered);
  };

  const handleCreateBill = (prescriptionId: number) => {
    navigate(`/billing?prescriptionId=${prescriptionId}`);
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from("prescriptions")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setPrescriptions(prev => 
        prev.map(prescription => 
          prescription.id === id
            ? { ...prescription, status: newStatus }
            : prescription
        )
      );

      toast({
        title: "Status Updated",
        description: `Prescription marked as ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating prescription status:", error);
      toast({
        title: "Error",
        description: "Failed to update prescription status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold">Prescriptions</h1>

          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="mt-4 sm:mt-0">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Input
          placeholder="Search by prescription number, doctor or patient name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md mb-6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrescriptions.length === 0 ? (
            <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No patients found</p>
            </div>
          ) : (
            filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium">{prescription.patient?.name}</h3>
                      <Badge 
                        variant={prescription.status === 'active' ? 'default' : 'secondary'}
                      >
                        {prescription.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        <span>Dr. {prescription.doctor_name}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        <span>Rx #{prescription.prescription_number}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{format(new Date(prescription.date), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>₹{prescription.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      className="flex-1 rounded-none py-2"
                      onClick={() => handleToggleStatus(prescription.id, prescription.status)}
                    >
                      Mark {prescription.status === 'active' ? 'Inactive' : 'Active'}
                    </Button>
                    
                    {(prescription.bills?.length === 0 || !prescription.bills) && prescription.status === 'active' && (
                      <Button 
                        variant="ghost" 
                        className="flex-1 rounded-none py-2 text-primary border-l border-gray-100"
                        onClick={() => handleCreateBill(prescription.id)}
                      >
                        Create Bill
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
