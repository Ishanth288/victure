
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  DollarSign, Package, Users, FileText, AlertCircle, Activity,
  Calendar, CheckSquare, TrendingUp, Clock, ClipboardList
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/insights/StatCard";
import { TimeframeSelector } from "@/components/insights/TimeframeSelector";
import { RevenueChart } from "@/components/insights/RevenueChart";
import { format, subDays, parseISO } from "date-fns";
import { safelyGetData } from "@/utils/supabaseHelpers";

// Task management component
function TaskManagement() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Order weekly supplies", completed: false },
    { id: 2, title: "Check expiring medications", completed: true },
    { id: 3, title: "Update inventory counts", completed: false },
    { id: 4, title: "Follow up with supplier", completed: false },
    { id: 5, title: "Staff meeting at 10am", completed: true }
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = (title: string) => {
    if (!title.trim()) return;
    const newTask = {
      id: Math.max(0, ...tasks.map(t => t.id)) + 1,
      title,
      completed: false
    };
    setTasks([...tasks, newTask]);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          Pharmacy Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Add a new task..."
              className="flex-1 px-3 py-2 border rounded-md text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTask(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button 
              size="sm"
              onClick={() => {
                const input = document.querySelector('input') as HTMLInputElement;
                addTask(input.value);
                input.value = '';
              }}
            >
              Add
            </Button>
          </div>
          
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className={`flex items-center gap-2 p-2 rounded border ${task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}
              >
                <input 
                  type="checkbox" 
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className={task.completed ? 'line-through text-gray-500' : ''}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Calendar component
function CalendarEvents() {
  const [events, setEvents] = useState([
    { id: 1, title: "Supplier Meeting", date: "2023-10-15", time: "10:00 AM" },
    { id: 2, title: "Inventory Audit", date: "2023-10-16", time: "2:00 PM" },
    { id: 3, title: "Staff Training", date: "2023-10-18", time: "9:00 AM" },
    { id: 4, title: "Delivery Expected", date: "2023-10-19", time: "11:30 AM" }
  ]);

  // Just using the current date for all events to simulate upcoming events
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.map(event => ({...event, date: today}));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
          {upcomingEvents.map(event => (
            <div key={event.id} className="p-3 border rounded-md">
              <div className="font-medium">{event.title}</div>
              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {event.time}
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full">
            View Full Calendar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Document Management component
function DocumentManagement() {
  const documents = [
    { id: 1, title: "Pharmacy License", type: "PDF", date: "2023-01-15" },
    { id: 2, title: "Employee Handbook", type: "DOCX", date: "2023-03-22" },
    { id: 3, title: "Supplier Contracts", type: "PDF", date: "2023-06-10" },
    { id: 4, title: "Inventory Procedures", type: "PDF", date: "2023-08-05" },
    { id: 5, title: "Emergency Protocols", type: "DOCX", date: "2023-09-18" }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Important Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
          {documents.map(doc => (
            <div 
              key={doc.id} 
              className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded flex items-center justify-center ${
                  doc.type === 'PDF' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {doc.type}
                </div>
                <span>{doc.title}</span>
              </div>
              <span className="text-xs text-gray-500">{doc.date}</span>
            </div>
          ))}
          <Button variant="outline" className="w-full mt-2">
            Upload Document
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalInventory, setTotalInventory] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      // Fetch inventory data
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', session.user.id);
      
      // Process low stock items
      const lowStock = safelyGetData(inventoryData)?.filter((item: any) => 
        item.quantity <= item.reorder_point
      ).slice(0, 5) || [];
      
      setLowStockItems(lowStock);
      
      // Calculate total inventory value
      const inventoryValue = safelyGetData(inventoryData)?.reduce((total: number, item: any) => 
        total + (item.quantity * item.unit_cost), 0
      ) || 0;
      
      setTotalInventory(inventoryValue);
      
      // Fetch revenue data
      const { data: billsData } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', session.user.id);
      
      // Calculate total revenue
      const revenue = safelyGetData(billsData)?.reduce((total: number, bill: any) => 
        total + (bill.total_amount || 0), 0
      ) || 0;
      
      setTotalRevenue(revenue);
      
      // Generate revenue chart data
      const days = timeframe === 'day' ? 1 : 
                  timeframe === 'week' ? 7 : 
                  timeframe === 'month' ? 30 : 365;
      
      const revenueByDate: Record<string, number> = {};
      
      // Initialize dates
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        revenueByDate[date] = 0;
      }
      
      // Aggregate revenue by date
      safelyGetData(billsData)?.forEach((bill: any) => {
        const billDate = bill.created_at ? format(parseISO(bill.created_at), 'yyyy-MM-dd') : null;
        
        if (billDate && revenueByDate[billDate] !== undefined) {
          revenueByDate[billDate] += (bill.total_amount || 0);
        }
      });
      
      // Convert to array for chart
      const chartData = Object.entries(revenueByDate)
        .map(([date, value]) => ({ date, value }))
        .reverse();
      
      setRevenueData(chartData);
      setIsLoading(false);
    }
    
    fetchDashboardData();
  }, [navigate, timeframe]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Revenue" 
            value={`₹${totalRevenue.toLocaleString()}`} 
            icon={DollarSign} 
            trend={5.2} 
          />
          <StatCard 
            title="Inventory Value" 
            value={`₹${totalInventory.toLocaleString()}`} 
            icon={Package} 
            trend={-1.5} 
          />
          <StatCard 
            title="Active Prescriptions" 
            value="42" 
            icon={FileText} 
            trend={3.8} 
          />
          <StatCard 
            title="Total Patients" 
            value="128" 
            icon={Users} 
            trend={7.1} 
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Revenue Overview</CardTitle>
              <TimeframeSelector timeframe={timeframe} onTimeframeChange={setTimeframe} />
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueData} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : lowStockItems.length > 0 ? (
                <div className="space-y-4">
                  {lowStockItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.generic_name}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${item.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          {item.quantity} left
                        </p>
                        <p className="text-xs text-gray-500">Reorder at: {item.reorder_point}</p>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/inventory')}
                  >
                    View All Inventory
                  </Button>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No low stock items found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="tasks">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Task Management
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="mt-4">
            <TaskManagement />
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-4">
            <CalendarEvents />
          </TabsContent>
          
          <TabsContent value="documents" className="mt-4">
            <DocumentManagement />
          </TabsContent>
        </Tabs>
        
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/business-optimization')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            View Business Optimization
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
