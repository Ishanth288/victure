
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Plus, Phone, Calendar, User, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface Patient {
  id: number;
  name: string;
  phone_number: string;
  patient_type?: string;
  created_at: string;
  prescriptions?: any[];
}

const OptimizedMobilePatients: React.FC = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletePatientId, setDeletePatientId] = useState<number | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          prescriptions(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePatient = async (patientId: number) => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;

      setPatients(prev => prev.filter(p => p.id !== patientId));
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
    }
    setDeletePatientId(null);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone_number.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-teal-800 mb-2">Patients</h1>
          <p className="text-teal-600">Manage patient records</p>
        </div>

        {/* Add Patient Button */}
        <Button className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-medium py-3 rounded-xl shadow-lg">
          <Plus className="w-5 h-5 mr-2" />
          Add New Patient
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-3 rounded-xl border-gray-200 focus:border-teal-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-teal-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-teal-800">{patients.length}</div>
              <div className="text-xs text-gray-600">Total Patients</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-blue-800">
                {patients.filter(p => new Date(p.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length}
              </div>
              <div className="text-xs text-gray-600">This Month</div>
            </CardContent>
          </Card>
        </div>

        {/* Patients List */}
        <div className="space-y-3 pb-20">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No patients found</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.id} className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{patient.name}</h3>
                        <div className="flex items-center text-xs text-gray-600 mt-1">
                          <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{patient.phone_number}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Properly positioned */}
                    <div className="flex items-center space-x-2 ml-2">
                      {patient.patient_type && (
                        <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                          {patient.patient_type}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-red-50"
                        onClick={() => setDeletePatientId(patient.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Registered: {new Date(patient.created_at).toLocaleDateString()}</span>
                    <span>{patient.prescriptions?.length || 0} prescriptions</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletePatientId} onOpenChange={() => setDeletePatientId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Patient</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this patient? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePatientId && handleDeletePatient(deletePatientId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default OptimizedMobilePatients;
