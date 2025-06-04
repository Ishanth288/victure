import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Plus, Phone, Calendar, User, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileOptimizedWrapper } from "./MobileOptimizedWrapper";
import { hapticFeedback } from "@/utils/mobileUtils";

interface Patient {
  id: number;
  name: string;
  phone_number: string;
  patient_type?: string;
  created_at: string;
  prescriptions?: any[];
}

const MobilePatients: React.FC = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to access patient records');
      }

      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          prescriptions(count)
        `)
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
      
      // Haptic feedback for successful load
      await hapticFeedback('light');
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      setError(error.message || 'Failed to fetch patients');
      toast({
        title: "Error",
        description: error.message || "Failed to fetch patients",
        variant: "destructive",
      });
      
      // Haptic feedback for error
      await hapticFeedback('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await hapticFeedback('light');
    await fetchPatients();
  };

  const handlePatientSelect = async (patient: Patient) => {
    await hapticFeedback('light');
    // Navigation or selection logic would go here
    console.log('Selected patient:', patient);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone_number.includes(searchTerm)
  );

  const thisMonthPatients = patients.filter(p => 
    new Date(p.created_at) > new Date(Date.now() - 30*24*60*60*1000)
  ).length;

  const ErrorFallback = () => (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md border-red-200 bg-red-50/50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Patients Error
          </h3>
          <p className="text-sm text-red-600 mb-4">
            {error || 'Failed to load patient data'}
          </p>
          <Button onClick={handleRefresh} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <MobileOptimizedWrapper 
      loadingText="Loading patient records..."
      errorFallback={error ? <ErrorFallback /> : undefined}
      enableHaptics={true}
    >
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-4 mobile-scroll-container">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-teal-800 mb-2">Patients</h1>
            <p className="text-teal-600">Manage patient records</p>
          </div>

          {/* Add Patient Button */}
          <Button 
            onClick={() => hapticFeedback('light')}
            className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-medium py-3 rounded-xl shadow-lg mobile-touch-target"
          >
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
              className="pl-10 py-3 rounded-xl border-gray-200 focus:border-teal-500 mobile-touch-target"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm mobile-optimized">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-teal-800">{patients.length}</div>
                <div className="text-xs text-gray-600">Total Patients</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm mobile-optimized">
              <CardContent className="p-4 text-center">
                <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-blue-800">{thisMonthPatients}</div>
                <div className="text-xs text-gray-600">This Month</div>
              </CardContent>
            </Card>
          </div>

          {/* Patients List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading patients...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchTerm ? 'No patients match your search' : 'No patients found'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => hapticFeedback('light')}
                    className="mt-4"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Patient
                  </Button>
                )}
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className="border-0 shadow-md bg-white/80 backdrop-blur-sm mobile-optimized cursor-pointer transition-transform active:scale-95"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-green-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                          <div className="flex items-center text-xs text-gray-600 mt-1">
                            <Phone className="w-3 h-3 mr-1" />
                            {patient.phone_number}
                          </div>
                        </div>
                      </div>
                      {patient.patient_type && (
                        <Badge variant="secondary" className="text-xs">
                          {patient.patient_type}
                        </Badge>
                      )}
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

          {/* Refresh Button */}
          {patients.length > 0 && (
            <div className="text-center pt-4">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="mobile-touch-target"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Users className="w-4 h-4 mr-2" />
                )}
                Refresh Patients
              </Button>
            </div>
          )}
        </div>
      </div>
    </MobileOptimizedWrapper>
  );
};

export default MobilePatients;
