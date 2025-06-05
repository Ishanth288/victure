
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { safeSupabaseQuery } from "@/utils/supabaseErrorHandling";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays, User, MessageSquare, Mail, Search } from "lucide-react";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  pharmacy_name: string;
  plan_type: string;
  city: string | null;
  state: string | null;
  registration_date: string;
  trial_expiration_date: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, planFilter, selectedDate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const result = await safeSupabaseQuery(
        () => supabase
          .from('profiles')
          .select('id, pharmacy_name, role, created_at, plan_type, city, state, registration_date, trial_expiration_date')
          .order('created_at', { ascending: false }),
        'fetching users'
      );

      if (result.error) {
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (result.data) {
        const formattedUsers = result.data.map(user => ({
          id: user.id,
          email: user.id, // Using ID as email placeholder since we can't access auth.users
          role: user.role || 'user',
          created_at: user.created_at,
          pharmacy_name: user.pharmacy_name || 'Unnamed Pharmacy',
          plan_type: user.plan_type,
          city: user.city,
          state: user.state,
          registration_date: user.registration_date,
          trial_expiration_date: user.trial_expiration_date,
        }));
        
        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      }
      
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        user => 
          user.email.toLowerCase().includes(term) || 
          user.pharmacy_name.toLowerCase().includes(term) ||
          (user.city && user.city.toLowerCase().includes(term)) ||
          (user.state && user.state.toLowerCase().includes(term))
      );
    }
    
    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Plan filter
    if (planFilter !== "all") {
      filtered = filtered.filter(user => user.plan_type === planFilter);
    }
    
    // Date filter
    if (selectedDate && isValid(selectedDate)) {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      filtered = filtered.filter(
        user => user.created_at.substring(0, 10) === dateString
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}.`,
      });
      
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: `Failed to update user role: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (userId: string, newPlan: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ plan_type: newPlan })
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, plan_type: newPlan } : user
      ));
      
      toast({
        title: "Plan updated",
        description: `User plan has been updated to ${newPlan}.`,
      });
      
    } catch (error: any) {
      console.error("Error updating user plan:", error);
      toast({
        title: "Error",
        description: `Failed to update user plan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setPlanFilter("all");
    setSelectedDate(undefined);
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Accounts</h2>
        <Button size="sm" onClick={fetchUsers} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="Free Trial">Free Trial</SelectItem>
                <SelectItem value="PRO">PRO</SelectItem>
                <SelectItem value="PRO PLUS">PRO PLUS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Filter by date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
                {selectedDate && (
                  <div className="p-3 border-t border-border">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedDate(undefined)}
                    >
                      Clear Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found
          </p>
          {(searchTerm || roleFilter !== "all" || planFilter !== "all" || selectedDate) && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-base hover:text-primary cursor-pointer" onClick={() => openUserDetails(user)}>
                      {user.pharmacy_name || "Unnamed Pharmacy"}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={cn(
                      "px-2 py-1",
                      user.role === "admin" ? "bg-purple-500" : 
                      user.role === "owner" ? "bg-blue-500" : 
                      "bg-gray-500"
                    )}>
                      {user.role || "user"}
                    </Badge>
                    <Badge className={cn(
                      "px-2 py-1",
                      user.plan_type === "PRO" ? "bg-green-500" : 
                      user.plan_type === "PRO PLUS" ? "bg-yellow-500" : 
                      "bg-gray-500"
                    )}>
                      {user.plan_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    <span className="inline-block mr-2">Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                    {user.city && user.state && (
                      <span className="inline-block">
                        Location: {user.city}, {user.state}
                      </span>
                    )}
                    {user.plan_type === "Free Trial" && user.trial_expiration_date && (
                      <span className="inline-block ml-2">
                        Trial expires: {new Date(user.trial_expiration_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Select 
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      defaultValue={user.role}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Change role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      onValueChange={(value) => handlePlanChange(user.id, value)}
                      defaultValue={user.plan_type}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Change plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Free Trial">Free Trial</SelectItem>
                        <SelectItem value="PRO">PRO</SelectItem>
                        <SelectItem value="PRO PLUS">PRO PLUS</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openUserDetails(user)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  View and manage user information
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="details" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>Activity</span>
                  </TabsTrigger>
                  <TabsTrigger value="communication" className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Communication</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <div className="text-sm mt-1">{selectedUser.email}</div>
                    </div>
                    <div>
                      <Label>Pharmacy Name</Label>
                      <div className="text-sm mt-1">{selectedUser.pharmacy_name}</div>
                    </div>
                    <div>
                      <Label>Role</Label>
                      <div className="text-sm mt-1">
                        <Badge className={cn(
                          "px-2 py-1",
                          selectedUser.role === "admin" ? "bg-purple-500" : 
                          selectedUser.role === "owner" ? "bg-blue-500" : 
                          "bg-gray-500"
                        )}>
                          {selectedUser.role || "user"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Plan</Label>
                      <div className="text-sm mt-1">
                        <Badge className={cn(
                          "px-2 py-1",
                          selectedUser.plan_type === "PRO" ? "bg-green-500" : 
                          selectedUser.plan_type === "PRO PLUS" ? "bg-yellow-500" : 
                          "bg-gray-500"
                        )}>
                          {selectedUser.plan_type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <div className="text-sm mt-1">
                        {selectedUser.city && selectedUser.state 
                          ? `${selectedUser.city}, ${selectedUser.state}` 
                          : "Not specified"}
                      </div>
                    </div>
                    <div>
                      <Label>Created At</Label>
                      <div className="text-sm mt-1">
                        {new Date(selectedUser.created_at).toLocaleString()}
                      </div>
                    </div>
                    {selectedUser.plan_type === "Free Trial" && selectedUser.trial_expiration_date && (
                      <div>
                        <Label>Trial Expiration</Label>
                        <div className="text-sm mt-1">
                          {new Date(selectedUser.trial_expiration_date).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="activity" className="space-y-4">
                  <div className="p-8 text-center text-muted-foreground">
                    <CalendarDays className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                    <p>User activity data will be available in a future update.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="communication" className="space-y-4">
                  <div className="p-8 text-center text-muted-foreground">
                    <Mail className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                    <p>Communication features will be available in a future update.</p>
                    <Button variant="outline" className="mt-4" disabled>
                      Send Message
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
