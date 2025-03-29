
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, getDay, addMonths, subMonths } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  description?: string;
}

export function CalendarComponent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  const [newEvent, setNewEvent] = useState<{
    title: string;
    date: Date;
    time: string;
    description: string;
  }>({
    title: "",
    date: new Date(),
    time: "09:00",
    description: "",
  });

  // Days of the week header
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Generate days for the current month view
  const daysInMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysArray = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add empty spaces for days before the 1st of the month
    const startDay = getDay(monthStart);
    const emptyDaysBefore = Array(startDay).fill(null);
    
    return [...emptyDaysBefore, ...daysArray];
  };
  
  // Get all calendar days including empty cells
  const allDays = daysInMonth();
  
  // Find events for a specific day
  const getEventsForDay = (day: Date | null) => {
    if (!day) return [];
    return events.filter(event => day && isSameDay(new Date(event.date), day));
  };
  
  // Handle navigation to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Handle navigation to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Handle day selection
  const handleDateSelect = (day: Date | null) => {
    if (day) {
      setSelectedDate(day);
      setNewEvent(prev => ({ ...prev, date: day }));
    }
  };
  
  // Handle creating a new event
  const handleCreateEvent = () => {
    if (newEvent.title.trim() === "") return;
    
    const createdEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      description: newEvent.description,
    };
    
    setEvents(prev => [...prev, createdEvent]);
    setShowEventDialog(false);
    setNewEvent({
      title: "",
      date: selectedDate || new Date(),
      time: "09:00",
      description: "",
    });
  };
  
  // Create calendar grid cells
  const renderCalendarCells = () => {
    return allDays.map((day, index) => {
      const dayEvents = getEventsForDay(day);
      const isCurrentDay = day && isSameDay(day, new Date());
      const isSelected = selectedDate && day && isSameDay(day, selectedDate);
      
      return (
        <div 
          key={index} 
          className={`h-14 border p-1 relative ${!day ? 'bg-gray-50' : 'cursor-pointer hover:bg-gray-50'} 
            ${isCurrentDay ? 'bg-blue-50' : ''} 
            ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
          onClick={() => day && handleDateSelect(day)}
        >
          {day && (
            <>
              <div className="text-xs font-medium mb-1">
                {format(day, "d")}
              </div>
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 right-1 left-1">
                  {dayEvents.length <= 2 ? (
                    dayEvents.map((event, i) => (
                      <div key={event.id} className="text-xs truncate bg-blue-100 px-1 rounded mb-0.5">
                        {event.title}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="text-xs truncate bg-blue-100 px-1 rounded mb-0.5">
                        {dayEvents[0].title}
                      </div>
                      <div className="text-xs text-center bg-blue-100 rounded">
                        +{dayEvents.length - 1} more
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      );
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle>Calendar</CardTitle>
        <Button onClick={() => setShowEventDialog(true)} variant="default" size="sm">
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Event
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-7 gap-0">
          {/* Day names */}
          {weekDays.map(day => (
            <div key={day} className="text-center font-medium text-xs py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {renderCalendarCells()}
        </div>
      </CardContent>
      
      {/* Add Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={newEvent.title} 
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                placeholder="Event title"
              />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Calendar
                mode="single"
                selected={newEvent.date}
                onSelect={(date) => date && setNewEvent({...newEvent, date})}
                className="rounded-md border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <Input 
                id="time" 
                type="time" 
                value={newEvent.time} 
                onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input 
                id="description" 
                value={newEvent.description} 
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                placeholder="Event description"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateEvent}>Create Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
