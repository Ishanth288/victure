import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Search, 
  Calendar, 
  User, 
  Pill, 
  Clock, 
  Filter,
  Plus,
  Eye,
  ChevronLeft,
  ArrowUpDown,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { hapticFeedback } from "@/utils/mobileUtils";

interface Prescription {
  id: string;
  prescription_number: string;
  doctor_name: string;
  date: string;
  status: 'active' | 'completed' | 'cancelled';
  patient?: {
    name: string;
  };
}

const MobilePrescriptions: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          id,
          prescription_number,
          doctor_name,
          date,
          status,
          patients!inner(name)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: String(item.id), // Convert to string to match interface
        prescription_number: item.prescription_number,
        doctor_name: item.doctor_name || 'Not Specified',
        date: item.date,
        status: item.status as 'active' | 'completed' | 'cancelled',
        patient: item.patients ? { name: item.patients.name } : undefined
      })) || [];

      setPrescriptions(formattedData);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const patientName = prescription.patient?.name || '';
    const matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prescription.prescription_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleBack = async () => {
    await hapticFeedback('light');
    navigate('/mobile');
  };

  const handleViewPrescription = async (id: string) => {
    await hapticFeedback('light');
    navigate(`/prescriptions?id=${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-green';
      case 'active': return 'badge-yellow';
      case 'cancelled': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center safe-area-all">
        <div className="text-center animate-bounce-in">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse-apple"></div>
            <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <FileText className="w-10 h-10 text-white" />
            </div>
          </div>
          <p className="text-title-3 font-semibold text-gray-900 dark:text-white mb-2">Loading Prescriptions</p>
          <p className="text-body text-gray-600 dark:text-gray-400">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 safe-area-all">
      <div className="max-w-md mx-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={handleBack} 
              variant="ghost" 
              size="sm"
              className="btn-apple focus-ring p-2 -ml-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-title-2 font-bold text-gray-900 dark:text-white">Prescriptions</h1>
            <Button
              onClick={() => navigate('/billing')}
              variant="ghost"
              size="sm"
              className="btn-apple focus-ring p-2 -mr-2"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="px-6 pb-32 space-y-6">
          {/* Search and Filter */}
          <div className="space-y-4 pt-6 animate-slide-down">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search prescriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-apple pl-12 focus-ring"
              />
            </div>

            <div className="flex space-x-3 overflow-x-auto pb-2">
              {['all', 'active', 'completed', 'cancelled'].map((status) => (
                <Button
                  key={status}
                  onClick={async () => {
                    await hapticFeedback('light');
                    setFilterStatus(status);
                  }}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  className={`btn-apple focus-ring whitespace-nowrap ${
                    filterStatus === status 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                      : 'btn-secondary'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 animate-slide-up">
            <div className="card-apple p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-title-2 font-bold text-gray-900 dark:text-white">{prescriptions.length}</p>
                  <p className="text-caption-1 text-gray-600 dark:text-gray-400">Total</p>
                </div>
              </div>
            </div>
            
            <div className="card-apple p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-title-2 font-bold text-gray-900 dark:text-white">
                    {prescriptions.filter(p => p.status === 'active').length}
                  </p>
                  <p className="text-caption-1 text-gray-600 dark:text-gray-400">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prescriptions List */}
          <div className="space-y-4 animate-slide-up">
            {filteredPrescriptions.length === 0 ? (
              <div className="card-glass p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-title-3 font-semibold text-gray-900 dark:text-white mb-2">
                  No prescriptions found
                </h3>
                <p className="text-body text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Create your first prescription'}
                </p>
                <Button
                  onClick={() => navigate('/billing')}
                  className="btn-apple btn-primary focus-ring"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Prescription
                </Button>
              </div>
            ) : (
              filteredPrescriptions.map((prescription, index) => (
                <div
                  key={prescription.id}
                  className="card-apple p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-callout font-semibold text-gray-900 dark:text-white">
                          {prescription.patient?.name || 'Unknown Patient'}
                        </h3>
                        <p className="text-caption-2 text-gray-600 dark:text-gray-400">
                          {formatDate(prescription.date)}
                        </p>
                      </div>
                    </div>
                    <div className={`badge-apple ${getStatusColor(prescription.status)}`}>
                      {prescription.status}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-footnote text-gray-600 dark:text-gray-400">
                      <Pill className="w-4 h-4 mr-2" />
                      Dr. {prescription.doctor_name}
                    </div>
                    <div className="flex items-center text-footnote text-gray-600 dark:text-gray-400">
                      <Star className="w-4 h-4 mr-2" />
                      #{prescription.prescription_number}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleViewPrescription(prescription.id)}
                    className="w-full btn-apple btn-secondary focus-ring"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePrescriptions;
