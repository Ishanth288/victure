
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlanType, upgradeUserPlan } from "@/services/planManagement";
import { Badge } from "@/components/ui/badge";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  email: string;
  role: string;
  plan_type: PlanType;
  created_at: string;
  pharmacy_name: string;
}

export function PlanManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, PlanType>>({});
  const [processingUsers, setProcessingUsers] = useState<string[]>([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const usersQuery = query(collection(db, "profiles"), orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(usersQuery);
      
      const fetchedUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as User;
        fetchedUsers.push({
          ...userData,
          id: doc.id,
          plan_type: (userData.plan_type as PlanType) || "Free Trial"
        });
        
        // Initialize selected plans with current values
        setSelectedPlans(prev => ({
          ...prev,
          [doc.id]: (userData.plan_type as PlanType) || "Free Trial"
        }));
      });
      
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
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
      const success = await upgradeUserPlan(userId, newPlan);
      
      if (success) {
        // Update local users state
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, plan_type: newPlan } 
            : user
        ));
      }
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
                    <CardDescription>{user.email}</CardDescription>
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
