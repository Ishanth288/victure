
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, Users } from "lucide-react";
import { ReactNode } from "react";

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  dashboardContent: ReactNode;
  systemContent: ReactNode;
  feedbackContent: ReactNode;
  usersContent: ReactNode;
}

export function AdminTabs({ 
  activeTab, 
  onTabChange,
  dashboardContent,
  systemContent,
  feedbackContent,
  usersContent
}: AdminTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
        <TabsTrigger value="dashboard" className="flex items-center">
          <div className="flex gap-2 items-center">
            <Settings className="h-4 w-4" />
            <span>Dashboard</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="system" className="flex items-center">
          <div className="flex gap-2 items-center">
            <Settings className="h-4 w-4" />
            <span>System Settings</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="feedback" className="flex items-center">
          <div className="flex gap-2 items-center">
            <Bell className="h-4 w-4" />
            <span>Feedback</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center">
          <div className="flex gap-2 items-center">
            <Users className="h-4 w-4" />
            <span>User Management</span>
          </div>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard">
        {dashboardContent}
      </TabsContent>

      <TabsContent value="system">
        {systemContent}
      </TabsContent>

      <TabsContent value="feedback">
        {feedbackContent}
      </TabsContent>

      <TabsContent value="users">
        {usersContent}
      </TabsContent>
    </Tabs>
  );
}
