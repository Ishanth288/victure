
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type PlanType = "Free Trial" | "PRO" | "PRO PLUS";

interface User {
  id: string;
  email?: string;
  role?: string;
  plan_type: PlanType;
  created_at?: string;
  pharmacy_name?: string;
}

export function PlanManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, PlanType>>({});
  const [processingUsers, setProcessingUsers] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive"
        });
        return;
      }

      const fetchedUsers: User[] = data.map(user => ({
        ...user,
        plan_type: (user.plan_type as PlanType) || "Free Trial"
      }));
      
      setUsers(fetchedUsers);
      
      // Initialize selected plans with current values
      const initialPlans: Record<string, PlanType> = {};
      fetchedUsers.forEach(user => {
        initialPlans[user.id] = user.plan_type;
      });
      setSelectedPlans(initialPlans);
      
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePlanChange = (userId: string, plan: PlanType) => {
    setSelectedPlans(prev => ({
      ...prev,
      [userId]: plan
    }));
  };

  const handleUpgrade = async (userId: string) => {
    setProcessingUsers(prev => [...prev, userId]);
    
    try {
      const newPlan = selectedPlans[userId];
      
      const { error } = await supabase
        .from('profiles')
        .update({ plan_type: newPlan })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update local users state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, plan_type: newPlan } 
          : user
      ));

      toast({
        title: "Plan Updated",
        description: `User plan has been updated to ${newPlan}`,
        variant: "success"
      });
      
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the user plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingUsers(prev => prev.filter(id => id !== userId));
    }
  };

  if (loading) {
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
        <h2 className="text-2xl font-bold">User Plan Management</h2>
        <Button size="sm" onClick={fetchUsers}>
          Refresh
        </Button>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-base">{user.pharmacy_name || "Unnamed Pharmacy"}</CardTitle>
                    <CardDescription>{user.email || user.id}</CardDescription>
                  </div>
                  <Badge className={`
                    ${user.plan_type === "PRO" ? "bg-blue-500" : 
                      user.plan_type === "PRO PLUS" ? "bg-green-500" : "bg-gray-500"}
                  `}>
                    {user.plan_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">Change plan to:</div>
                    <Select
                      value={selectedPlans[user.id] || user.plan_type}
                      onValueChange={(value) => handlePlanChange(user.id, value as PlanType)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Free Trial">Free Trial</SelectItem>
                        <SelectItem value="PRO">PRO</SelectItem>
                        <SelectItem value="PRO PLUS">PRO PLUS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => handleUpgrade(user.id)}
                    disabled={
                      processingUsers.includes(user.id) || 
                      selectedPlans[user.id] === user.plan_type
                    }
                  >
                    {processingUsers.includes(user.id) 
                      ? "Updating..." 
                      : "Update Plan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
