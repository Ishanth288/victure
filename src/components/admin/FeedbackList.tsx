
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Loader2 } from "lucide-react";

interface Feedback {
  id: string;
  email: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export function FeedbackList() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("unread");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeTab === "unread") {
        query = query.eq("is_read", false);
      } else if (activeTab === "read") {
        query = query.eq("is_read", true);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching feedback:", error);
        throw error;
      }
      
      setFeedback(data || []);
      console.log("Feedback data fetched:", data?.length || 0, "items");
    } catch (error: any) {
      console.error("Error fetching feedback:", error);
      toast({
        title: "Failed to load feedback",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Listen for real-time feedback updates
  useEffect(() => {
    fetchFeedback();

    const channel = supabase
      .channel("feedback-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feedback" },
        (payload) => {
          // When new feedback comes in, refresh the list
          console.log("New feedback received via realtime:", payload);
          fetchFeedback();
          toast({
            title: "New feedback received",
            description: "Someone just submitted new feedback",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
      
      // Update local state
      setFeedback(feedback.map(item => 
        item.id === id ? { ...item, is_read: true } : item
      ));
      
      toast({
        title: "Feedback marked as read",
      });
    } catch (error: any) {
      console.error("Error marking feedback as read:", error);
      toast({
        title: "Failed to update feedback",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFeedback();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && !isRefreshing) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Feedback Management</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {feedback.filter(f => !f.is_read).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {feedback.filter(f => !f.is_read).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
      </Tabs>

      {isRefreshing ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-2 text-muted-foreground">Refreshing feedback...</span>
        </div>
      ) : feedback.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No feedback found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <Card key={item.id} className={`p-6 ${!item.is_read ? 'border-l-4 border-l-primary' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{item.email}</p>
                  <p className="text-sm text-gray-500">{formatDate(item.created_at)}</p>
                </div>
                {!item.is_read && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => markAsRead(item.id)}
                  >
                    Mark as read
                  </Button>
                )}
                {item.is_read && (
                  <Badge variant="outline">Read</Badge>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-md mt-2">
                <p className="whitespace-pre-wrap">{item.message}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
