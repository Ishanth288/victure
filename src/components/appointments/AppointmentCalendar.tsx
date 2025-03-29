
import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { AppointmentForm } from "./AppointmentForm";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Appointment = {
  id: string;
  title: string;
  patientId: number;
  patientName: string;
  date: Date;
  time: string;
  duration: number;
  status: "scheduled" | "completed" | "canceled";
  notes?: string;
};

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onAddAppointment: (appointment: Omit<Appointment, "id">) => Promise<void>;
  onSelectAppointment: (appointment: Appointment) => void;
  isLoading?: boolean;
}

export function AppointmentCalendar({
  appointments,
  onAddAppointment,
  onSelectAppointment,
  isLoading = false
}: AppointmentCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const dateStr = appointment.date.toDateString();
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const appointmentsForSelectedDate = date
    ? appointmentsByDate[date.toDateString()] || []
    : [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Appointments</CardTitle>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            Add Appointment
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        <div className="md:w-1/2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className={cn("p-3 pointer-events-auto")}
            modifiers={{
              hasAppointment: (day) => {
                return !!appointmentsByDate[day.toDateString()];
              }
            }}
            modifiersClassNames={{
              hasAppointment: "bg-primary/20 font-bold text-primary"
            }}
          />
        </div>
        <div className="md:w-1/2 overflow-auto">
          <h3 className="font-medium mb-2">
            {date ? (
              <>Appointments for {date.toLocaleDateString()}</>
            ) : (
              "Select a date"
            )}
          </h3>
          
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
              ))}
            </div>
          ) : appointmentsForSelectedDate.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No appointments for this date
            </div>
          ) : (
            <div className="space-y-2">
              {appointmentsForSelectedDate.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => onSelectAppointment(appointment)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{appointment.title}</h4>
                      <p className="text-sm text-gray-500">
                        {appointment.time} · {appointment.patientName}
                      </p>
                    </div>
                    <Badge
                      variant={
                        appointment.status === "completed"
                          ? "default"
                          : appointment.status === "canceled"
                          ? "destructive"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for a patient.
            </DialogDescription>
          </DialogHeader>
          <AppointmentForm 
            initialDate={date}
            onSubmit={async (data) => {
              await onAddAppointment(data);
              setIsAddDialogOpen(false);
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
