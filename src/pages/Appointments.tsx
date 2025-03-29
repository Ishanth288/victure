
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AppointmentCalendar, Appointment } from "@/components/appointments/AppointmentCalendar";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { supabase } from "@/integrations/supabase/client";
import { executeWithRetry } from "@/utils/supabaseErrorHandling";

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await executeWithRetry<any[]>(
        async () => {
          return await supabase
            .from('appointments')
            .select(`
              id, 
              title, 
              date, 
              time, 
              duration, 
              status, 
              notes, 
              patient_id,
              patients(name)
            `)
            .eq('user_id', user.id);
        },
        { context: 'fetching appointments' }
      );

      if (error) {
        throw error;
      }

      if (data) {
        const formattedAppointments = data.map(appointment => ({
          id: appointment.id,
          title: appointment.title,
          date: new Date(appointment.date),
          time: appointment.time,
          duration: appointment.duration,
          status: appointment.status,
          notes: appointment.notes,
          patientId: appointment.patient_id,
          patientName: appointment.patients?.name || 'Unknown Patient'
        }));
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleAddAppointment = async (appointment: Omit<Appointment, "id">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await executeWithRetry(
        async () => {
          return await supabase
            .from('appointments')
            .insert({
              title: appointment.title,
              date: appointment.date.toISOString().split('T')[0],
              time: appointment.time,
              duration: appointment.duration,
              status: appointment.status,
              notes: appointment.notes,
              patient_id: appointment.patientId,
              user_id: user.id
            })
            .select();
        },
        { context: 'adding appointment' }
      );

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Appointment created successfully"
      });

      loadAppointments();
    } catch (error) {
      console.error("Error adding appointment:", error);
      toast({
        title: "Error",
        description: "Failed to create appointment",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAppointment = async (appointment: Omit<Appointment, "id">) => {
    if (!selectedAppointment) return;
    
    try {
      const { error } = await executeWithRetry(
        async () => {
          return await supabase
            .from('appointments')
            .update({
              title: appointment.title,
              date: appointment.date.toISOString().split('T')[0],
              time: appointment.time,
              duration: appointment.duration,
              status: appointment.status,
              notes: appointment.notes,
              patient_id: appointment.patientId
            })
            .eq('id', selectedAppointment.id);
        },
        { context: 'updating appointment' }
      );

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Appointment updated successfully"
      });

      setSelectedAppointment(null);
      loadAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Appointments</h1>
        
        <AppointmentCalendar 
          appointments={appointments}
          onAddAppointment={handleAddAppointment}
          onSelectAppointment={setSelectedAppointment}
          isLoading={isLoading}
        />
        
        <Dialog 
          open={!!selectedAppointment} 
          onOpenChange={(open) => {
            if (!open) setSelectedAppointment(null);
          }}
        >
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Edit Appointment</DialogTitle>
              <DialogDescription>
                Make changes to this appointment.
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <AppointmentForm 
                initialData={selectedAppointment}
                onSubmit={handleUpdateAppointment}
                onCancel={() => setSelectedAppointment(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
