
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { AlertCircle, ClipboardList, Filter, Search, Pill, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Prescriptions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [prescriptionToUpdate, setPrescriptionToUpdate] = useState<number | null>(null);
  const [currentStatus, setCurrentStatus] = useState<"active" | "inactive">("active");

  useEffect(() => {
    checkAuth();
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [searchQuery, statusFilter, prescriptions]);

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
          patient:patients (
            id,
            name,
            phone_number
          )
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      setPrescriptions(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = [...prescriptions];
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(prescription => prescription.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(prescription => 
        prescription.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.prescription_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPrescriptions(filtered);
  };

  const handleToggleStatus = (prescriptionId: number, status: "active" | "inactive") => {
    setPrescriptionToUpdate(prescriptionId);
    setCurrentStatus(status);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!prescriptionToUpdate) return;
    
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      
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
        .eq("id", prescriptionToUpdate)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update local state
      setPrescriptions(prevPrescriptions => 
        prevPrescriptions.map(prescription => 
          prescription.id === prescriptionToUpdate
            ? { ...prescription, status: newStatus }
            : prescription
        )
      );

      toast({
        title: "Status Updated",
        description: `Prescription marked as ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating prescription status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update prescription status",
        variant: "destructive",
      });
    } finally {
      setShowStatusDialog(false);
      setPrescriptionToUpdate(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <p>Loading prescriptions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Prescriptions</h1>
          <div className="flex gap-2">
            <Button onClick={() => setStatusFilter("all")} variant={statusFilter === "all" ? "default" : "outline"}>
              All
            </Button>
            <Button onClick={() => setStatusFilter("active")} variant={statusFilter === "active" ? "default" : "outline"}>
              Active
            </Button>
            <Button onClick={() => setStatusFilter("inactive")} variant={statusFilter === "inactive" ? "default" : "outline"}>
              Inactive
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search by patient name, doctor or prescription number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredPrescriptions.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">No prescriptions found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{prescription.patient?.name || "Unknown Patient"}</CardTitle>
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prescription.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {prescription.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <User className="mr-2 h-4 w-4 text-gray-500" />
                      <span>Dr. {prescription.doctor_name}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Pill className="mr-2 h-4 w-4 text-gray-500" />
                      <span>Rx #{prescription.prescription_number}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <AlertCircle className="mr-2 h-4 w-4 text-gray-500" />
                      <span>Date: {format(new Date(prescription.date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(prescription.id, prescription.status)}
                    >
                      {prescription.status === "active" ? "Mark Inactive" : "Mark Active"}
                    </Button>
                    <Link to={`/billing?prescriptionId=${prescription.id}`}>
                      <Button size="sm">Create Bill</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Prescription Status</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this prescription as {currentStatus === "active" ? "inactive" : "active"}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmStatusChange}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
