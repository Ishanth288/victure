
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";
import { BarChart3, Users, Settings, MessageSquare, CreditCard } from "lucide-react";

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  dashboardContent: ReactNode;
  systemContent: ReactNode;
  feedbackContent: ReactNode;
  usersContent: ReactNode;
  planContent: ReactNode;
}

export function AdminTabs({
  activeTab,
  onTabChange,
  dashboardContent,
  systemContent,
  feedbackContent,
  usersContent,
  planContent
}: AdminTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="grid grid-cols-5 w-full md:w-auto">
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden md:inline">Dashboard</span>
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden md:inline">Users</span>
        </TabsTrigger>
        <TabsTrigger value="plans" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span className="hidden md:inline">Plans</span>
        </TabsTrigger>
        <TabsTrigger value="feedback" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden md:inline">Feedback</span>
        </TabsTrigger>
        <TabsTrigger value="system" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden md:inline">System</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboard" className="space-y-4">
        {dashboardContent}
      </TabsContent>
      
      <TabsContent value="users" className="space-y-4">
        {usersContent}
      </TabsContent>
      
      <TabsContent value="plans" className="space-y-4">
        {planContent}
      </TabsContent>
      
      <TabsContent value="feedback" className="space-y-4">
        {feedbackContent}
      </TabsContent>
      
      <TabsContent value="system" className="space-y-4">
        {systemContent}
      </TabsContent>
    </Tabs>
  );
}
