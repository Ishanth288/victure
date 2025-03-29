
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar as CalendarIcon } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: Date;
  type: 'meeting' | 'reminder' | 'appointment';
}

export function CalendarComponent() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([
    { id: '1', title: 'Supplier Meeting', date: new Date(2023, 5, 10), type: 'meeting' },
    { id: '2', title: 'Inventory Check', date: new Date(2023, 5, 15), type: 'reminder' },
    { id: '3', title: 'Doctor Appointment', date: new Date(2023, 5, 20), type: 'appointment' }
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<{title: string, type: Event['type']}>({
    title: '',
    type: 'reminder'
  });

  const addEvent = () => {
    if (newEvent.title.trim() === '' || !date) return;
    
    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: date,
      type: newEvent.type
    };
    
    setEvents([...events, event]);
    setNewEvent({ title: '', type: 'reminder' });
    setIsDialogOpen(false);
  };

  // Get events for the selected date
  const selectedDateEvents = events.filter(event => 
    date && 
    event.date.getDate() === date.getDate() &&
    event.date.getMonth() === date.getMonth() &&
    event.date.getFullYear() === date.getFullYear()
  );

  // Function to determine if a date has events
  const hasEvent = (day: Date) => {
    return events.some(event => 
      event.date.getDate() === day.getDate() &&
      event.date.getMonth() === day.getMonth() &&
      event.date.getFullYear() === day.getFullYear()
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Calendar</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogDescription>
                  Create a new event or reminder for your calendar.
                </DialogDescription>
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
                  <Label htmlFor="type">Type</Label>
                  <select 
                    id="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value as Event['type']})}
                  >
                    <option value="reminder">Reminder</option>
                    <option value="meeting">Meeting</option>
                    <option value="appointment">Appointment</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <div className="border rounded-md p-2">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={addEvent}>Save Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{
                hasEvent: (day) => hasEvent(day),
              }}
              modifiersStyles={{
                hasEvent: { 
                  fontWeight: 'bold', 
                  backgroundColor: 'rgba(136, 132, 216, 0.1)',
                  color: '#8884d8'
                }
              }}
            />
          </div>
          <div>
            <h3 className="font-medium mb-2 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              {date?.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <div className="space-y-2">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map(event => (
                  <div 
                    key={event.id}
                    className={`p-2 rounded-md ${
                      event.type === 'meeting' ? 'bg-blue-50 border-blue-200' : 
                      event.type === 'reminder' ? 'bg-yellow-50 border-yellow-200' : 
                      'bg-green-50 border-green-200'
                    } border`}
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs capitalize text-gray-600">{event.type}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No events scheduled for this date</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
