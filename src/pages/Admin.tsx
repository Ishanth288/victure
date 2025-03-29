
import { useState, useEffect } from "react";
import { FeedbackList } from "@/components/admin/FeedbackList";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, MessageSquare, Settings, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingPlaceholder } from "@/components/ui/loading-placeholder";

export default function Admin() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    userCount: 0,
    feedbackCount: 0
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAdminStats = async () => {
    setIsLoading(true);

    try {
      // Get user count
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get feedback count
      const { count: feedbackCount, error: feedbackError } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true });

      if (userError) console.error('Error fetching user count:', userError);
      if (feedbackError) console.error('Error fetching feedback count:', feedbackError);

      setStats({
        userCount: userCount || 0,
        feedbackCount: feedbackCount || 0
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Portal</h1>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={fetchAdminStats}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingPlaceholder height="h-10" pulseHeight="h-6" pulseWidth="w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats.userCount}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Feedback Messages
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingPlaceholder height="h-10" pulseHeight="h-6" pulseWidth="w-12" />
              ) : (
                <div className="text-2xl font-bold">{stats.feedbackCount}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Last Updated
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingPlaceholder height="h-10" pulseHeight="h-6" pulseWidth="w-24" />
              ) : (
                <div className="text-sm font-medium">
                  {lastRefresh.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="feedback" className="space-y-4">
          <TabsList>
            <TabsTrigger value="feedback">Feedback Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="feedback" className="space-y-4">
            <FeedbackList />
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  User management features will be added soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  System settings features will be added soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
