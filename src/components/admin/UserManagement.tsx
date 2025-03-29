
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { executeWithRetry } from "@/utils/queryRetry";

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  pharmacy_name: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const result = await executeWithRetry(
        () => supabase
          .from('profiles')
          .select('id, email:id, role, created_at, pharmacy_name')
          .order('created_at', { ascending: false }),
        { context: 'fetching users' }
      );

      if (result.data) {
        setUsers(result.data);
      }
      
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-bold">User Accounts</h2>
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
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {user.role || "user"}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Manage Access
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
